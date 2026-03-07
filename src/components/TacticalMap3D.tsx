'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
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

export interface TacticalMap3DProps {
  mapData: TacticalTerrainMapData;
  terrainVersionKey: string;
  isActive: boolean;
  terrainType?: string;
  scenarioTitle?: string;
  mapPeaks?: TerrainPeak[];
  initialCameraPosition?: [number, number, number] | null;
  initialCameraTarget?: [number, number, number] | null;
  onCameraChange?: (position: [number, number, number], target: [number, number, number]) => void;
  onControlsReady?: (controls: TacticalMap3DControls | null) => void;
}

export interface TacticalMap3DControls {
  zoomIn: () => void;
  zoomOut: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
}

const TERRAIN_BASE_COLOR = 0x36454f;
const METERS_PER_WORLD_Z_UNIT = 62.5;
const BASE_Z_OFFSET = -0.35;
const WORLD_XY_SCALE = 4;

function TerrainGeometry({ proceduralHeightmap, cols, rows }: { proceduralHeightmap: Float32Array; cols: number; rows: number }) {
  const geometryData = useMemo(() => {
    const geom = new THREE.PlaneGeometry(cols, rows, cols - 1, rows - 1);
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const colorValues = new Float32Array(pos.count * 3);
    let minTopHeight = Number.POSITIVE_INFINITY;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const hx = Math.max(0, Math.min(cols, Math.round(x + cols / 2)));
      const hy = Math.max(0, Math.min(rows, Math.round(rows / 2 - y)));
      const idx = hy * (cols + 1) + hx;
      const hNorm = proceduralHeightmap[idx] ?? 0;
      const meters = normalizedHeightToMeters(hNorm);
      const height = (meters - TACTICAL_MIN_ELEVATION_M) / METERS_PER_WORLD_Z_UNIT + BASE_Z_OFFSET;
      minTopHeight = Math.min(minTopHeight, height);

      pos.setZ(i, height);

      const color = new THREE.Color(TERRAIN_BASE_COLOR);
      colorValues[i * 3] = color.r;
      colorValues[i * 3 + 1] = color.g;
      colorValues[i * 3 + 2] = color.b;
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colorValues, 3));
    geom.computeVertexNormals();

    const groundZ = minTopHeight - 1.6;

    // Walls
    const wallPositions: number[] = [];
    const wallColors: number[] = [];
    const wallColor = new THREE.Color(0x9c8a74);

    const getCorner = (hx: number, hy: number) => {
      const idx = hy * (cols + 1) + hx;
      const hNorm = proceduralHeightmap[idx] ?? 0;
      const meters = normalizedHeightToMeters(hNorm);
      const z = (meters - TACTICAL_MIN_ELEVATION_M) / METERS_PER_WORLD_Z_UNIT + BASE_Z_OFFSET;
      return { x: hx - cols / 2, y: rows / 2 - hy, z };
    };

    const makeWall = (points: Array<{ x: number; y: number; z: number }>) => {
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
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

    const wallGeometry = new THREE.BufferGeometry();
    wallGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wallPositions, 3));
    wallGeometry.setAttribute('color', new THREE.Float32BufferAttribute(wallColors, 3));
    wallGeometry.computeVertexNormals();

    return { geom, groundZ, wallGeometry };
  }, [cols, rows, proceduralHeightmap]);

  const { geom, groundZ, wallGeometry } = geometryData;

  return (
    <group scale={[WORLD_XY_SCALE, WORLD_XY_SCALE, 1]}>
      {/* Top mesh */}
      <mesh geometry={geom} receiveShadow={false} castShadow={false}>
        <meshStandardMaterial vertexColors metalness={0.02} roughness={0.88} flatShading side={THREE.FrontSide} />
      </mesh>

      {/* Base mesh underneath */}
      <mesh position={[0, 0, groundZ]}>
        <planeGeometry args={[cols, rows, 1, 1]} />
        <meshStandardMaterial color={0x9c8a74} metalness={0.02} roughness={0.92} side={THREE.DoubleSide} />
      </mesh>

      {/* Wall Extrusion */}
      <mesh geometry={wallGeometry} receiveShadow={false} castShadow={false}>
        <meshStandardMaterial vertexColors metalness={0.02} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Units({ units, getGridHeight, cols, rows }: { units: any[]; getGridHeight: (x: number, y: number) => number; cols: number; rows: number }) {
  return (
    <group>
      {units.map((unit) => {
        const gx = Math.max(0, Math.min(cols - 1, Math.round(unit.x - 1)));
        const gy = Math.max(0, Math.min(rows - 1, Math.round(unit.y - 1)));
        const terrainHeight = getGridHeight(gx, gy);
        const { wx, wy } = gridToWorldPosition(gx, gy, cols, rows);
        const sx = wx * WORLD_XY_SCALE;
        const sy = wy * WORLD_XY_SCALE;
        const markerColor = unit.team === 'ally' ? 0x2563eb : unit.team === 'enemy' ? 0xdc2626 : 0xeab308;

        return (
          <group key={unit.id || `${unit.x}-${unit.y}`} position={[sx, sy, terrainHeight]}>
            <mesh position={[0, 0, 0.51]} castShadow={false} receiveShadow={false}>
              <sphereGeometry args={[0.42, 14, 14]} />
              <meshStandardMaterial color={markerColor} emissive={markerColor} emissiveIntensity={3.6} metalness={0.04} roughness={0.5} />
            </mesh>

            <mesh position={[0, 0, 0.24]} rotation={[Math.PI / 2, 0, 0]} castShadow={false}>
              <torusGeometry args={[0.66, 0.09, 8, 18]} />
              <meshStandardMaterial color={markerColor} emissive={markerColor} emissiveIntensity={0.6} metalness={0.02} roughness={0.6} />
            </mesh>

            <mesh position={[0, 0, 0.51]}>
              <sphereGeometry args={[0.72, 14, 14]} />
              <meshBasicMaterial color={markerColor} transparent opacity={0.9} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function SceneControls({ onControlsReady, onCameraChange, initialCameraPosition, initialCameraTarget, maxAxis }: any) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Track that we initialize once natively, react-three-fiber caches camera states sometimes
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      if (initialCameraPosition) {
        camera.position.set(initialCameraPosition[0], initialCameraPosition[1], initialCameraPosition[2]);
      } else {
        camera.position.set(0, -maxAxis * WORLD_XY_SCALE * 1.2, maxAxis * 0.9);
      }
      initialized.current = true;
    }
  }, [camera, initialCameraPosition, maxAxis]);

  useEffect(() => {
    if (controlsRef.current && initialCameraTarget) {
      controlsRef.current.target.set(initialCameraTarget[0], initialCameraTarget[1], initialCameraTarget[2]);
      controlsRef.current.update();
    } else if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0.4);
      controlsRef.current.update();
    }
  }, [initialCameraTarget]);

  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    const handleEnd = () => {
      if (onCameraChange) {
        onCameraChange(
          [camera.position.x, camera.position.y, camera.position.z],
          [controls.target.x, controls.target.y, controls.target.z]
        );
      }
    };

    controls.addEventListener('end', handleEnd);

    return () => {
      controls.removeEventListener('end', handleEnd);
      // Attempt to save state on strict unmount explicitly
      if (onCameraChange) {
        onCameraChange(
          [camera.position.x, camera.position.y, camera.position.z],
          [controls.target.x, controls.target.y, controls.target.z]
        );
      }
    };
  }, [camera, onCameraChange]);

  useEffect(() => {
    if (!onControlsReady) return;
    const controls = controlsRef.current;

    onControlsReady({
      zoomIn: () => {
        if (!controls) return;
        const offset = camera.position.clone().sub(controls.target);
        const distance = offset.length();
        const newDistance = Math.max(controls.minDistance, distance * 0.8);
        offset.normalize().multiplyScalar(newDistance);
        camera.position.copy(controls.target.clone().add(offset));
        controls.update();
      },
      zoomOut: () => {
        if (!controls) return;
        const offset = camera.position.clone().sub(controls.target);
        const distance = offset.length();
        const newDistance = Math.min(controls.maxDistance, distance * 1.2);
        offset.normalize().multiplyScalar(newDistance);
        camera.position.copy(controls.target.clone().add(offset));
        controls.update();
      },
      rotateLeft: () => {
        if (!controls) return;
        const offset = camera.position.clone().sub(controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 0, 1), 0.22);
        camera.position.copy(controls.target.clone().add(offset));
        controls.update();
      },
      rotateRight: () => {
        if (!controls) return;
        const offset = camera.position.clone().sub(controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 0, 1), -0.22);
        camera.position.copy(controls.target.clone().add(offset));
        controls.update();
      },
    });

    return () => onControlsReady(null);
  }, [camera, onControlsReady]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      enablePan
      enableZoom
      enableRotate
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      minDistance={Math.max(4, maxAxis * WORLD_XY_SCALE * 0.35)}
      maxDistance={Math.max(30, maxAxis * WORLD_XY_SCALE * 4.0)}
      minPolarAngle={0.12}
      maxPolarAngle={Math.PI / 2 - 0.03}
    />
  );
}

