import React from 'react';
import { Courier_Prime } from 'next/font/google';
import { Cpu, Terminal, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const courierNew = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
});

interface HeaderProps {
  turn: number;
  status: 'ACTIVE' | 'AWAITING COMMAND' | 'PROCESSING';
  onOpenBuilder: () => void;
}

export function Header({ turn, status, onOpenBuilder }: HeaderProps) {
  return (
    <header className="h-14 border-b border-[#1F6FEB]/20 bg-[#0F1115] flex items-center justify-between px-6 shrink-0 z-50 shadow-2xl">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="WARMATRIX logo" className="w-8 h-8 invert brightness-75" />
          <div>
            <h1 className={`${courierNew.className} font-bold text-lg tracking-tight text-[#1F6FEB] uppercase`}>
              WAR<span className="text-[#E6EDF3]">MATRIX</span>
            </h1>
          </div>
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
