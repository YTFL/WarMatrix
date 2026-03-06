import React from 'react';
import { CloudRain, Wind, Activity, Zap, Radio, Boxes } from 'lucide-react';

export function IntelligencePanel() {
  const intelItems = [
    { label: 'Terrain Type', value: 'Highland / Rugged', icon: Boxes },
    { label: 'Weather', value: 'Partly Cloudy / 18°C', icon: CloudRain },
    { label: 'Wind Speed', value: '12 knots NE', icon: Wind },
    { label: 'Visibility', value: '8.5 km', icon: Activity },
    { label: 'Comm Status', value: 'Encrypted / Stable', icon: Radio },
    { label: 'Power Grid', value: 'Operational 98%', icon: Zap },
  ];

  return (
    <aside className="w-72 bg-[#111827] border-r border-[#1F2A44] flex flex-col p-4 shrink-0 overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-4 h-4 text-[#22D3EE]" />
        <h2 className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-[#22D3EE]">Battlefield Intel</h2>
      </div>

      <div className="space-y-4 mb-8">
        {intelItems.map((item, idx) => (
          <div key={idx} className="bg-[#1F2937]/30 border border-[#1F2A44] p-3 rounded-sm group hover:border-[#22D3EE]/50 transition-colors">
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#22D3EE] transition-colors" />
              <div className="flex flex-col">
                <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider">{item.label}</span>
                <span className="text-xs text-white font-medium">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-4 h-4 text-[#22C55E]" />
          <h2 className="font-headline font-bold text-[10px] uppercase tracking-widest text-[#22C55E]">Live Signal Feed</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 font-mono scrollbar-hide">
          {[
            '[08:22:15] SIGINT: Encrypted traffic detected in Sector 4',
            '[08:22:42] SAT: Optical pass complete - No major changes',
            '[08:23:05] LOG: Resupply convoy ECHO-1 reached Objective B',
            '[08:24:12] SENSOR: Seismic activity detected near enemy outpost',
            '[08:25:30] COMMS: Alpha team reporting into standby position',
            '[08:26:01] SYS: Refreshing tactical grid data...',
            '[08:26:45] INTEL: Probable enemy reinforcement spotted north',
          ].map((log, i) => (
            <div key={i} className="text-[10px] text-[#9CA3AF] border-l border-[#1F2A44] pl-2 py-1 hover:bg-[#1F2A44]/20 transition-colors cursor-default">
              {log}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#1F2A44]">
        <div className="flex justify-between items-center text-[10px] text-[#9CA3AF] uppercase font-bold tracking-widest mb-2">
          <span>Global Readiness</span>
          <span className="text-[#22C55E]">88%</span>
        </div>
        <div className="h-1 bg-[#1F2A44] rounded-full overflow-hidden">
          <div className="h-full bg-[#22C55E] w-[88%]" />
        </div>
      </div>
    </aside>
  );
}