export function TacticalMap3D({
  mapData,
  terrainVersionKey,
  isActive,
  terrainType = 'Highland',
  scenarioTitle,
  mapPeaks,
  initialCameraPosition,
  initialCameraTarget,
  onCameraChange,
  onControlsReady,
}: TacticalMap3DProps) {

  const gridInfo = useMemo(() => {
    const [cols, rows] = mapData.map_size;
    return {
      cols: Math.max(1, cols),
      rows: Math.max(1, rows),
    };
  }, [mapData.map_size]);

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

  const getGridHeight = (x: number, y: number) => {
    const hx = Math.max(0, Math.min(gridInfo.cols, x));
    const hy = Math.max(0, Math.min(gridInfo.rows, y));
    const idx = hy * (gridInfo.cols + 1) + hx;
    const h = proceduralHeightmap[idx] ?? 0;
    const meters = normalizedHeightToMeters(h);
    return (meters - TACTICAL_MIN_ELEVATION_M) / METERS_PER_WORLD_Z_UNIT + BASE_Z_OFFSET;
  };

  const maxAxis = Math.max(gridInfo.cols, gridInfo.rows);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0" style={{ touchAction: 'none' }} aria-label="3D Tactical Terrain View">
      <Canvas
        camera={{ up: [0, 0, 1], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        shadows
        onCreated={({ gl }) => {
          gl.setClearColor(0x08131f);
        }}
      >
        <ambientLight intensity={0.52} color={0xffffff} />
        <directionalLight intensity={0.42} color={0xffffff} position={[30, -20, 40]} castShadow={false} />

        <TerrainGeometry proceduralHeightmap={proceduralHeightmap} cols={gridInfo.cols} rows={gridInfo.rows} />
        <Units units={mapData.units} cols={gridInfo.cols} rows={gridInfo.rows} getGridHeight={getGridHeight} />

        <SceneControls
          onControlsReady={onControlsReady}
          onCameraChange={onCameraChange}
          initialCameraPosition={initialCameraPosition}
          initialCameraTarget={initialCameraTarget}
          maxAxis={maxAxis}
        />
      </Canvas>
    </div>
  );
}
