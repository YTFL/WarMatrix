'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    CloudRain,
    Eye,
    Wind,
    Thermometer,
    MapIcon,
    Shield,
    Crosshair,
    AlertTriangle,
    Swords,
    Activity,
    Radio,
    ChevronDown,
    Users,
    Truck,
    PlaneTakeoff,
    Boxes as BoxesIcon,
    BrainCircuit,
    Zap,
    FileText,
    Bell,
    BookOpen,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActiveScenario {
    title: string;
    briefing: string;
    terrainType: string;
    units: any[];
}

interface SidebarAccordionProps {
    activeScenario: ActiveScenario | null;
    lastResult: { command: string; success: number; risk: number; outcome: string } | null;
    loadingAnalysis: boolean;
    analysis: any;
    turn: number;
}

// ─── Accordion Panel ─────────────────────────────────────────────────────────

interface AccordionPanelProps {
    id: string;
    title: string;
    icon: React.ElementType;
    activeId: string | null;
    onToggle: (id: string) => void;
    children: React.ReactNode;
    statusDot?: 'green' | 'red' | 'amber' | 'gray';
}

function AccordionPanel({
    id,
    title,
    icon: Icon,
    activeId,
    onToggle,
    children,
    statusDot,
}: AccordionPanelProps) {
    const isOpen = activeId === id;
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (isOpen && contentRef.current) {
            setHeight(contentRef.current.scrollHeight);
        } else {
            setHeight(0);
        }
    }, [isOpen]);

    const dotColors = {
        green: '#22C55E',
        red: '#EF4444',
        amber: '#F59E0B',
        gray: '#4B5563',
    };

    return (
        <div
            className="rounded-sm overflow-hidden"
            style={{
                background: 'rgba(8,14,28,0.85)',
                border: `1px solid ${isOpen ? 'rgba(31,111,235,0.45)' : 'rgba(31,111,235,0.18)'}`,
                transition: 'border-color 0.25s ease',
                boxShadow: isOpen ? '0 0 16px rgba(31,111,235,0.06)' : 'none',
            }}
        >
            {/* Header */}
            <button
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left group"
                style={{ outline: 'none' }}
                onClick={() => onToggle(id)}
            >
                {/* Status dot */}
                {statusDot && (
                    <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                            background: dotColors[statusDot],
                            boxShadow: statusDot !== 'gray' ? `0 0 5px ${dotColors[statusDot]}80` : 'none',
                        }}
                    />
                )}

                <Icon
                    className="w-3 h-3 shrink-0"
                    style={{ color: isOpen ? '#3A8DFF' : '#4B6A8A' }}
                />

                <span
                    className="flex-1 text-[9px] font-bold uppercase tracking-widest truncate"
                    style={{ color: isOpen ? '#E6EDF3' : '#8B9BAF' }}
                >
                    {title}
                </span>

                <ChevronDown
                    className="w-3 h-3 shrink-0 transition-transform duration-200"
                    style={{
                        color: isOpen ? '#3A8DFF' : '#4B6A8A',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            {/* Expandable content */}
            <div
                style={{
                    height: `${height}px`,
                    overflow: 'hidden',
                    transition: 'height 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                <div
                    ref={contentRef}
                    className="px-3 pb-3"
                    style={{ borderTop: '1px solid rgba(31,111,235,0.12)' }}
                >
                    <div className="pt-2.5">{children}</div>
                </div>
            </div>
        </div>
    );
}

// ─── Data Row ────────────────────────────────────────────────────────────────

function DataRow({
    icon: Icon,
    label,
    value,
    valueColor,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    valueColor?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-2 py-1 border-b border-[#1F6FEB]/08 last:border-0">
            <div className="flex items-center gap-1.5">
                <Icon className="w-2.5 h-2.5 text-[#4B6A8A] shrink-0" />
                <span className="text-[8px] uppercase font-bold tracking-wider text-[#6B7280]">
                    {label}
                </span>
            </div>
            <span
                className="text-[9px] font-mono font-bold"
                style={{ color: valueColor ?? '#C9D3E0' }}
            >
                {value}
            </span>
        </div>
    );
}

// ─── Sidebar Accordion Component ─────────────────────────────────────────────

export function SidebarAccordion({
    activeScenario,
    lastResult,
    loadingAnalysis,
    analysis,
    turn,
}: SidebarAccordionProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const handleToggle = (id: string) => {
        setActiveId(prev => (prev === id ? null : id));
    };

    const friendly = activeScenario?.units.filter(u => u.type === 'FRIENDLY').length ?? 0;
    const enemy = activeScenario?.units.filter(u => u.type === 'ENEMY').length ?? 0;
    const objective = activeScenario?.units.filter(u => u.type === 'OBJECTIVE').length ?? 0;
    const total = activeScenario?.units.length ?? 0;

    return (
        <div className="flex flex-col gap-2">

            {/* ── 1. Weather Status ── */}
            <AccordionPanel
                id="weather"
                title="Weather Status"
                icon={CloudRain}
                activeId={activeId}
                onToggle={handleToggle}
                statusDot={activeScenario ? 'green' : 'gray'}
            >
                <div className="flex flex-col gap-0.5">
                    <DataRow
                        icon={Thermometer}
                        label="Temperature"
                        value={activeScenario ? '18°C / 64°F' : '— —'}
                        valueColor={activeScenario ? '#F59E0B' : '#4B5563'}
                    />
                    <DataRow
                        icon={Eye}
                        label="Visibility"
                        value={activeScenario ? '8.5 KM' : '— —'}
                        valueColor={activeScenario ? '#22C55E' : '#4B5563'}
                    />
                    <DataRow
                        icon={Wind}
                        label="Wind Speed"
                        value={activeScenario ? '14 KT NE' : '— —'}
                        valueColor={activeScenario ? '#38BDF8' : '#4B5563'}
                    />
                    <DataRow
                        icon={MapIcon}
                        label="Terrain Impact"
                        value={activeScenario ? 'MODERATE' : 'N/A'}
                        valueColor={activeScenario ? '#F59E0B' : '#4B5563'}
                    />
                    <DataRow
                        icon={CloudRain}
                        label="Condition"
                        value={activeScenario ? 'PARTLY CLOUDY' : 'STANDBY'}
                        valueColor={activeScenario ? '#C9D3E0' : '#4B5563'}
                    />
                </div>
            </AccordionPanel>

            {/* ── 2. Enemy Intelligence ── */}
            <AccordionPanel
                id="intel"
                title="Enemy Intelligence"
                icon={Crosshair}
                activeId={activeId}
                onToggle={handleToggle}
                statusDot={activeScenario ? (enemy > 5 ? 'red' : 'amber') : 'gray'}
            >
                <div className="flex flex-col gap-0.5">
                    <DataRow
                        icon={Swords}
                        label="Detected Units"
                        value={activeScenario ? `${enemy} HOSTILES` : '—'}
                        valueColor={activeScenario && enemy > 0 ? '#EF4444' : '#4B5563'}
                    />
                    <DataRow
                        icon={MapIcon}
                        label="Last Known Coords"
                        value={activeScenario ? '45.02°N 122.45°E' : '—'}
                        valueColor={activeScenario ? '#C9D3E0' : '#4B5563'}
                    />
                    <DataRow
                        icon={AlertTriangle}
                        label="Threat Level"
                        value={activeScenario ? (enemy > 6 ? 'CRITICAL' : enemy > 3 ? 'HIGH' : 'MODERATE') : '—'}
                        valueColor={
                            activeScenario
                                ? enemy > 6 ? '#EF4444' : enemy > 3 ? '#F59E0B' : '#22C55E'
                                : '#4B5563'
                        }
                    />
                    <DataRow
                        icon={Activity}
                        label="Movement"
                        value={activeScenario ? 'ADVANCING NW' : '—'}
                        valueColor={activeScenario ? '#F59E0B' : '#4B5563'}
                    />
                </div>
                {activeScenario && (
                    <div
                        className="mt-2.5 p-2 rounded-sm"
                        style={{
                            background: 'rgba(239,68,68,0.07)',
                            border: '1px solid rgba(239,68,68,0.18)',
                        }}
                    >
                        <p className="text-[8px] font-mono text-[#9CA3AF] leading-relaxed">
                            INTEL DIVISION: {enemy} enemy unit{enemy !== 1 ? 's' : ''} identified on grid. Recommend immediate counter-response.
                        </p>
                    </div>
                )}
            </AccordionPanel>

            {/* ── 3. Force Deployment Status ── */}
            <AccordionPanel
                id="forces"
                title="Force Deployment Status"
                icon={Shield}
                activeId={activeId}
                onToggle={handleToggle}
                statusDot={activeScenario ? 'green' : 'gray'}
            >
                <div className="flex flex-col gap-0.5">
                    <DataRow
                        icon={Users}
                        label="Infantry Units"
                        value={activeScenario ? `${Math.max(1, Math.round(friendly * 0.45))} SQDS` : '—'}
                        valueColor={activeScenario ? '#3B82F6' : '#4B5563'}
                    />
                    <DataRow
                        icon={Truck}
                        label="Armored Units"
                        value={activeScenario ? `${Math.max(0, Math.round(friendly * 0.25))} VEH` : '—'}
                        valueColor={activeScenario ? '#3B82F6' : '#4B5563'}
                    />
                    <DataRow
                        icon={PlaneTakeoff}
                        label="Air Support"
                        value={activeScenario ? `${Math.max(0, Math.round(friendly * 0.15))} CRAFT` : '—'}
                        valueColor={activeScenario ? '#3B82F6' : '#4B5563'}
                    />
                    <DataRow
                        icon={BoxesIcon}
                        label="Reserve Forces"
                        value={activeScenario ? `${Math.max(1, Math.round(friendly * 0.15))} SQDS` : '—'}
                        valueColor={activeScenario ? '#9CA3AF' : '#4B5563'}
                    />
                    <DataRow
                        icon={Radio}
                        label="Objectives Held"
                        value={activeScenario ? `${objective}` : '—'}
                        valueColor={activeScenario ? '#F59E0B' : '#4B5563'}
                    />
                </div>
                {activeScenario && (
                    <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-[7px] font-mono text-[#4B5563] uppercase tracking-wider">
                            Total Forces
                        </span>
                        <span className="text-[11px] font-bold font-mono text-[#3B82F6]">
                            {friendly} <span className="text-[#4B5563] text-[8px]">UNITS</span>
                        </span>
                    </div>
                )}
            </AccordionPanel>

            {/* ── 4. Threat Assessment Engine ── */}
            <AccordionPanel
                id="threat"
                title="Threat Assessment Engine"
                icon={BrainCircuit}
                activeId={activeId}
                onToggle={handleToggle}
                statusDot={activeScenario ? (loadingAnalysis ? 'amber' : 'green') : 'gray'}
            >
                <div className="flex flex-col gap-0.5">
                    <DataRow
                        icon={AlertTriangle}
                        label="Risk Level"
                        value={analysis ? 'LOW-MODERATE' : activeScenario ? 'CALCULATING…' : '—'}
                        valueColor={analysis ? '#F59E0B' : activeScenario ? '#A78BFA' : '#4B5563'}
                    />
                    <DataRow
                        icon={Crosshair}
                        label="Attack Probability"
                        value={activeScenario ? '62%' : '—'}
                        valueColor={activeScenario ? '#EF4444' : '#4B5563'}
                    />
                    <DataRow
                        icon={Shield}
                        label="Def. Vulnerabilities"
                        value={activeScenario ? '3 SECTORS' : '—'}
                        valueColor={activeScenario ? '#F59E0B' : '#4B5563'}
                    />
                    <DataRow
                        icon={BrainCircuit}
                        label="AI Prediction Score"
                        value={activeScenario ? (analysis ? '84.2%' : 'N/A') : '—'}
                        valueColor={activeScenario && analysis ? '#22C55E' : '#4B5563'}
                    />
                </div>
                {activeScenario && (
                    <div
                        className="mt-2.5 p-2 rounded-sm"
                        style={{
                            background: loadingAnalysis ? 'rgba(167,139,250,0.07)' : 'rgba(31,111,235,0.06)',
                            border: `1px solid ${loadingAnalysis ? 'rgba(167,139,250,0.20)' : 'rgba(31,111,235,0.15)'}`,
                        }}
                    >
                        {loadingAnalysis ? (
                            <p className="text-[8px] font-mono text-[#A78BFA] leading-relaxed">
                                AI ENGINE ANALYZING battlefield data — Turn {turn}…
                            </p>
                        ) : (
                            <p className="text-[8px] font-mono text-[#9CA3AF] leading-relaxed">
                                {analysis
                                    ? 'Operational environment assessed. Strategic recommendations cached.'
                                    : 'No active scenario. Deploy forces to activate threat analysis.'}
                            </p>
                        )}
                    </div>
                )}
            </AccordionPanel>

            {/* ── 5. Operations Feed ── */}
            <AccordionPanel
                id="ops"
                title="Operations Feed"
                icon={Activity}
                activeId={activeId}
                onToggle={handleToggle}
                statusDot={activeScenario ? 'green' : 'gray'}
            >
                <div className="flex flex-col gap-1.5">
                    {/* Recent Tactical Updates */}
                    <div>
                        <div className="flex items-center gap-1 mb-1">
                            <FileText className="w-2.5 h-2.5 text-[#4B6A8A]" />
                            <span className="text-[7px] font-bold uppercase tracking-widest text-[#6B7280]">
                                Tactical Updates
                            </span>
                        </div>
                        <div
                            className="p-1.5 rounded-sm"
                            style={{
                                background: 'rgba(13,34,58,0.50)',
                                borderLeft: '1px solid rgba(31,111,235,0.40)',
                            }}
                        >
                            <p className="text-[9px] font-mono text-[#E6EDF3] leading-snug">
                                {lastResult
                                    ? `EXEC › ${lastResult.command}`
                                    : activeScenario
                                        ? `SCENARIO LIVE: ${activeScenario.title}`
                                        : 'AWAITING_SCENARIO_LOAD'}
                            </p>
                        </div>
                    </div>

                    {/* System Notifications */}
                    <div>
                        <div className="flex items-center gap-1 mb-1">
                            <Bell className="w-2.5 h-2.5 text-[#4B6A8A]" />
                            <span className="text-[7px] font-bold uppercase tracking-widest text-[#6B7280]">
                                System Notifications
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            {[
                                { msg: activeScenario ? 'UPLINK ESTABLISHED' : 'UPLINK IDLE', color: activeScenario ? '#22C55E' : '#4B5563' },
                                { msg: `TURN ${String(turn).padStart(3, '0')} // SYNCHRONIZED`, color: activeScenario ? '#3A8DFF' : '#4B5563' },
                                { msg: loadingAnalysis ? 'AI ANALYZING…' : 'AI ENGINE READY', color: loadingAnalysis ? '#A78BFA' : '#4B5563' },
                            ].map((n, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div
                                        className="w-1 h-1 rounded-full shrink-0"
                                        style={{ background: n.color }}
                                    />
                                    <span className="text-[8px] font-mono" style={{ color: n.color }}>
                                        {n.msg}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mission Logs */}
                    <div>
                        <div className="flex items-center gap-1 mb-1">
                            <BookOpen className="w-2.5 h-2.5 text-[#4B6A8A]" />
                            <span className="text-[7px] font-bold uppercase tracking-widest text-[#6B7280]">
                                Mission Logs
                            </span>
                        </div>
                        <div
                            className="p-1.5 rounded-sm"
                            style={{
                                background: 'rgba(10,16,30,0.60)',
                                border: '1px solid rgba(31,111,235,0.10)',
                            }}
                        >
                            {activeScenario ? (
                                <p className="text-[8px] font-mono text-[#9CA3AF] leading-relaxed line-clamp-3">
                                    {activeScenario.briefing}
                                </p>
                            ) : (
                                <p className="text-[8px] font-mono text-[#374151] italic">
                                    No mission loaded. Standby for briefing.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Bottom status line */}
                    <div className="flex items-center gap-1.5 mt-1">
                        <Activity
                            className={`w-2.5 h-2.5 ${activeScenario ? 'text-[#1F6FEB]' : 'text-[#374151]'}`}
                            style={activeScenario ? { animation: 'pulse 2s infinite' } : {}}
                        />
                        <span className="text-[7px] font-mono text-[#4B5563]">
                            {activeScenario
                                ? 'QUEUE_EMPTY // READY_FOR_STATE_CHANGE'
                                : 'STANDBY // AWAITING_INITIALIZATION'}
                        </span>
                    </div>
                </div>
            </AccordionPanel>
        </div>
    );
}
