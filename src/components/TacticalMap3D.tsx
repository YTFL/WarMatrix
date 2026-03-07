'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import {
  TacticalTerrainMapData,
  gridToWorldPosition,
} from '@/lib/tacticalTerrain';
import {
  TerrainPeak,
  TACTICAL_MIN_ELEVATION_M,
  normalizedHeightToMeters,
  buildProceduralHeightmap,
} from '@/lib/proceduralTerrainHeightmap';

interface TacticalMap3DProps {
  mapData: TacticalTerrainMapData;
  terrainVersionKey: string;
  isActive: boolean;
  terrainType?: string;
  scenarioTitle?: string;
  mapPeaks?: TerrainPeak[];
}

const TERRAIN_BASE_COLOR = 0x36454f;
const METERS_PER_WORLD_Z_UNIT = 62.5;
const BASE_Z_OFFSET = -0.35;
const WORLD_XY_SCALE = 4;

export function TacticalMap3D({
  mapData,
  terrainVersionKey,
  isActive,
  terrainType = 'Highland',
  scenarioTitle,
  mapPeaks,
}: TacticalMap3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainMeshRef = useRef<THREE.Object3D | null>(null);
  const unitGroupRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number | null>(null);
  const generatedTerrainKeyRef = useRef<string | null>(null);

  const gridInfo = useMemo(() => {
    const [cols, rows] = mapData.map_size;
    return {
      cols: Math.max(1, cols),
      rows: Math.max(1, rows),
    };
  }, [mapData.map_size]);

  const resizeRenderer = useCallback(() => {
    const mount = mountRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!mount || !renderer || !camera) return;

    const width = Math.max(1, mount.clientWidth || mount.offsetWidth || 1);
    const height = Math.max(1, mount.clientHeight || mount.offsetHeight || 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }, []);

  const clear3DScene = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (terrainMeshRef.current) {
      const terrainObject = terrainMeshRef.current;
      terrainObject.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          (mesh.geometry as THREE.BufferGeometry).dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat: THREE.Material) => mat.dispose());
          } else {
            (mesh.material as THREE.Material).dispose();
          }
        }
      });
      scene.remove(terrainObject);
      terrainMeshRef.current = null;
    }

    if (unitGroupRef.current) {
      const group = unitGroupRef.current;
      group.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          (mesh.geometry as THREE.BufferGeometry).dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat: THREE.Material) => mat.dispose());
          } else {
            (mesh.material as THREE.Material).dispose();
          }
        }
      });
      scene.remove(group);
      unitGroupRef.current = null;
    }

    const helperObject = scene.getObjectByName('wm-3d-helpers');
    if (helperObject) {
      scene.remove(helperObject);
    }
  }, []);

  const initializeScene = useCallback(() => {
    if (!mountRef.current || sceneRef.current) return;

    const mount = mountRef.current;
    const width = Math.max(1, mount.clientWidth || mount.offsetWidth || 1);
    const height = Math.max(1, mount.clientHeight || mount.offsetHeight || 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08131f);

    const camera = new THREE.PerspectiveCamera(60, width / Math.max(1, height), 0.1, 1000);
    camera.up.set(0, 0, 1);

    const maxAxis = Math.max(gridInfo.cols, gridInfo.rows);
    camera.position.set(0, -maxAxis * WORLD_XY_SCALE * 1.2, maxAxis * 0.9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.touchAction = 'auto';
    renderer.domElement.style.overscrollBehavior = 'none';
    renderer.domElement.style.pointerEvents = 'auto';
    renderer.domElement.style.userSelect = 'none';
    // Make canvas focusable so it receives pointer/keyboard focus for controls
    (renderer.domElement as HTMLCanvasElement).tabIndex = 0;
    // Prevent the context menu from appearing on right-drag which can block panning
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    // Focus canvas on pointer down so subsequent wheel/keyboard events target it
    renderer.domElement.addEventListener('pointerdown', () => {
      try { (renderer.domElement as HTMLCanvasElement).focus(); } catch (e) {}
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.screenSpacePanning = true;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.0;
    controls.panSpeed = 1.0;

    controls.minDistance = Math.max(4, maxAxis * WORLD_XY_SCALE * 0.35);
    controls.maxDistance = Math.max(30, maxAxis * WORLD_XY_SCALE * 4.0);
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;

    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    controls.target.set(0, 0, 0.4);
    camera.lookAt(controls.target);

    const ambient = new THREE.AmbientLight(0xffffff, 0.52);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.42);
    directional.position.set(30, -20, 40);
    directional.castShadow = false;
    scene.add(directional);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    resizeRenderer();
  }, [gridInfo.cols, gridInfo.rows, resizeRenderer]);

  const proceduralHeightmap = useMemo(
    () => buildProceduralHeightmap(
      terrainType,
      gridInfo.cols,
      gridInfo.rows,
      scenarioTitle ?? 'default_seed',
      mapPeaks,
    ),
    [terrainType, gridInfo.cols, gridInfo.rows, scenarioTitle, mapPeaks],
  );

  const getGridHeight = useCallback(
    (x: number, y: number) => {
      const hx = Math.max(0, Math.min(gridInfo.cols, x));
      const hy = Math.max(0, Math.min(gridInfo.rows, y));
      const idx = hy * (gridInfo.cols + 1) + hx;
      const h = proceduralHeightmap[idx] ?? 0;
      // Keep 3D elevation tied to 2D contour math (m = h*3100 + 180).
      const meters = normalizedHeightToMeters(h);
      return (meters - TACTICAL_MIN_ELEVATION_M) / METERS_PER_WORLD_Z_UNIT + BASE_Z_OFFSET;
    },
    [gridInfo.cols, gridInfo.rows, proceduralHeightmap],
  );

  const generateTerrain = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const cols = gridInfo.cols;
    const rows = gridInfo.rows;

    const geom = new THREE.PlaneGeometry(cols, rows, cols - 1, rows - 1);
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const colorValues = new Float32Array(pos.count * 3);
    let minTopHeight = Number.POSITIVE_INFINITY;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      const gx = Math.max(0, Math.min(cols - 1, Math.round(x + cols / 2 - 0.5)));
      const gy = Math.max(0, Math.min(rows - 1, Math.round(rows / 2 - y - 0.5)));
      const hx = Math.max(0, Math.min(cols, Math.round(x + cols / 2)));
      const hy = Math.max(0, Math.min(rows, Math.round(rows / 2 - y)));
      const idx = hy * (cols + 1) + hx;
      const hNorm = proceduralHeightmap[idx] ?? 0;
      const meters = normalizedHeightToMeters(hNorm);
      const height = (meters - TACTICAL_MIN_ELEVATION_M) / METERS_PER_WORLD_Z_UNIT + BASE_Z_OFFSET;
      minTopHeight = Math.min(minTopHeight, height);

      // Requirement: elevate terrain by writing directly to geometry Z coordinates.
      pos.setZ(i, height);

      const color = new THREE.Color(TERRAIN_BASE_COLOR);
      colorValues[i * 3] = color.r;
      colorValues[i * 3 + 1] = color.g;
      colorValues[i * 3 + 2] = color.b;
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colorValues, 3));
    geom.computeVertexNormals();

    const topMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.02,
      roughness: 0.88,
      flatShading: true,
      side: THREE.FrontSide,
    });

    const terrainGroup = new THREE.Group();

    const topMesh = new THREE.Mesh(geom, topMaterial);
    topMesh.receiveShadow = false;
    topMesh.castShadow = false;
    terrainGroup.add(topMesh);

    const groundZ = minTopHeight - 1.6;

    const baseMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(cols, rows, 1, 1),
      new THREE.MeshStandardMaterial({
        color: 0x9c8a74,
        metalness: 0.02,
        roughness: 0.92,
        side: THREE.DoubleSide,
      }),
    );
    baseMesh.position.set(0, 0, groundZ);
    terrainGroup.add(baseMesh);

    const makeWall = (points: Array<{ x: number; y: number; z: number }>) => {
      if (points.length < 2) return;

      const wallPositions: number[] = [];
      const wallColors: number[] = [];
      const wallColor = new THREE.Color(0x9c8a74);

      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];

        // Two triangles per segment to build a vertical quad.
        wallPositions.push(
          p0.x, p0.y, p0.z,
          p1.x, p1.y, p1.z,
          p1.x, p1.y, groundZ,
          p0.x, p0.y, p0.z,
          p1.x, p1.y, groundZ,
          p0.x, p0.y, groundZ,
        );

        for (let c = 0; c < 6; c++) {
          wallColors.push(wallColor.r, wallColor.g, wallColor.b);
        }
      }

      const wallGeometry = new THREE.BufferGeometry();
      wallGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wallPositions, 3));
      wallGeometry.setAttribute('color', new THREE.Float32BufferAttribute(wallColors, 3));
      wallGeometry.computeVertexNormals();

      const wallMesh = new THREE.Mesh(
        wallGeometry,
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          metalness: 0.02,
          roughness: 0.9,
          side: THREE.DoubleSide,
        }),
      );
      wallMesh.castShadow = false;
      wallMesh.receiveShadow = false;
      terrainGroup.add(wallMesh);
    };

    const getCorner = (hx: number, hy: number) => {
      const idx = hy * (cols + 1) + hx;
      const hNorm = proceduralHeightmap[idx] ?? 0;
      const meters = normalizedHeightToMeters(hNorm);
      const z = (meters - TACTICAL_MIN_ELEVATION_M) / METERS_PER_WORLD_Z_UNIT + BASE_Z_OFFSET;
      return {
        x: hx - cols / 2,
        y: rows / 2 - hy,
        z,
      };
    };

    const northEdge: Array<{ x: number; y: number; z: number }> = [];
    for (let hx = 0; hx <= cols; hx++) northEdge.push(getCorner(hx, 0));

    const eastEdge: Array<{ x: number; y: number; z: number }> = [];
    for (let hy = 0; hy <= rows; hy++) eastEdge.push(getCorner(cols, hy));

    const southEdge: Array<{ x: number; y: number; z: number }> = [];
    for (let hx = cols; hx >= 0; hx--) southEdge.push(getCorner(hx, rows));

    const westEdge: Array<{ x: number; y: number; z: number }> = [];
    for (let hy = rows; hy >= 0; hy--) westEdge.push(getCorner(0, hy));

    makeWall(northEdge);
    makeWall(eastEdge);
    makeWall(southEdge);
    makeWall(westEdge);

    terrainGroup.scale.set(WORLD_XY_SCALE, WORLD_XY_SCALE, 1);

    scene.add(terrainGroup);
    terrainMeshRef.current = terrainGroup;
  }, [gridInfo.cols, gridInfo.rows, mapData.terrain, proceduralHeightmap]);

  const placeUnits = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (unitGroupRef.current) {
      const previous = unitGroupRef.current;
      previous.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          (mesh.geometry as THREE.BufferGeometry).dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat: THREE.Material) => mat.dispose());
          } else {
            (mesh.material as THREE.Material).dispose();
          }
        }
      });
      scene.remove(previous);
      unitGroupRef.current = null;
    }

    const group = new THREE.Group();

    mapData.units.forEach((unit) => {
      const gx = Math.max(0, Math.min(gridInfo.cols - 1, Math.round(unit.x - 1)));
      const gy = Math.max(0, Math.min(gridInfo.rows - 1, Math.round(unit.y - 1)));

      const terrainHeight = getGridHeight(gx, gy);
      const { wx, wy } = gridToWorldPosition(gx, gy, gridInfo.cols, gridInfo.rows);
      const sx = wx * WORLD_XY_SCALE;
      const sy = wy * WORLD_XY_SCALE;
      const markerColor = unit.team === 'ally' ? 0x2563eb : unit.team === 'enemy' ? 0xdc2626 : 0xeab308;

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 14, 14),
        new THREE.MeshStandardMaterial({
          color: markerColor,
          emissive: markerColor,
          emissiveIntensity: 3.6,
          metalness: 0.04,
          roughness: 0.5,
        }),
      );
      marker.position.set(sx, sy, terrainHeight + 0.51);
      marker.castShadow = false;
      marker.receiveShadow = false;
      group.add(marker);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.66, 0.09, 8, 18),
        new THREE.MeshStandardMaterial({
          color: markerColor,
          emissive: markerColor,
          emissiveIntensity: 0.6,
          metalness: 0.02,
          roughness: 0.6,
        }),
      );
      ring.position.set(sx, sy, terrainHeight + 0.24);
      ring.rotation.x = Math.PI / 2;
      ring.castShadow = false;
      group.add(ring);

      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 14, 14),
        new THREE.MeshBasicMaterial({
          color: markerColor,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        }),
      );
      halo.position.set(sx, sy, terrainHeight + 0.51);
      group.add(halo);
    });

    scene.add(group);
    unitGroupRef.current = group;
  }, [getGridHeight, gridInfo.cols, gridInfo.rows, mapData.units]);

  useEffect(() => {
    initializeScene();

    const onResize = () => {
      resizeRenderer();
    };

    const observer = new ResizeObserver(() => {
      resizeRenderer();
    });

    if (mountRef.current) {
      observer.observe(mountRef.current);
    }

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, [initializeScene, resizeRenderer]);

  useEffect(() => {
    if (isActive) {
      resizeRenderer();
    }
  }, [isActive, resizeRenderer]);

  useEffect(() => {
    initializeScene();

    if (generatedTerrainKeyRef.current !== terrainVersionKey) {
      clear3DScene();
      generateTerrain();
      generatedTerrainKeyRef.current = terrainVersionKey;
    }

    placeUnits();

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }, [clear3DScene, generateTerrain, initializeScene, placeUnits, terrainVersionKey]);

  useEffect(() => {
    initializeScene();

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (!renderer || !scene || !camera || !controls) return;

    const renderLoop = () => {
      controls.update();
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(renderLoop);
    };

    if (isActive) {
      frameRef.current = requestAnimationFrame(renderLoop);
    }

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [isActive, initializeScene, terrainVersionKey]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      clear3DScene();
      controlsRef.current?.dispose();
      rendererRef.current?.dispose();

      const mount = mountRef.current;
      const renderer = rendererRef.current;
      if (mount && renderer) {
        mount.removeChild(renderer.domElement);
      }

      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      rendererRef.current = null;
      generatedTerrainKeyRef.current = null;
    };
  }, [clear3DScene]);

  return <div ref={mountRef} className="absolute inset-0" aria-label="3D Tactical Terrain View" />;
}
