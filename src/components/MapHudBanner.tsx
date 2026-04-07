'use client';

import React from 'react';
import { Boxes, CloudRain, Eye, LucideIcon, Thermometer, Wind } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActiveScenario {
    title: string;
    briefing: string;
    terrainType: string;
    units: any[];
}

interface MapHudBannerProps {
    activeScenario: ActiveScenario | null;
}

// ─── Single HUD chip ─────────────────────────────────────────────────────────

interface HudChipProps {
    icon: LucideIcon;
    label: string;
    children: React.ReactNode;
}

function HudChip({ icon: Icon, label, children }: HudChipProps) {
    return (
        <div
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-sm shrink-0"
            style={{
                background: 'rgba(4,10,22,0.80)',
                border: '1px solid rgba(31,111,235,0.28)',
                backdropFilter: 'blur(6px)',
            }}
        >
            <Icon className="w-3 h-3 text-[#3A8DFF] shrink-0" />
            <div className="flex flex-col">
                <span className="text-[7px] font-bold uppercase tracking-widest text-[#4B6A8A] leading-none mb-0.5">
                    {label}
                </span>
                <div className="flex items-center gap-2">{children}</div>
            </div>
        </div>
    );
}

// ─── Stat chip inside HudChip ────────────────────────────────────────────────

function Stat({
    icon: Icon,
    value,
    color,
}: {
    icon: LucideIcon;
    value: string;
    color?: string;
}) {
    return (
        <div className="flex items-center gap-1">
            <Icon className="w-2 h-2" style={{ color: color ?? '#6B7280' }} />
            <span className="text-[9px] font-mono font-bold" style={{ color: color ?? '#C9D3E0' }}>
                {value}
            </span>
        </div>
    );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MapHudBanner({ activeScenario }: MapHudBannerProps) {
    const isActive = !!activeScenario;

    return (
        <div
            className="flex items-center gap-2 px-2 py-1.5 shrink-0"
            style={{
                background: 'rgba(3,7,18,0.60)',
                borderBottom: '1px solid rgba(31,111,235,0.15)',
            }}
        >
            {/* Left label */}
            <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-[#1F6FEB]/15">
                <div
                    className="w-1 h-1 rounded-full"
                    style={{
                        background: isActive ? '#22C55E' : '#374151',
                        boxShadow: isActive ? '0 0 5px #22C55E' : 'none',
                    }}
                />
                <span className="text-[7px] font-bold uppercase tracking-widest text-[#4B5563]">
                    ENV HUD
                </span>
            </div>

            {/* ── Terrain chip ── */}
            <HudChip icon={Boxes} label="Terrain">
                <span
                    className="text-[9px] font-mono font-bold"
                    style={{ color: isActive ? '#C9D3E0' : '#4B5563' }}
                >
                    {isActive ? activeScenario.terrainType.toUpperCase() : '—'}
                </span>
                <div
                    className="px-1 py-0.5 rounded-sm text-[6px] font-bold uppercase tracking-wider"
                    style={{
                        background: isActive ? 'rgba(245,158,11,0.15)' : 'rgba(75,85,99,0.15)',
                        color: isActive ? '#F59E0B' : '#4B5563',
                    }}
                >
                    {isActive ? 'OPERATIONAL' : 'STANDBY'}
                </div>
            </HudChip>

            {/* separator */}
            <div className="w-px h-6 bg-[#1F6FEB]/12 mx-0.5" />

            {/* ── Weather chip ── */}
            <HudChip icon={CloudRain} label="Weather">
                <Stat
                    icon={Thermometer}
                    value={isActive ? '18°C' : '—'}
                    color={isActive ? '#F59E0B' : '#4B5563'}
                />
                <div className="w-px h-3 bg-[#1F6FEB]/15" />
                <Stat
                    icon={Eye}
                    value={isActive ? '8.5 KM' : '—'}
                    color={isActive ? '#22C55E' : '#4B5563'}
                />
                <div className="w-px h-3 bg-[#1F6FEB]/15" />
                <Stat
                    icon={Wind}
                    value={isActive ? '14 KT NE' : '—'}
                    color={isActive ? '#38BDF8' : '#4B5563'}
                />
                <div className="w-px h-3 bg-[#1F6FEB]/15" />
                <span
                    className="text-[8px] font-mono font-bold"
                    style={{ color: isActive ? '#9CA3AF' : '#4B5563' }}
                >
                    {isActive ? 'PARTLY CLOUDY' : 'N/A'}
                </span>
            </HudChip>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right status */}
            <span className="text-[7px] font-mono uppercase tracking-widest text-[#374151]">
                {isActive ? `${activeScenario.units.length} UNITS ON MAP` : 'NO SCENARIO LOADED'}
            </span>
        </div>
    );
}
