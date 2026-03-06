import React from 'react';
import { Target, Map as MapIcon, Crosshair } from 'lucide-react';

interface Unit {
  id: string;
  type: 'FRIENDLY' | 'ENEMY' | 'OBJECTIVE';
  x: number;
  y: number;
  label: string;
}

interface UnitMovement {
  unit_id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

interface CombatEvent {
  attacker_id: string;
  defender_id: string;
  outcome: string;
  damage: number;
}

interface TacticalMapProps {
  units: Unit[];
  movements?: UnitMovement[];
  combatEvents?: CombatEvent[];
}

export function TacticalMap({ units, movements = [], combatEvents = [] }: TacticalMapProps) {
  // 12x8 grid
  const gridRows = 8;
  const gridCols = 12;
  const toPercentX = (x: number) => {
    const safeX = Math.max(1, Math.min(gridCols, Number.isFinite(x) ? x : 1));
    return `${((safeX - 0.5) / gridCols) * 100}%`;
  };
  const toPercentY = (y: number) => {
    const safeY = Math.max(1, Math.min(gridRows, Number.isFinite(y) ? y : 1));
    return `${((safeY - 0.5) / gridRows) * 100}%`;
  };

  return (
    <div className="flex-1 relative bg-[#0A0A0A] border border-[#1F6FEB]/20 overflow-hidden">

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(31, 111, 235, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(31, 111, 235, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: `${100 / gridCols}% ${100 / gridRows}%`
        }}
      />

      {/* Terrain Indicators (Decorative) */}
      <div className="absolute top-1/4 left-1/3 w-32 h-24 border border-[#1F6FEB]/10 bg-[#1F6FEB]/5 flex items-center justify-center">
        <span className="text-[10px] text-[#1F6FEB]/40 font-bold uppercase rotate-12">Sector Alpha-9</span>
      </div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-16 border border-[#1F6FEB]/10 bg-[#1F6FEB]/5 flex items-center justify-center">
        <span className="text-[10px] text-[#1F6FEB]/40 font-bold uppercase -rotate-6">Supply Corridor 7</span>
      </div>

      {/* Movement paths from latest simulation tick */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#1F6FEB" fillOpacity="0.4" />
          </marker>
        </defs>
        {movements.map((mv, idx) => (
          <line
            key={`${mv.unit_id}-${idx}`}
            x1={toPercentX(mv.from.x)}
            y1={toPercentY(mv.from.y)}
            x2={toPercentX(mv.to.x)}
            y2={toPercentY(mv.to.y)}
            stroke={mv.unit_id.startsWith('e') ? '#EF4444' : '#22C55E'}
            strokeWidth="1.5"
            strokeDasharray="5 4"
            fill="none"
            strokeOpacity="0.8"
            markerEnd="url(#arrowhead)"
            style={{ transition: 'all 600ms ease' }}
          />
        ))}
      </svg>

      {/* Combat flash markers */}
      {combatEvents.map((ev, idx) => {
        const defender = units.find((u) => u.id === ev.defender_id);
        if (!defender) return null;
        return (
          <div
            key={`${ev.attacker_id}-${ev.defender_id}-${idx}`}
            className="absolute pointer-events-none"
            style={{
              left: toPercentX(defender.x),
              top: toPercentY(defender.y),
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="w-8 h-8 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(239,68,68,0.75) 0%, rgba(239,68,68,0.15) 55%, rgba(239,68,68,0) 100%)',
                animation: 'pulse 900ms ease-out',
              }}
            />
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#EF4444] font-mono">
              -{ev.damage}
            </div>
          </div>
        );
      })}

      {/* Units */}
      {units.map((unit) => (
        <div
          key={unit.id}
          className="absolute transition-all duration-1000 ease-in-out group cursor-help"
          style={{
            left: toPercentX(unit.x),
            top: toPercentY(unit.y),
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className={`relative w-4 h-4 flex items-center justify-center`}>
            {/* Unit Symbol */}
            {unit.type === 'FRIENDLY' && (
              <div className="w-3.5 h-3.5 bg-[#22C55E] rounded-sm shadow-[0_0_12px_rgba(34,197,94,0.6)] border border-white/20 animate-pulse-slow" />
            )}
            {unit.type === 'ENEMY' && (
              <div className="w-3.5 h-3.5 bg-[#EF4444] rotate-45 shadow-[0_0_12px_rgba(239,68,68,0.6)] border border-white/20" />
            )}
            {unit.type === 'OBJECTIVE' && (
              <div className="w-3.5 h-3.5 border-2 border-[#F59E0B] rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full" />
              </div>
            )}

            {/* Tooltip Label */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0F1115]/95 border border-[#1F6FEB]/30 px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-lg">
              <span className="text-[10px] font-mono text-[#E6EDF3] flex items-center gap-1.5 uppercase tracking-wider">
                <span className={`w-1.5 h-1.5 rounded-full ${unit.type === 'FRIENDLY' ? 'bg-[#22C55E]' : unit.type === 'ENEMY' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`} />
                {unit.label}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* UI Elements on Map */}
      <div className="absolute top-4 left-4 bg-[#0F1115]/80 backdrop-blur-md border border-[#1F6FEB]/20 p-3 flex flex-col gap-2 rounded-sm shadow-xl">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-[#1F6FEB]" />
          <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Coordinate System</span>
        </div>
        <div className="text-xs font-mono text-[#E6EDF3]">45.023°N / 122.451°E</div>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-6 bg-[#0F1115]/40 p-2 rounded-sm backdrop-blur-sm border border-[#1F6FEB]/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#22C55E] rounded-sm shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
          <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Friendly</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#EF4444] rotate-45 shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
          <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Threat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 border border-[#F59E0B] rounded-full shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
          <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Objective</span>
        </div>
      </div>
    </div>
  );
}