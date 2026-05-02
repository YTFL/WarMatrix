'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Activity, Lock, Globe, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FirewallSentry() {
  const [status, setStatus] = useState<'SECURE' | 'SCANNING' | 'THREAT_DETECTED'>('SECURE');
  const [packets, setPackets] = useState<number>(12042);
  const [blocked, setBlocked] = useState<number>(42);
  const [uptime, setUptime] = useState<string>('00:00:00');

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      // Update uptime
      const diff = Date.now() - startTime;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);

      // Update packet counts
      setPackets(prev => prev + Math.floor(Math.random() * 5));
      if (Math.random() > 0.95) {
        setBlocked(prev => prev + 1);
        setStatus('SCANNING');
        setTimeout(() => setStatus('SECURE'), 2000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0A1020]/80 backdrop-blur-md border border-[#1F6FEB]/30 rounded-sm p-4 flex flex-col gap-4 shadow-lg overflow-hidden relative group">
      {/* Background Pulse */}
      <div className={cn(
        "absolute inset-0 opacity-5 pointer-events-none transition-colors duration-500",
        status === 'SECURE' ? "bg-[#22C55E]" : status === 'SCANNING' ? "bg-[#F59E0B]" : "bg-[#EF4444]"
      )} />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-sm flex items-center justify-center border transition-all duration-300",
            status === 'SECURE' ? "bg-[#22C55E]/10 border-[#22C55E]/50 text-[#22C55E]" : 
            status === 'SCANNING' ? "bg-[#F59E0B]/10 border-[#F59E0B]/50 text-[#F59E0B] animate-pulse" : 
            "bg-[#EF4444]/10 border-[#EF4444]/50 text-[#EF4444]"
          )}>
            {status === 'SECURE' ? <ShieldCheck className="w-5 h-5" /> : 
             status === 'SCANNING' ? <Activity className="w-5 h-5" /> : 
             <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-[12px] font-bold text-white uppercase tracking-wider">FIREWALL SENTRY</h3>
            <div className="flex items-center gap-1.5">
              <div className={cn("w-1.5 h-1.5 rounded-full", status === 'SECURE' ? "bg-[#22C55E]" : "bg-[#F59E0B]")} />
              <span className="text-[10px] font-mono text-[#4B6A8A] uppercase">{status}</span>
            </div>
          </div>
        </div>
        <Lock className="w-4 h-4 text-[#1F6FEB]/40" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-black/40 border border-[#1F6FEB]/10 p-2 rounded-sm">
          <div className="text-[9px] text-[#4B6A8A] uppercase font-mono mb-1">Traffic Analyzed</div>
          <div className="text-[14px] font-bold text-[#E6EDF3] font-mono">{packets.toLocaleString()} PKTS</div>
        </div>
        <div className="bg-black/40 border border-[#1F6FEB]/10 p-2 rounded-sm">
          <div className="text-[9px] text-[#4B6A8A] uppercase font-mono mb-1">Intrusions Blocked</div>
          <div className="text-[14px] font-bold text-[#EF4444] font-mono">{blocked}</div>
        </div>
        <div className="bg-black/40 border border-[#1F6FEB]/10 p-2 rounded-sm">
          <div className="text-[9px] text-[#4B6A8A] uppercase font-mono mb-1">Encryption</div>
          <div className="text-[14px] font-bold text-[#3A8DFF] font-mono">AES-512</div>
        </div>
        <div className="bg-black/40 border border-[#1F6FEB]/10 p-2 rounded-sm">
          <div className="text-[9px] text-[#4B6A8A] uppercase font-mono mb-1">Wall Uptime</div>
          <div className="text-[14px] font-bold text-[#22C55E] font-mono">{uptime}</div>
        </div>
      </div>

      {/* Real-time Monitor */}
      <div className="h-10 bg-black/60 border border-[#1F6FEB]/20 rounded-sm relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-around px-2">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-1 bg-[#1F6FEB] transition-all duration-300",
                status === 'SCANNING' ? "animate-bounce" : "opacity-30"
              )}
              style={{ 
                height: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <Globe className="w-3 h-3 text-[#1F6FEB]/60" />
        <span className="text-[9px] font-mono text-[#4B6A8A] uppercase tracking-tighter">Global Threat Intelligence Feed: ACTIVE</span>
      </div>
    </div>
  );
}
