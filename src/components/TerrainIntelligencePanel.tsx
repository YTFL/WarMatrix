'use client';

import React, { useEffect, useRef } from 'react';

export function TerrainIntelligencePanel() {
    const scanRef = useRef<HTMLDivElement>(null);

    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-3 pointer-events-none">
            {/* Glass card panel */}
            <div
                className="relative w-full h-full rounded-lg overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(2,6,20,0.97) 0%, rgba(4,12,32,0.97) 60%, rgba(2,8,24,0.97) 100%)',
                    border: '1px solid rgba(31,111,235,0.35)',
                    boxShadow:
                        '0 0 24px rgba(31,111,235,0.15), 0 0 60px rgba(0,180,255,0.06), inset 0 0 60px rgba(0,60,120,0.08)',
                }}
            >
                {/* Inner top gradient shimmer */}
                <div
                    className="absolute inset-x-0 top-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(0,200,255,0.5), transparent)' }}
                />

                {/* Soft blue inner glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(ellipse 60% 50% at 50% 55%, rgba(0,80,200,0.10) 0%, transparent 80%)',
                    }}
                />

                {/* Scanning shimmer overlay */}
                <div
                    className="absolute inset-x-0 pointer-events-none terrain-scan-line"
                    style={{
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, rgba(0,200,255,0.18), rgba(0,200,255,0.4), rgba(0,200,255,0.18), transparent)',
                        boxShadow: '0 0 12px rgba(0,200,255,0.25)',
                    }}
                />

                {/* PANEL HEADER */}
                <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-20">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00C8FF] animate-pulse" style={{ boxShadow: '0 0 6px #00C8FF' }} />
                        <span className="text-[9px] font-mono font-bold text-[#5BA8E0] uppercase tracking-widest">
                            TERRAIN INTEL MODULE — SECTOR ALPHA-9
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[8px] font-mono text-[#1F6FEB]/60 uppercase tracking-wider">ELEV_MAP v2.4</span>
                        <span className="text-[8px] font-mono text-[#00C8FF]/70 uppercase">◈ LIVE</span>
                    </div>
                </div>

                {/* MAIN SVG — Topographic terrain visualization */}
                <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 900 500"
                    preserveAspectRatio="xMidYMid slice"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        {/* Glow filter for contour lines */}
                        <filter id="glow-faint" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="glow-medium" x="-40%" y="-40%" width="180%" height="180%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="glow-bright" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="5.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* Subtle radial gradient background overlay */}
                        <radialGradient id="centerGlow" cx="50%" cy="52%" r="48%">
                            <stop offset="0%" stopColor="#003380" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#000820" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* Background glow */}
                    <ellipse cx="450" cy="260" rx="320" ry="200" fill="url(#centerGlow)" />

                    {/* ─── TOPOGRAPHIC CONTOUR LINES ─── */}

                    {/* LAYER 1 — Outermost faint outer ring (very faint deep blue) */}
                    <path
                        d="M 80,340 C 120,240 200,180 300,160 C 400,140 500,150 580,170 C 660,190 730,220 760,280 C 790,340 780,400 730,430 C 680,460 600,470 500,465 C 400,460 300,450 220,420 C 140,390 60,430 80,340 Z"
                        fill="none"
                        stroke="rgba(10,50,120,0.6)"
                        strokeWidth="1"
                        filter="url(#glow-faint)"
                    />

                    {/* LAYER 2 — Second outer ring */}
                    <path
                        d="M 140,320 C 165,240 230,195 320,178 C 410,161 500,168 575,188 C 650,208 710,240 735,290 C 760,340 748,390 700,415 C 652,440 575,448 480,444 C 385,440 295,430 225,405 C 155,380 120,395 140,320 Z"
                        fill="none"
                        stroke="rgba(15,70,160,0.55)"
                        strokeWidth="1"
                        filter="url(#glow-faint)"
                    />

                    {/* LAYER 3 — Second mountain peak structure, bottom-left zone (outer) */}
                    <path
                        d="M 70,420 C 90,380 130,355 175,345 C 220,335 260,340 285,360 C 310,380 315,410 295,435 C 275,460 235,465 195,458 C 155,451 100,450 70,420 Z"
                        fill="none"
                        stroke="rgba(12,60,140,0.45)"
                        strokeWidth="1"
                        filter="url(#glow-faint)"
                    />

                    {/* LAYER 4 — Second mountain mid ring */}
                    <path
                        d="M 110,415 C 125,385 155,368 188,360 C 221,352 252,356 270,370 C 288,384 290,404 277,420 C 264,436 238,440 210,436 C 182,432 148,436 110,415 Z"
                        fill="none"
                        stroke="rgba(20,90,190,0.5)"
                        strokeWidth="1"
                        filter="url(#glow-faint)"
                    />

                    {/* LAYER 5 — Third elevation ring (main terrain) */}
                    <path
                        d="M 200,305 C 225,240 280,205 355,192 C 430,179 510,186 578,206 C 646,226 700,256 718,300 C 736,344 722,386 680,410 C 638,434 567,440 478,435 C 389,430 310,418 254,392 C 198,366 175,365 200,305 Z"
                        fill="none"
                        stroke="rgba(20,80,180,0.65)"
                        strokeWidth="1.2"
                        filter="url(#glow-faint)"
                    />

                    {/* LAYER 6 — Top-right secondary terrain formation (outer) */}
                    <path
                        d="M 620,100 C 660,80 720,85 760,110 C 800,135 820,175 810,215 C 800,255 770,270 730,268 C 690,266 660,248 640,220 C 620,192 590,125 620,100 Z"
                        fill="none"
                        stroke="rgba(10,55,130,0.45)"
                        strokeWidth="1"
                        filter="url(#glow-faint)"
                    />

                    {/* LAYER 7 — Top-right secondary inner ring */}
                    <path
                        d="M 650,115 C 680,98 726,102 756,122 C 786,142 800,172 792,206 C 784,240 758,254 724,252 C 690,250 664,235 646,210 C 628,185 624,130 650,115 Z"
                        fill="none"
                        stroke="rgba(20,85,185,0.52)"
                        strokeWidth="1"
                        filter="url(#glow-faint)"
                    />

                    {/* LAYER 8 — 4th elevation ring (brighter) */}
                    <path
                        d="M 260,295 C 282,242 332,213 400,202 C 468,191 540,197 600,216 C 660,235 703,262 717,300 C 731,338 718,372 682,394 C 646,416 580,420 495,416 C 410,412 338,402 288,378 C 238,354 238,343 260,295 Z"
                        fill="none"
                        stroke="rgba(25,100,210,0.70)"
                        strokeWidth="1.3"
                        filter="url(#glow-medium)"
                    />

                    {/* LAYER 9 — 5th mid high elevation */}
                    <path
                        d="M 320,290 C 340,248 382,226 440,218 C 498,210 558,214 604,233 C 650,252 685,276 694,308 C 703,340 690,368 658,386 C 626,404 568,408 490,405 C 412,402 348,392 308,370 C 268,348 302,328 320,290 Z"
                        fill="none"
                        stroke="rgba(30,120,230,0.75)"
                        strokeWidth="1.5"
                        filter="url(#glow-medium)"
                    />

                    {/* LAYER 10 — Bright central core rings (glowing bright) */}
                    <path
                        d="M 380,282 C 396,255 428,240 468,236 C 508,232 548,238 578,254 C 608,270 628,294 630,320 C 632,346 618,366 594,378 C 570,390 532,392 486,390 C 440,388 398,378 372,360 C 346,342 364,306 380,282 Z"
                        fill="none"
                        stroke="rgba(40,150,255,0.80)"
                        strokeWidth="1.8"
                        filter="url(#glow-medium)"
                    />

                    {/* LAYER 11 — Inner bright core */}
                    <path
                        d="M 420,302 C 432,278 456,266 488,264 C 520,262 550,268 568,282 C 586,296 596,318 592,338 C 588,358 574,372 550,380 C 526,388 496,386 466,380 C 436,374 408,360 396,340 C 384,320 408,324 420,302 Z"
                        fill="none"
                        stroke="rgba(0,200,255,0.85)"
                        strokeWidth="2"
                        filter="url(#glow-bright)"
                    />

                    {/* LAYER 12 — Innermost bright peak (hottest glow) */}
                    <path
                        d="M 455,318 C 462,304 474,298 492,298 C 510,298 524,308 530,322 C 536,336 530,350 518,358 C 506,366 488,364 474,356 C 460,348 448,332 455,318 Z"
                        fill="none"
                        stroke="rgba(80,220,255,0.90)"
                        strokeWidth="2.2"
                        filter="url(#glow-bright)"
                    />

                    {/* LAYER 13 — Top-right secondary formation inner core */}
                    <path
                        d="M 676,130 C 696,116 724,118 746,134 C 768,150 778,174 770,198 C 762,222 742,234 716,232 C 690,230 670,218 658,198 C 646,178 658,143 676,130 Z"
                        fill="none"
                        stroke="rgba(0,180,255,0.65)"
                        strokeWidth="1.5"
                        filter="url(#glow-medium)"
                    />

                    {/* LAYER 14 — Secondary bottom-left peak core */}
                    <path
                        d="M 155,402 C 165,386 183,378 202,376 C 221,374 238,380 247,394 C 256,408 253,422 242,430 C 231,438 213,438 198,432 C 183,426 165,418 155,402 Z"
                        fill="none"
                        stroke="rgba(0,170,240,0.70)"
                        strokeWidth="1.5"
                        filter="url(#glow-medium)"
                    />

                    {/* Extra organic contour fills — right zone */}
                    <path
                        d="M 750,340 C 770,310 810,290 840,295 C 870,300 885,325 878,355 C 871,385 848,398 820,394 C 792,390 770,375 755,358 C 740,341 730,370 750,340 Z"
                        fill="none"
                        stroke="rgba(12,60,140,0.45)"
                        strokeWidth="1"
                        filter="url(#glow-faint)"
                    />
                    <path
                        d="M 775,350 C 790,328 818,318 840,323 C 862,328 872,348 866,370 C 860,392 840,402 818,398 C 796,394 778,380 768,362 C 758,344 762,370 775,350 Z"
                        fill="none"
                        stroke="rgba(20,90,190,0.55)"
                        strokeWidth="1"
                        filter="url(#glow-faint)"
                    />

                    {/* Extra left-side ridgeline hints */}
                    <path
                        d="M 75,200 C 95,165 135,148 170,150 C 205,152 228,170 230,196 C 232,222 212,238 188,240 C 164,242 130,232 105,215 C 80,198 58,232 75,200 Z"
                        fill="none"
                        stroke="rgba(10,55,130,0.40)"
                        strokeWidth="1"
                        filter="url(#glow-faint)"
                    />

                    {/* ─── TACTICAL NODES ─── */}

                    {/* Node 1 — Observation Post (left-center) */}
                    <g filter="url(#node-glow)">
                        <circle cx="272" cy="348" r="4" fill="rgba(0,180,255,0.85)" />
                        <circle cx="272" cy="348" r="8" fill="none" stroke="rgba(0,180,255,0.45)" strokeWidth="1" />
                        <circle cx="272" cy="348" r="13" fill="none" stroke="rgba(0,180,255,0.15)" strokeWidth="0.5" />
                    </g>

                    {/* Node 2 — Signal Node (top center) */}
                    <g filter="url(#node-glow)">
                        <rect x="452" y="147" width="7" height="7" rx="1" fill="rgba(0,200,255,0.90)" transform="translate(-3.5,-3.5)" />
                        <circle cx="452" cy="147" r="10" fill="none" stroke="rgba(0,200,255,0.35)" strokeWidth="1" />
                    </g>

                    {/* Node 3 — Recon Marker (right) */}
                    <g filter="url(#node-glow)">
                        <circle cx="668" cy="290" r="4" fill="rgba(20,140,240,0.85)" />
                        <circle cx="668" cy="290" r="9" fill="none" stroke="rgba(20,140,240,0.40)" strokeWidth="1" />
                        <circle cx="668" cy="290" r="15" fill="none" stroke="rgba(20,140,240,0.12)" strokeWidth="0.5" />
                    </g>

                    {/* Node 4 — Signal relay (bottom left) */}
                    <g filter="url(#node-glow)">
                        <circle cx="160" cy="440" r="3.5" fill="rgba(0,160,220,0.80)" />
                        <circle cx="160" cy="440" r="8" fill="none" stroke="rgba(0,160,220,0.35)" strokeWidth="0.8" />
                    </g>

                    {/* Node 5 — Observation (top right) */}
                    <g filter="url(#node-glow)">
                        <rect x="735" y="170" width="7" height="7" rx="1" fill="rgba(0,190,255,0.85)" transform="translate(-3.5,-3.5)" />
                        <circle cx="735" cy="170" r="10" fill="none" stroke="rgba(0,190,255,0.35)" strokeWidth="0.8" />
                    </g>

                    {/* Node 6 — Relay bottom-right zone */}
                    <g filter="url(#node-glow)">
                        <circle cx="820" cy="365" r="3.5" fill="rgba(0,150,210,0.75)" />
                        <circle cx="820" cy="365" r="8" fill="none" stroke="rgba(0,150,210,0.30)" strokeWidth="0.8" />
                    </g>

                    {/* ─── TACTICAL COMMUNICATION LINKS (dashed) ─── */}

                    {/* Link 1 → 2 */}
                    <line
                        x1="272" y1="348"
                        x2="452" y2="147"
                        stroke="rgba(0,180,255,0.22)"
                        strokeWidth="0.8"
                        strokeDasharray="4 6"
                    />

                    {/* Link 2 → 5 */}
                    <line
                        x1="452" y1="147"
                        x2="735" y2="170"
                        stroke="rgba(0,180,255,0.20)"
                        strokeWidth="0.8"
                        strokeDasharray="4 6"
                    />

                    {/* Link 5 → 3 */}
                    <line
                        x1="735" y1="170"
                        x2="668" y2="290"
                        stroke="rgba(0,180,255,0.18)"
                        strokeWidth="0.7"
                        strokeDasharray="3 7"
                    />

                    {/* Link 3 → 6 */}
                    <line
                        x1="668" y1="290"
                        x2="820" y2="365"
                        stroke="rgba(0,180,255,0.16)"
                        strokeWidth="0.7"
                        strokeDasharray="3 7"
                    />

                    {/* Link 1 → 4 */}
                    <line
                        x1="272" y1="348"
                        x2="160" y2="440"
                        stroke="rgba(0,160,220,0.18)"
                        strokeWidth="0.7"
                        strokeDasharray="3 8"
                    />

                    {/* Link 2 → 3 */}
                    <line
                        x1="452" y1="147"
                        x2="668" y2="290"
                        stroke="rgba(0,180,255,0.14)"
                        strokeWidth="0.6"
                        strokeDasharray="2 8"
                    />

                    {/* ─── GRID REFERENCE LABELS ─── */}
                    {[
                        { x: 100, y: 75, label: 'A1' },
                        { x: 260, y: 75, label: 'A3' },
                        { x: 440, y: 75, label: 'A5' },
                        { x: 620, y: 75, label: 'A7' },
                        { x: 800, y: 75, label: 'A9' },

                        { x: 100, y: 155, label: 'B1' },
                        { x: 260, y: 155, label: 'B3' },
                        { x: 620, y: 155, label: 'B7' },
                        { x: 800, y: 155, label: 'B9' },

                        { x: 100, y: 240, label: 'C1' },
                        { x: 800, y: 240, label: 'C9' },

                        { x: 100, y: 325, label: 'D1' },
                        { x: 800, y: 325, label: 'D7' },

                        { x: 100, y: 410, label: 'E1' },
                        { x: 260, y: 410, label: 'E3' },
                        { x: 620, y: 410, label: 'E7' },
                        { x: 800, y: 410, label: 'E9' },

                        { x: 100, y: 475, label: 'F1' },
                        { x: 440, y: 475, label: 'F5' },
                        { x: 800, y: 475, label: 'F9' },
                    ].map(({ x, y, label }) => (
                        <text
                            key={label}
                            x={x}
                            y={y}
                            fontSize="8"
                            fontFamily="monospace"
                            fill="rgba(30,100,200,0.35)"
                            textAnchor="middle"
                        >
                            {label}
                        </text>
                    ))}

                    {/* ─── ELEVATION LABELS on contour lines ─── */}
                    <text x="320" y="170" fontSize="7" fontFamily="monospace" fill="rgba(0,160,220,0.40)" textAnchor="middle">2240m</text>
                    <text x="240" y="302" fontSize="7" fontFamily="monospace" fill="rgba(0,160,220,0.35)" textAnchor="middle">1820m</text>
                    <text x="362" y="290" fontSize="7" fontFamily="monospace" fill="rgba(0,180,240,0.45)" textAnchor="middle">2640m</text>
                    <text x="636" y="218" fontSize="7" fontFamily="monospace" fill="rgba(0,180,240,0.40)" textAnchor="middle">2480m</text>
                    <text x="504" y="236" fontSize="7" fontFamily="monospace" fill="rgba(0,190,255,0.55)" textAnchor="middle">3100m</text>
                    <text x="500" y="300" fontSize="7" fontFamily="monospace" fill="rgba(80,220,255,0.65)" textAnchor="middle">PEAK</text>
                </svg>

                {/* ─── BOTTOM STATUS BAR ─── */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-20">
                    <div className="flex items-center gap-4">
                        <span className="text-[8px] font-mono text-[#1F6FEB]/50 uppercase tracking-wider">COORD: 45.023°N / 122.451°E</span>
                        <span className="text-[8px] font-mono text-[#1F6FEB]/40 uppercase">SCALE: 1:50,000</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-px" style={{ background: 'rgba(0,200,255,0.7)', boxShadow: '0 0 4px rgba(0,200,255,0.5)' }} />
                            <span className="text-[7px] font-mono text-[#3A8DFF]/50 uppercase">Contour</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00B4FF]/70" />
                            <span className="text-[7px] font-mono text-[#3A8DFF]/50 uppercase">Node</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 border-t border-dashed border-[#1F6FEB]/50" />
                            <span className="text-[7px] font-mono text-[#3A8DFF]/50 uppercase">Comms Link</span>
                        </div>
                    </div>
                </div>

                {/* Corner brackets — holographic frame details */}
                {/* Top-left */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#1F6FEB]/50 rounded-tl-lg" />
                {/* Top-right */}
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#1F6FEB]/50 rounded-tr-lg" />
                {/* Bottom-left */}
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#1F6FEB]/50 rounded-bl-lg" />
                {/* Bottom-right */}
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#1F6FEB]/50 rounded-br-lg" />
            </div>

            <style jsx>{`
        @keyframes terrain-scan {
          0% { top: 5%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 95%; opacity: 0; }
        }
        .terrain-scan-line {
          animation: terrain-scan 6s linear infinite;
          position: absolute;
        }
      `}</style>
        </div>
    );
}
