import React from 'react';
import { Cpu, Terminal, Shield } from 'lucide-react';

interface HeaderProps {
  turn: number;
  status: 'ACTIVE' | 'AWAITING COMMAND' | 'PROCESSING';
}

export function Header({ turn, status }: HeaderProps) {
  return (
    <header className="h-14 border-b border-[#1F2A44] bg-[#111827] flex items-center justify-between px-6 shrink-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#0891B2]/20 rounded flex items-center justify-center border border-[#0891B2]/40">
          <Shield className="w-5 h-5 text-[#22D3EE]" />
        </div>
        <div>
          <h1 className="font-headline font-bold text-lg tracking-tight text-[#22D3EE] glow-cyan">
            TACTICAL<span className="text-white">NEXUS</span>
          </h1>
          <div className="text-[10px] text-[#9CA3AF] uppercase tracking-widest font-medium -mt-1">
            Command & Control Interface v4.2.0
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider">Simulation Turn</span>
          <span className="font-headline text-xl leading-none text-white">{turn.toString().padStart(3, '0')}</span>
        </div>
        
        <div className="h-8 w-px bg-[#1F2A44]" />

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider">System Status</span>
            <span className={`text-xs font-bold ${status === 'ACTIVE' ? 'text-[#22C55E]' : status === 'PROCESSING' ? 'text-[#F59E0B]' : 'text-[#22D3EE]'} flex items-center gap-1.5`}>
              <span className={`w-2 h-2 rounded-full ${status === 'ACTIVE' ? 'bg-[#22C55E] animate-pulse' : status === 'PROCESSING' ? 'bg-[#F59E0B] animate-pulse' : 'bg-[#22D3EE]'}`} />
              {status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-[#9CA3AF]">
          <Cpu className="w-4 h-4" />
          <span className="text-[10px] font-mono">NODE_77_BETA</span>
        </div>
        <div className="flex items-center gap-2 text-[#9CA3AF]">
          <Terminal className="w-4 h-4" />
          <span className="text-[10px] font-mono">SECURE_LINK_ESTABLISHED</span>
        </div>
      </div>
    </header>
  );
}
