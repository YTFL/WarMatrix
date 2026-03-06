import React from 'react';
import { Target, Map as MapIcon, Crosshair } from 'lucide-react';

interface Unit {
  id: string;
  type: 'FRIENDLY' | 'ENEMY' | 'OBJECTIVE';
  x: number;
  y: number;
  label: string;
}

interface TacticalMapProps {
  units: Unit[];
}

export function TacticalMap({ units }: TacticalMapProps) {
  // 12x8 grid
  const gridRows = 8;
  const gridCols = 12;

  return (
    <div className="flex-1 relative bg-[#0F172A] border border-[#1F2A44] overflow-hidden panel-scanline">
      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1F2A44 1px, transparent 1px),
            linear-gradient(to bottom, #1F2A44 1px, transparent 1px)
          `,
          backgroundSize: `${100 / gridCols}% ${100 / gridRows}%`
        }}
      />

      {/* Terrain Indicators (Decorative) */}
      <div className="absolute top-1/4 left-1/3 w-32 h-24 border border-[#1F2A44]/30 bg-[#1F2A44]/5 flex items-center justify-center">
        <span className="text-[10px] text-[#1F2A44] font-bold uppercase rotate-12">Elevated Terrain Alpha</span>
      </div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-16 border border-[#1F2A44]/30 bg-[#1F2A44]/5 flex items-center justify-center">
        <span className="text-[10px] text-[#1F2A44] font-bold uppercase -rotate-6">Supply Corridor 7</span>
      </div>

      {/* Movement Path (Example) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#22D3EE" fillOpacity="0.5" />
          </marker>
        </defs>
        <path 
          d="M 200 150 L 400 300 L 600 250" 
          stroke="#22D3EE" 
          strokeWidth="1" 
          strokeDasharray="4 4" 
          fill="none" 
          strokeOpacity="0.5"
          markerEnd="url(#arrowhead)"
        />
      </svg>

      {/* Units */}
      {units.map((unit) => (
        <div 
          key={unit.id}
          className="absolute transition-all duration-1000 ease-in-out group cursor-help"
          style={{
            left: `${(unit.x / gridCols) * 100}%`,
            top: `${(unit.y / gridRows) * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className={`relative w-4 h-4 flex items-center justify-center`}>
            {/* Unit Symbol */}
            {unit.type === 'FRIENDLY' && (
              <div className="w-3 h-3 bg-[#22C55E] rounded-sm shadow-[0_0_10px_#22C55E] border border-white/20 animate-pulse-slow" />
            )}
            {unit.type === 'ENEMY' && (
              <div className="w-3 h-3 bg-[#EF4444] rotate-45 shadow-[0_0_10px_#EF4444] border border-white/20" />
            )}
            {unit.type === 'OBJECTIVE' && (
              <div className="w-3 h-3 border-2 border-[#F59E0B] rounded-full shadow-[0_0_10px_#F59E0B] flex items-center justify-center">
                <div className="w-1 h-1 bg-[#F59E0B] rounded-full" />
              </div>
            )}
            
            {/* Tooltip Label */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#111827]/90 border border-[#1F2A44] px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              <span className="text-[10px] font-mono text-white flex items-center gap-1.5 uppercase tracking-wider">
                <span className={`w-1.5 h-1.5 rounded-full ${unit.type === 'FRIENDLY' ? 'bg-[#22C55E]' : unit.type === 'ENEMY' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`} />
                {unit.label}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* UI Elements on Map */}
      <div className="absolute top-4 left-4 bg-[#111827]/60 backdrop-blur-sm border border-[#1F2A44] p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-[#22D3EE]" />
          <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Coordinate System</span>
        </div>
        <div className="text-xs font-mono text-white">45.023°N / 122.451°E</div>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#22C55E] rounded-sm" />
          <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Friendly</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#EF4444] rotate-45" />
          <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Threat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 border border-[#F59E0B] rounded-full" />
          <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Objective</span>
        </div>
      </div>
    </div>
  );
}
