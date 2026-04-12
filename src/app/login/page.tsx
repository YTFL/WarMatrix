"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Terminal, Fingerprint, ChevronRight, Activity, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [commanderId, setCommanderId] = useState("");
  const [authKey, setAuthKey] = useState("");
  const [status, setStatus] = useState<"IDLE" | "SCANNING" | "VERIFYING" | "SUCCESS">("IDLE");
  const [scanProgress, setScanProgress] = useState(0);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commanderId || !authKey) return;

    setStatus("SCANNING");
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setStatus("VERIFYING");
        setTimeout(() => {
          setStatus("SUCCESS");
          localStorage.setItem("warmatrix_auth", "true"); // Secure the session
          setTimeout(() => {
            router.push("/console");
          }, 800);
        }, 1200);
      }
      setScanProgress(progress);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1F6FEB] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#A78BFA] blur-[120px] rounded-full opacity-30" />
        {/* CRT Scan lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%]" />
      </div>

      <div 
        className="w-full max-w-[450px] relative z-10"
        style={{ animation: 'fadeIn 1s ease-out' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-sm border-2 border-[#1F6FEB] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(31,111,235,0.3)] bg-[#0A1020]">
            <Shield className="w-8 h-8 text-[#1F6FEB]" />
          </div>
          <h1 className="text-[24px] font-bold text-white uppercase tracking-[0.4em] text-center">
            WAR MATRIX
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3A8DFF] animate-pulse" />
            <span className="text-[10px] font-mono text-[#4B6A8A] uppercase tracking-[0.2em]">
              Authorization Gateway v4.2.0
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div 
          className="bg-[#0A1020]/80 backdrop-blur-md border border-[#1F6FEB]/30 p-8 rounded-sm shadow-2xl relative"
          style={{ boxShadow: '0 0 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(31,111,235,0.05)' }}
        >
          {status === "IDLE" ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-[#4B6A8A] uppercase tracking-wider pl-1">Commander ID</label>
                <div className="relative">
                  <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F6FEB]/60" />
                  <input 
                    type="text"
                    value={commanderId}
                    onChange={(e) => setCommanderId(e.target.value)}
                    placeholder="E.G. CMD-99"
                    className="w-full bg-[#050810] border border-[#1F6FEB]/30 rounded-sm py-3 pl-10 pr-4 text-[13px] font-mono text-[#E6EDF3] placeholder:text-[#273444] focus:outline-none focus:border-[#1F6FEB] transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-[#4B6A8A] uppercase tracking-wider pl-1">Authorization Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F6FEB]/60" />
                  <input 
                    type="password"
                    value={authKey}
                    onChange={(e) => setAuthKey(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#050810] border border-[#1F6FEB]/30 rounded-sm py-3 pl-10 pr-4 text-[13px] font-mono text-[#E6EDF3] placeholder:text-[#273444] focus:outline-none focus:border-[#1F6FEB] transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="mt-4 w-full bg-[#1F6FEB] hover:bg-[#3A8DFF] text-white font-bold py-3.5 rounded-sm uppercase tracking-widest text-[12px] transition-all flex items-center justify-center gap-2 group shadow-[0_0_15px_rgba(31,111,235,0.2)]"
              >
                Intialize Uplink
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center py-6 gap-6">
              <div className="relative">
                <div className={cn(
                   "w-24 h-24 rounded-full border-2 border-dashed border-[#1F6FEB]/20 flex items-center justify-center",
                   status === "SCANNING" ? "animate-spin-slow" : ""
                )}>
                  <Fingerprint className={cn(
                    "w-12 h-12 transition-all duration-500",
                    status === "SCANNING" ? "text-[#1F6FEB] scale-110" : 
                    status === "VERIFYING" ? "text-[#A78BFA] scale-125 duration-200" : 
                    "text-[#22C55E] scale-100"
                  )} />
                </div>
                {status === "SCANNING" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-[#3A8DFF]/40 animate-scan-y shadow-[0_0_10px_#3A8DFF]" />
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-[13px] font-mono font-bold text-white uppercase tracking-[0.2em]">
                  {status === "SCANNING" ? "Biometric Scan in Progress..." : 
                   status === "VERIFYING" ? "Verifying Authorization..." : 
                   "Access Granted"}
                </span>
                <div className="w-48 h-1 bg-[#050810] rounded-full overflow-hidden border border-[#1F6FEB]/10">
                  <div 
                    className="h-full bg-[#1F6FEB] transition-all duration-300" 
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[#4B6A8A]">{scanProgress}% SECURE LINK ESTABLISHED</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 flex items-center justify-between px-2 opacity-50">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-[#1F6FEB]" />
            <span className="text-[9px] font-mono text-[#4B6A8A] uppercase">Encryption: AES-256</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3 text-[#A78BFA]" />
            <span className="text-[9px] font-mono text-[#4B6A8A] uppercase">Node: SECTOR-9</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scan-y {
          0% { transform: translateY(-40px); opacity: 0.2; }
          50% { opacity: 1; }
          100% { transform: translateY(40px); opacity: 0.2; }
        }
        .animate-scan-y {
          animation: scan-y 1.5s infinite ease-in-out;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
