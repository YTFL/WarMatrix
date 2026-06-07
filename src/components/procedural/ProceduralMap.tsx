'use client';

import React, { useEffect, useRef, useState } from 'react';
import { UrbanMapResponse, CellMetadata } from '@/lib/procedural/types';
import { DISTRICT_COLORS, ROAD_COLORS } from '@/lib/procedural/assetRegistry';
import { ProceduralMap3D } from './ProceduralMap3D';
import { Layers, Compass, Crosshair } from 'lucide-react';

interface ProceduralMapProps {
  mapData: UrbanMapResponse | null;
  activeLayers: {
    roads: boolean;
    districts: boolean;
    buildings: boolean;
    infrastructure: boolean;
    metadata: boolean;
  };
  viewMode: '2d' | '3d';
  metadataField: 'cover' | 'movement' | 'visibility' | 'comms';
}

function cellToLatLong(x: number, y: number, cols: number, rows: number): string {
  const lat = 45.0230 + (rows / 2 - y - 0.5) * 0.0015;
  const lng = 122.4510 + (x - cols / 2 + 0.5) * 0.0022;
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

export function ProceduralMap({
  mapData,
  activeLayers,
  viewMode,
  metadataField,
}: ProceduralMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredCell, setHoveredCell] = useState<CellMetadata | null>(null);

  const [cols, rows] = mapData ? mapData.grid_size : [12, 8];

  // ─── 2D Canvas Renderer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== '2d' || !mapData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    // Holographic background
    ctx.fillStyle = '#02060E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Centre radial glow
    const radialGrad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 50,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 1.5
    );
    radialGrad.addColorStop(0, 'rgba(0, 200, 255, 0.08)');
    radialGrad.addColorStop(1, 'rgba(0, 200, 255, 0)');
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Districts
    if (activeLayers.districts) {
      mapData.districts.forEach((d) => {
        ctx.fillStyle = (DISTRICT_COLORS[d.type] || '#FFF') + '12'; // 7% opacity
        const x = d.bounds.min_x * cellWidth;
        const y = d.bounds.min_y * cellHeight;
        const w = (d.bounds.max_x - d.bounds.min_x + 1) * cellWidth;
        const h = (d.bounds.max_y - d.bounds.min_y + 1) * cellHeight;
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = DISTRICT_COLORS[d.type] || '#FFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
      });
    }

    // Draw Metadata layer
    if (activeLayers.metadata) {
      mapData.metadata.forEach((m) => {
        let val = 0;
        let color = 'rgba(0, 229, 255, ';
        if (metadataField === 'cover') {
          val = m.cover_value; // range [0, 1]
          color = 'rgba(0, 229, 255, ' + val * 0.45 + ')';
        } else if (metadataField === 'movement') {
          val = (m.movement_cost - 1) / 4; // normalized range [0, 1]
          color = 'rgba(245, 158, 11, ' + val * 0.45 + ')';
        } else if (metadataField === 'visibility') {
          val = 1.0 - m.visibility_modifier; // lower is better cover
          color = 'rgba(239, 68, 68, ' + val * 0.45 + ')';
        } else if (metadataField === 'comms') {
          val = (m.communication_modifier - 1.0) * 5; // offset range
          color = 'rgba(59, 130, 246, ' + val * 0.45 + ')';
        }

        ctx.fillStyle = color;
        ctx.fillRect(m.x * cellWidth, m.y * cellHeight, cellWidth, cellHeight);
      });
    }

    // Draw Cell grid
    ctx.strokeStyle = 'rgba(31, 111, 235, 0.14)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * cellHeight);
      ctx.lineTo(canvas.width, j * cellHeight);
      ctx.stroke();
    }

    // Draw City Boundary Box
    if (activeLayers.districts) {
      const bounds = mapData.city_bounds;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 4;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(
        bounds.min_x * cellWidth,
        bounds.min_y * cellHeight,
        (bounds.max_x - bounds.min_x + 1) * cellWidth,
        (bounds.max_y - bounds.min_y + 1) * cellHeight
      );
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    }

    // Draw Roads
    if (activeLayers.roads) {
      mapData.roads.forEach((r) => {
        const roadColor = ROAD_COLORS[r.type] || '#FFF';
        const thickness = r.type === 'Primary' ? 3 : (r.type === 'Secondary' ? 2 : 1);
        
        // Thicker glow underline
        ctx.strokeStyle = roadColor;
        ctx.lineWidth = thickness + 2;
        ctx.shadowColor = roadColor;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        // Shift start/end coordinates to the center of the road cell
        ctx.moveTo((r.start[0] + 0.5) * cellWidth, (r.start[1] + 0.5) * cellHeight);
        ctx.lineTo((r.end[0] + 0.5) * cellWidth, (r.end[1] + 0.5) * cellHeight);
        ctx.stroke();

        // Brighter main core
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = thickness;
        ctx.stroke();
      });
    }

    // Draw Buildings
    if (activeLayers.buildings) {
      mapData.buildings.forEach((b) => {
        const color = DISTRICT_COLORS[b.type as keyof typeof DISTRICT_COLORS] || '#888';
        // Transparent fill
        ctx.fillStyle = color + '1A';
        const padding = 2.5;
        const bx = b.x * cellWidth + padding;
        const by = b.y * cellHeight + padding;
        const bw = cellWidth - padding * 2;
        const bh = cellHeight - padding * 2;
        ctx.fillRect(bx, by, bw, bh);

        // Holographic neon outline
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(bx, by, bw, bh);

        // Display height value inside building representation
        ctx.fillStyle = color;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.height.toString(), bx + bw / 2, by + bh / 2);
      });
    }

    // Draw Strategic Infrastructure
    if (activeLayers.infrastructure) {
      mapData.infrastructure.forEach((inf) => {
        const x = (inf.x + 0.5) * cellWidth;
        const y = (inf.y + 0.5) * cellHeight;
        
        // Strategic point emblem - holographic circle
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 6;
        
        ctx.beginPath();
        ctx.arc(x, y, 6.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Corner brackets
    const bracketSize = 15;
    ctx.strokeStyle = 'rgba(31, 111, 235, 0.45)';
    ctx.lineWidth = 1.5;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(bracketSize, 5); ctx.lineTo(5, 5); ctx.lineTo(5, bracketSize);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(canvas.width - bracketSize, 5); ctx.lineTo(canvas.width - 5, 5); ctx.lineTo(canvas.width - 5, bracketSize);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(bracketSize, canvas.height - 5); ctx.lineTo(5, canvas.height - 5); ctx.lineTo(5, canvas.height - bracketSize);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(canvas.width - bracketSize, canvas.height - 5); ctx.lineTo(canvas.width - 5, canvas.height - 5); ctx.lineTo(canvas.width - 5, canvas.height - bracketSize);
    ctx.stroke();


  }, [viewMode, mapData, activeLayers, metadataField]);

  // Handle cell hovering tooltip detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mapData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const [cols, rows] = mapData.grid_size;
    const cellX = Math.floor((clientX / rect.width) * cols);
    const cellY = Math.floor((clientY / rect.height) * rows);

    const match = mapData.metadata.find((m) => m.x === cellX && m.y === cellY);
    setHoveredCell(match || null);
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  if (!mapData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#02050A] border border-[#1F6FEB]/20 font-mono text-[#9CA3AF]">
        <Layers className="w-10 h-10 text-[#1F6FEB]/40 mb-3 animate-pulse" />
        <span className="text-xs uppercase tracking-widest text-[#1F6FEB]/80">
          Awaiting Simulation Target seed...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-[#02050A] border border-[#1F6FEB]/20 flex flex-col overflow-hidden h-full">
      {/* 2D Mode */}
      {viewMode === '2d' && (
        <div className="flex-1 relative flex items-center justify-center p-6 h-full overflow-hidden">
          <canvas
            ref={canvasRef}
            width={720}
            height={480}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="border border-[#1F6FEB]/10 shadow-[0_0_24px_rgba(0,0,0,0.8)] max-h-full max-w-full"
          />

          {/* Mouse Hover Cell Tooltip */}
          {hoveredCell && (
            <div className="absolute top-4 right-4 bg-[#0F1115]/95 border border-[#1F6FEB]/30 p-4 rounded shadow-2xl font-mono text-xs flex flex-col gap-2 min-w-[200px] z-20">
              <div className="flex items-center justify-between border-b border-[#1F6FEB]/20 pb-1.5 mb-1">
                <span className="font-bold text-[#00e5ff] uppercase tracking-wider">
                  Coordinate
                </span>
                <span className="text-gray-400 font-bold">
                  [{hoveredCell.x}, {hoveredCell.y}]
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lat / Long:</span>
                <span className="text-[#00e5ff] font-bold">
                  {cellToLatLong(hoveredCell.x, hoveredCell.y, cols, rows)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sector:</span>
                <span className="text-[#E6EDF3] capitalize">{hoveredCell.district_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Is Road:</span>
                <span className="text-[#E6EDF3]">{hoveredCell.is_road ? `Yes (${hoveredCell.road_type})` : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cover Value:</span>
                <span className="text-[#10B981]">{hoveredCell.cover_value.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Movement Cost:</span>
                <span className="text-[#F59E0B]">{hoveredCell.movement_cost} AP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Visibility Mod:</span>
                <span className="text-[#EF4444]">{hoveredCell.visibility_modifier.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Comms Mod:</span>
                <span className="text-[#3B82F6]">{hoveredCell.communication_modifier.toFixed(2)}x</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3D Mode */}
      {viewMode === '3d' && (
        <ProceduralMap3D mapData={mapData} activeLayers={activeLayers} />
      )}

      {/* Map Hud Bar */}
      <div className="absolute top-4 left-4 bg-[#0F1115]/80 backdrop-blur-md border border-[#1F6FEB]/20 px-3 py-2 flex items-center gap-4 rounded-sm shadow-xl font-mono">
        <Compass className="w-4 h-4 text-[#1F6FEB]" />
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-[#9CA3AF] uppercase">
            Simulation Coordinates
          </span>
          <span className="text-xs text-[#E6EDF3]">
            {mapData.grid_size[0]} x {mapData.grid_size[1]} Cells | Seed: {mapData.seed}
          </span>
          <span className="text-[10px] text-[#00e5ff] font-bold mt-0.5">
            Center: {cellToLatLong(cols / 2, rows / 2, cols, rows)}
          </span>
        </div>
      </div>
    </div>
  );
}
