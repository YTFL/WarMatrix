'use client';

import React from 'react';
import {
    ShieldCheck,
    Clock,
    RotateCcw,
    Users,
    Target,
    Zap,
    Activity,
    UserPlus,
    FileText,
    ChevronRight,
    Award
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
});

export default function FinalMissionReport() {
    const router = useRouter();
    const [reportData, setReportData] = React.useState<any>(null);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const data = sessionStorage.getItem('missionReportData');
            if (data) {
                try {
                    setReportData(JSON.parse(data));
                } catch (e) {
                    console.error("Failed to parse mission report data", e);
                }
            }
        }
    }, []);

    const missionStatus = reportData?.missionStatus ?? "UNKNOWN";
    const simulationTurns = reportData?.simulationTurns ?? "000";
    const alliedCasualties = reportData?.alliedCasualties ?? "0 Units";
    const infantryLost = reportData?.infantryLost ?? "0";
    const armorLost = reportData?.armorLost ?? "0";
    const supportUnitsLost = reportData?.supportUnitsLost ?? "0";

    const enemyLosses = reportData?.enemyLosses ?? "0 Units";
    const unitsDestroyed = reportData?.unitsDestroyed ?? "0";
    const unitsCaptured = reportData?.unitsCaptured ?? "0";
    const heavyArmorNeutralized = reportData?.heavyArmorNeutralized ?? "0";

    const objectivesCaptured = reportData?.objectivesCaptured ?? "0 / 0";
    const defensiveObjectivesHeld = reportData?.defensiveObjectivesHeld ?? "0";

    const enemyPersonnelCaptured = reportData?.enemyPersonnelCaptured ?? "0";
    const enemyVehiclesCaptured = reportData?.enemyVehiclesCaptured ?? "0";
    const intelRecovered = reportData?.intelRecovered ?? "NONE";

    const commandScore = reportData?.commandScore ?? "0%";
    const operationalEffectiveness = reportData?.operationalEffectiveness ?? "Unknown";
    const strategicExecution = reportData?.strategicExecution ?? "Unknown";
    const riskManagement = reportData?.riskManagement ?? "Unknown";

    const alliedVehiclesDamaged = reportData?.alliedVehiclesDamaged ?? "0";
    const alliedInfantryWounded = reportData?.alliedInfantryWounded ?? "0";
    const enemyArmorDestroyed = reportData?.enemyArmorDestroyed ?? "0";
    const enemyArtilleryNeutralized = reportData?.enemyArtilleryNeutralized ?? "0";

    const simulationActions: { turn: number, action: string }[] = reportData?.simulationActions ?? [];

    return (
        <div className={`h-screen bg-[#0A0A0A] text-[#E6EDF3] flex flex-col items-center overflow-hidden ${spaceGrotesk.className}`}>
            <style>{`
                .custom-report-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-report-scrollbar::-webkit-scrollbar-track {
                    background: rgba(13, 21, 37, 0.4);
                    border-left: 1px solid rgba(31, 111, 235, 0.1);
                }
                .custom-report-scrollbar::-webkit-scrollbar-thumb {
                    background: #3A8DFF;
                    border-radius: 2px;
                    box-shadow: 0 0 10px rgba(58, 141, 255, 0.3);
                }
                .custom-report-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #5CABFF;
                    box-shadow: 0 0 15px rgba(92, 171, 255, 0.5);
                }
                /* For Firefox */
                .custom-report-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #3A8DFF rgba(13, 21, 37, 0.4);
                }
            `}</style>

            {/* PAGE HEADER */}
            <div className="w-full max-w-[1400px] text-center pt-12 pb-10 px-8 shrink-0">
                <h1 className="text-4xl font-bold tracking-[0.4em] text-[#3A8DFF] glow-blue uppercase mb-2">
                    FINAL MISSION REPORT
                </h1>
                <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent to-[#1F6FEB]/40" />
                    <span className="text-[10px] font-bold tracking-[0.5em] text-[#4B6A8A] uppercase text-nowrap">
                        POST-SIMULATION ANALYSIS
                    </span>
                    <div className="h-px w-24 bg-gradient-to-l from-transparent to-[#1F6FEB]/40" />
                </div>
            </div>

            {/* MAIN REPORT PANEL - SCROLLABLE CONTENT AREA */}
            <main className="w-full flex-1 overflow-y-auto custom-report-scrollbar">
                <div className="w-full max-w-[1400px] mx-auto px-8 pb-20 flex flex-col gap-8">

                    <div className="bg-[#0F1115]/80 border border-[#1F6FEB]/30 rounded-sm shadow-[0_0_50px_rgba(31,111,235,0.1)] backdrop-blur-md overflow-hidden flex flex-col">

                        {/* Top Header Bar */}
                        <div className="px-6 py-4 border-b border-[#1F6FEB]/20 bg-[#0D1525]/90 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse shadow-[0_0_8px_#22C55E]" />
                                <span className="text-[12px] font-bold tracking-widest text-[#E6EDF3] uppercase">TACTICAL SUMMARY // CLASSIFIED</span>
                            </div>
                            <div className="text-[10px] font-mono text-[#4B6A8A]">REF: WM-SR-882-0X</div>
                        </div>

                        <div className="p-8 flex flex-col gap-12">

                            {/* SECTION GRID (ROW 1 - 3 columns) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

                                {/* 1. MISSION OUTCOME */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2 border-b border-[#1F6FEB]/10 pb-2">
                                        <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#3A8DFF]">MISSION OUTCOME</h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">MISSION STATUS</span>
                                            <span className="text-sm font-bold text-[#22C55E] tracking-widest uppercase">{missionStatus}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter text-nowrap">Total Simulation Turns</span>
                                            <span className="text-xs font-mono text-[#E6EDF3]">{simulationTurns}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. ALLIED CASUALTIES */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2 border-b border-[#1F6FEB]/10 pb-2">
                                        <Users className="w-4 h-4 text-[#1F6FEB]" />
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#3A8DFF]">ALLIED CASUALTIES</h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Units Lost</span>
                                            <span className="text-sm font-bold text-[#E6EDF3] tracking-widest uppercase">{alliedCasualties}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Infantry Lost</span>
                                            <span className="text-xs font-mono text-[#EF4444]">{infantryLost}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Armor Lost</span>
                                            <span className="text-xs font-mono text-[#EF4444]">{armorLost}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. ENEMY LOSSES */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2 border-b border-[#1F6FEB]/10 pb-2">
                                        <Activity className="w-4 h-4 text-[#EF4444]" />
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#3A8DFF]">ENEMY LOSSES</h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Units Destroyed</span>
                                            <span className="text-sm font-bold text-[#EF4444] tracking-widest uppercase">{enemyLosses}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Units Captured</span>
                                            <span className="text-xs font-mono text-[#F59E0B]">{unitsCaptured}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter text-nowrap">Heavy Armor Destroyed</span>
                                            <span className="text-xs font-mono text-[#EF4444]">{heavyArmorNeutralized}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* SECTION GRID (ROW 2 - 3 columns) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

                                {/* 4. OBJECTIVES STATUS */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2 border-b border-[#1F6FEB]/10 pb-2">
                                        <Target className="w-4 h-4 text-[#F59E0B]" />
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#3A8DFF]">OBJECTIVES STATUS</h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Objectives Captured</span>
                                            <span className="text-sm font-bold text-[#E6EDF3] tracking-widest uppercase">{objectivesCaptured}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Defensive Objectives Held</span>
                                            <span className="text-xs font-mono text-[#22C55E]">{defensiveObjectivesHeld}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 5. ENEMY CAPTURES */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2 border-b border-[#1F6FEB]/10 pb-2">
                                        <UserPlus className="w-4 h-4 text-[#8B5CF6]" />
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#3A8DFF]">ENEMY CAPTURES</h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Personnel Captured</span>
                                            <span className="text-sm font-bold text-[#E6EDF3] tracking-widest uppercase">{enemyPersonnelCaptured}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Vehicles Captured</span>
                                            <span className="text-xs font-mono text-[#E6EDF3]">{enemyVehiclesCaptured}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Intelligence Recovered</span>
                                            <span className="text-xs font-mono text-[#3A8DFF]">{intelRecovered}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 6. COMMAND PERFORMANCE */}
                                <div className="flex flex-col gap-4 lg:col-span-1">
                                    <div className="flex items-center gap-2 border-b border-[#1F6FEB]/10 pb-2">
                                        <Award className="w-4 h-4 text-[#F59E0B]" />
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#3A8DFF]">COMMAND PERFORMANCE</h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Operational Effectiveness</span>
                                            <span className="text-xs font-mono text-[#22C55E] uppercase tracking-wider">{operationalEffectiveness}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Strategic Execution</span>
                                            <span className="text-xs font-mono text-[#F59E0B] uppercase tracking-wider">{strategicExecution}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-[#1F6FEB]/5 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter text-nowrap">Risk Management</span>
                                            <span className="text-xs font-mono text-[#22C55E] uppercase tracking-wider">{riskManagement}</span>
                                        </div>
                                        <div className="mt-2 p-3 bg-[#1F6FEB]/5 border border-[#1F6FEB]/10 rounded-sm flex flex-col items-center">
                                            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#4B6A8A] mb-1">Overall Command Score</span>
                                            <span className="text-2xl font-bold text-[#E6EDF3] glow-blue">{commandScore}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* DAMAGE ASSESSMENT ROW (2 columns) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                                {/* 7. ALLIED DAMAGE SUSTAINED */}
                                <div className="flex flex-col gap-4 p-6 bg-[#EF4444]/5 border border-[#EF4444]/15 rounded-sm">
                                    <div className="flex items-center gap-2 border-b border-[#EF4444]/20 pb-2">
                                        <Zap className="w-4 h-4 text-[#EF4444]" />
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#EF4444]">Allied Damage Sustained</h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-end border-b border-[#EF4444]/10 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Vehicles Damaged</span>
                                            <span className="text-xs font-mono text-[#E6EDF3]">{alliedVehiclesDamaged}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-[#EF4444]/10 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Infantry Wounded</span>
                                            <span className="text-xs font-mono text-[#E6EDF3]">{alliedInfantryWounded}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 8. ENEMY DAMAGE SUSTAINED */}
                                <div className="flex flex-col gap-4 p-6 bg-[#22C55E]/5 border border-[#22C55E]/15 rounded-sm">
                                    <div className="flex items-center gap-2 border-b border-[#22C55E]/20 pb-2">
                                        <Zap className="w-4 h-4 text-[#22C55E]" />
                                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#22C55E]">Enemy Damage Sustained</h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-end border-b border-[#22C55E]/10 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Armor Destroyed</span>
                                            <span className="text-xs font-mono text-[#E6EDF3]">{enemyArmorDestroyed}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-[#22C55E]/10 pb-1">
                                            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Artillery Neutralized</span>
                                            <span className="text-xs font-mono text-[#E6EDF3]">{enemyArtilleryNeutralized}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* 9. SIMULATION ACTION LOG */}
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center justify-between border-b border-[#1F6FEB]/20 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-[#1F6FEB]/10 border border-[#1F6FEB]/20 rounded-sm">
                                            <Clock className="w-4 h-4 text-[#3A8DFF]" />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="text-[14px] font-bold uppercase tracking-[0.3em] text-[#E6EDF3]">SIMULATION ACTION LOG</h3>
                                            <span className="text-[8px] font-bold tracking-[0.5em] text-[#4B6A8A] uppercase text-nowrap">TACTICAL COMMAND TIMELINE</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#1F6FEB] animate-pulse" />
                                        <span className="text-[9px] font-mono text-[#1F6FEB]/70 uppercase font-bold">COMMUNICATIONS LINK ACTIVE</span>
                                    </div>
                                </div>

                                {/* Action Log Panel */}
                                <div className="relative group">
                                    <div className="h-auto max-h-[400px] overflow-y-auto custom-scrollbar bg-[#080E1C]/60 border border-[#1F6FEB]/30 rounded-sm p-6 flex flex-col gap-3 font-mono backdrop-blur-sm">
                                        {simulationActions.length > 0 ? (
                                            simulationActions.map((log, idx) => (
                                                <div key={idx} className="flex gap-4 items-start py-1.5 border-b border-[#1F6FEB]/5 last:border-0 hover:bg-[#1F6FEB]/5 transition-colors px-3 rounded-sm group/line">
                                                    <span className="text-[11px] font-bold text-[#E6EDF3] leading-relaxed">
                                                        Turn {String(log.turn).padStart(3, '0')} — {log.action}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-20 flex flex-col items-center justify-center gap-3 opacity-40">
                                                <div className="p-4 rounded-full bg-[#1F6FEB]/5 border border-[#1F6FEB]/10 mb-2">
                                                    <Activity className="w-8 h-8 text-[#1F6FEB]/40" />
                                                </div>
                                                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#4B6A8A]">
                                                    NO SIMULATION ACTIONS RECORDED
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* RETURN BUTTON */}
                        <div className="px-6 py-12 border-t border-[#1F6FEB]/20 bg-[#0D1525]/90 flex justify-center">
                            <button
                                onClick={() => router.push('/console')}
                                className="group relative px-12 py-4 bg-[#0D223A] border border-[#1F6FEB]/40 hover:border-[#3A8DFF]/60 rounded-sm transition-all duration-300"
                            >
                                {/* Decorative corners */}
                                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#1F6FEB] opacity-60" />
                                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#1F6FEB] opacity-60" />
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#1F6FEB] opacity-60" />
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#1F6FEB] opacity-60" />

                                <div className="flex items-center gap-4">
                                    <RotateCcw className="w-4 h-4 text-[#1F6FEB] group-hover:rotate-[-45deg] transition-transform duration-500" />
                                    <span className="text-sm font-bold uppercase tracking-[0.4em] text-[#E6EDF3] group-hover:text-[#3A8DFF] transition-colors">
                                        RETURN TO COMMAND CONSOLE
                                    </span>
                                    <ChevronRight className="w-5 h-5 text-[#1F6FEB] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </div>
                            </button>
                        </div>

                    </div>

                    {/* FOOTER INFO */}
                    <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 opacity-30 mt-4 mb-10">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3A8DFF]" />
                            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em]">WARMATRIX CONSOLE V2.4</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3A8DFF]" />
                            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em]">SECURE SIMULATION ENCLAVE</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3A8DFF]" />
                            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em]">STATION ID: CMD-ALPHA</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
