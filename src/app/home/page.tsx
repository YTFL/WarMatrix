'use client';

import React, { useEffect, useRef } from 'react';
import { Courier_Prime } from 'next/font/google';
import { useRouter } from 'next/navigation';
import { Cpu, Terminal, Shield, Globe, Radio } from 'lucide-react';

const courierNew = Courier_Prime({
    subsets: ['latin'],
    weight: ['400', '700'],
});

const DOMAINS = [
    { icon: Shield, label: 'LAND OPS', desc: 'Ground force maneuver & close combat' },
    { icon: Globe, label: 'AIR DOMAIN', desc: 'Aerial superiority & strike packages' },
    { icon: Radio, label: 'SEA CONTROL', desc: 'Naval blockade & littoral warfare' },
];

export default function HomePage() {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Animated tactical grid canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animFrame: number;
        let radarAngle = 0;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Pulse nodes
        const nodes: { x: number; y: number; phase: number; size: number }[] = Array.from({ length: 18 }, () => ({
            x: Math.random(),
            y: Math.random(),
            phase: Math.random() * Math.PI * 2,
            size: Math.random() * 2 + 1,
        }));

        const draw = (t: number) => {
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            // Grid lines
            const step = 60;
            ctx.strokeStyle = 'rgba(31,111,235,0.06)';
            ctx.lineWidth = 1;
            for (let x = 0; x < W; x += step) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
            }
            for (let y = 0; y < H; y += step) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
            }

            // Diagonal accent lines
            ctx.strokeStyle = 'rgba(31,111,235,0.04)';
            for (let i = -H; i < W + H; i += 120) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
            }

            // Radar sweep (centered right 1/3)
            const cx = W * 0.75;
            const cy = H * 0.5;
            const radius = Math.min(W, H) * 0.28;
            radarAngle = (t * 0.0006) % (Math.PI * 2);

            // Radar circle
            ctx.strokeStyle = 'rgba(31,111,235,0.12)';
            ctx.lineWidth = 1;
            for (let r = radius / 3; r <= radius; r += radius / 3) {
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
            }
            // Crosshairs
            ctx.beginPath(); ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius); ctx.stroke();

            // Sweep gradient
            const sweep = ctx.createConicalGradient
                ? (ctx as any).createConicalGradient(cx, cy, radarAngle)
                : null;

            if (!sweep) {
                // Fallback: simple arc sweep
                const grad = ctx.createLinearGradient(
                    cx + Math.cos(radarAngle) * radius,
                    cy + Math.sin(radarAngle) * radius,
                    cx, cy
                );
                grad.addColorStop(0, 'rgba(31,111,235,0.18)');
                grad.addColorStop(1, 'rgba(31,111,235,0)');
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, radius, radarAngle - 0.7, radarAngle, false);
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.fill();
            }

            // Rotating sweep line
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(radarAngle) * radius, cy + Math.sin(radarAngle) * radius);
            ctx.strokeStyle = 'rgba(31,111,235,0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Pulsing nodes
            nodes.forEach(n => {
                const pulse = Math.sin(t * 0.002 + n.phase);
                const alpha = 0.3 + pulse * 0.3;
                const glow = ctx.createRadialGradient(n.x * W, n.y * H, 0, n.x * W, n.y * H, n.size * 8);
                glow.addColorStop(0, `rgba(31,111,235,${alpha})`);
                glow.addColorStop(1, 'rgba(31,111,235,0)');
                ctx.beginPath();
                ctx.arc(n.x * W, n.y * H, n.size * 8, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(n.x * W, n.y * H, n.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(31,111,235,${0.5 + pulse * 0.5})`;
                ctx.fill();
            });

            animFrame = requestAnimationFrame(draw);
        };

        animFrame = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(animFrame);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div className="relative flex flex-col min-h-screen bg-[#0A0A0A] text-[#E6EDF3] overflow-hidden select-none">

            {/* Background canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {/* Radial vignette overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_30%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />

            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.025] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_4px)]" />


            {/* ── HERO ── */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">

                {/* Background Emblem Logo (Permanent Watermark) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 overflow-hidden">
                    <img
                        src="/logo.svg"
                        alt=""
                        className="w-[450px] h-[450px] opacity-[0.1] invert brightness-[0.6] grayscale"
                    />
                </div>


                {/* Top label */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-px w-16 bg-[#1F6FEB]/40" />
                    <span className="text-[9px] font-mono font-bold tracking-[0.3em] text-[#1F6FEB] uppercase">
                        Classified — Command Access Only
                    </span>
                    <div className="h-px w-16 bg-[#1F6FEB]/40" />
                </div>

                {/* Main title */}
                <h2 className={`${courierNew.className} font-bold uppercase leading-none mb-2`}
                    style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    <span className="text-[#1F6FEB]" style={{ textShadow: '0 0 40px rgba(31,111,235,0.5)' }}>WAR</span>
                    <span className="text-[#E6EDF3]">MATRIX</span>
                </h2>
                <p className="text-[11px] font-bold tracking-[0.35em] text-[#9CA3AF] uppercase mb-8">
                    AI WAR SIMULATION PLATFORM
                </p>

                {/* Subtitle */}
                <p className="max-w-lg text-[13px] text-[#6B7280] leading-relaxed mb-12 font-mono">
                    AI-powered battlefield simulation platform generating strategic military scenarios
                    across <span className="text-[#9CA3AF]">land</span>,{' '}
                    <span className="text-[#9CA3AF]">air</span>, and{' '}
                    <span className="text-[#9CA3AF]">sea</span> domains.
                </p>

                {/* CTA buttons */}
                <div className="flex justify-center mb-16">
                    <button
                        onClick={() => router.push('/console')}
                        className="px-8 h-11 bg-[#1F6FEB] hover:bg-[#3A8DFF] text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-sm transition-all duration-200 shadow-[0_0_20px_rgba(31,111,235,0.4)] hover:shadow-[0_0_30px_rgba(31,111,235,0.6)] flex items-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        START SIMULATION
                    </button>
                </div>


                {/* Domain cards */}
                <div id="domains" className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-3xl">
                    {DOMAINS.map(({ icon: Icon, label, desc }) => (
                        <div
                            key={label}
                            className="border border-[#1F6FEB]/15 bg-[#0F1115]/60 backdrop-blur-sm rounded-sm p-4 flex flex-col gap-2 hover:border-[#1F6FEB]/40 hover:bg-[#0D223A]/30 transition-all duration-300 group"
                        >
                            <div className="w-8 h-8 rounded-sm bg-[#1F6FEB]/10 border border-[#1F6FEB]/20 flex items-center justify-center group-hover:bg-[#1F6FEB]/20 transition-colors">
                                <Icon className="w-4 h-4 text-[#1F6FEB]" />
                            </div>
                            <span className="text-[10px] font-bold tracking-widest uppercase text-[#E6EDF3]">{label}</span>
                            <span className="text-[9px] text-[#4B5563] leading-relaxed font-mono">{desc}</span>
                        </div>
                    ))}
                </div>
            </main>

            {/* ── FOOTER ── */}
            <footer className="relative z-10 h-10 border-t border-[#1F6FEB]/10 bg-[#0F1115]/60 flex items-center justify-end px-6 shrink-0">
                <span className="text-[9px] font-mono text-[#4B5563] uppercase tracking-widest">
                    SYSTEM BUILD: N_77_BETA // UPLINK: SECURE
                </span>
            </footer>
        </div>
    );
}
