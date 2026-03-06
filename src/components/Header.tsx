import React from 'react';
import { Cpu, Terminal, Shield, Users, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  turn: number;
  status: 'ACTIVE' | 'AWAITING COMMAND' | 'PROCESSING';
  role: 'BLUE_TEAM' | 'RED_TEAM';
  onRoleSwitch: (role: 'BLUE_TEAM' | 'RED_TEAM') => void;
  onOpenBuilder: () => void;
}

export function Header({ turn, status, role, onRoleSwitch, onOpenBuilder }: HeaderProps) {
  return (
    <header className="h-14 border-b border-[#1F6FEB]/20 bg-[#0F1115] flex items-center justify-between px-6 shrink-0 z-50 shadow-2xl">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1F6FEB]/10 rounded flex items-center justify-center border border-[#1F6FEB]/30">
            <Shield className="w-5 h-5 text-[#1F6FEB]" />
          </div>
          <div>
            <h1 className="font-headline font-bold text-lg tracking-tight text-[#1F6FEB] glow-blue uppercase">
              WAR<span className="text-[#E6EDF3]">MATRIX</span>
            </h1>
            <div className="text-[9px] text-[#9CA3AF] uppercase tracking-widest font-bold -mt-1 opacity-60">
              SECURE_GRID_V4.2.X
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-[#1F6FEB]/20" />

        {/* Role Switcher - Multi-user Simulation */}
        <div className="flex items-center gap-2 bg-[#0A0A0A] p-1 rounded-sm border border-[#1F6FEB]/10">
          <button 
            onClick={() => onRoleSwitch('BLUE_TEAM')}
            className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 ${
              role === 'BLUE_TEAM' ? 'bg-[#1F6FEB] text-white shadow-[0_0_10px_rgba(31,111,235,0.4)]' : 'text-[#9CA3AF] hover:text-[#E6EDF3]'
            }`}
          >
            <Shield className="w-3 h-3" /> Blue Team
          </button>
          <button 
            onClick={() => onRoleSwitch('RED_TEAM')}
            className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 ${
              role === 'RED_TEAM' ? 'bg-[#EF4444] text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'text-[#9CA3AF] hover:text-[#E6EDF3]'
            }`}
          >
            <Users className="w-3 h-3" /> Red Team
          </button>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-[#9CA3AF] uppercase font-bold tracking-[0.2em] mb-0.5">Mission Turn</span>
          <span className="font-headline text-xl leading-none text-[#E6EDF3] tracking-tighter">{turn.toString().padStart(3, '0')}</span>
        </div>
        
        <div className="h-8 w-px bg-[#1F6FEB]/20" />

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-[#9CA3AF] uppercase font-bold tracking-[0.2em] mb-0.5">System Link</span>
            <span className={`text-[10px] font-bold ${status === 'ACTIVE' ? 'text-[#22C55E]' : status === 'PROCESSING' ? 'text-[#F59E0B]' : 'text-[#1F6FEB]'} flex items-center gap-1.5`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-[#22C55E] animate-pulse shadow-[0_0_5px_#22C55E]' : status === 'PROCESSING' ? 'bg-[#F59E0B] animate-pulse shadow-[0_0_5px_#F59E0B]' : 'bg-[#1F6FEB]'}`} />
              {status}
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-[#1F6FEB]/20" />

        <Button 
          variant="outline" 
          size="sm" 
          onClick={onOpenBuilder}
          className="bg-[#0D223A] border-[#1F6FEB]/30 text-[#1F6FEB] hover:bg-[#1A3B5D] hover:text-white h-9 px-4 gap-2 text-[10px] uppercase font-bold tracking-widest"
        >
          <Settings2 className="w-3.5 h-3.5" /> Scenario Builder
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-[#4B5563]">
          <Cpu className="w-3.5 h-3.5" />
          <span className="text-[9px] font-mono tracking-tighter uppercase">N_77_BETA</span>
        </div>
        <div className="flex items-center gap-2 text-[#4B5563]">
          <Terminal className="w-3.5 h-3.5" />
          <span className="text-[9px] font-mono tracking-tighter uppercase">SEC_UPLINK</span>
        </div>
      </div>
    </header>
  );
}
