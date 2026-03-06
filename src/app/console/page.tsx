'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { TacticalMap } from '@/components/TacticalMap';
import { ScenarioBuilder } from '@/components/ScenarioBuilder';
import { TerrainIntelligencePanel } from '@/components/TerrainIntelligencePanel';
import { SecureCommsConsole, ChatMessage, MessageSource, INITIAL_LOG, nowTs } from '@/components/SecureCommsConsole';
import { receiveStrategicAnalysis, ReceiveStrategicAnalysisOutput } from '@/ai/flows/receive-strategic-analysis';
import { useToast } from '@/hooks/use-toast';
import { TacticalWidget } from '@/components/TacticalWidget';
import {
    Activity,
    CloudRain,
    Radio,
    Boxes,
    Zap,
    BrainCircuit,
    Terminal,
    ShieldAlert,
    MessageSquare,
    Send,
    Cpu,
    Target,
    Maximize2
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Unit {
    id: string;
    type: 'FRIENDLY' | 'ENEMY' | 'OBJECTIVE';
    x: number;
    y: number;
    label: string;
}

export default function WarMatrixPage() {
    const { toast } = useToast();
    const [turn, setTurn] = useState(1);
    const [status, setStatus] = useState<'ACTIVE' | 'AWAITING COMMAND' | 'PROCESSING'>('ACTIVE');
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [analysis, setAnalysis] = useState<ReceiveStrategicAnalysisOutput | null>(null);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [isCommsConsoleOpen, setIsCommsConsoleOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [lastResult, setLastResult] = useState<{
        command: string;
        success: number;
        risk: number;
        outcome: string;
    } | null>(null);

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_LOG);

    const handleAddChatMessage = (msg: ChatMessage) => {
        setChatMessages(prev => [...prev, msg]);
    };

    const handleBriefingGenerated = (title: string, briefing: string) => {
        console.log('Briefing generated:', title, briefing);
        const briefingMsg: ChatMessage = {
            id: `briefing-${Date.now()}`,
            source: 'AI_STRATEGIST',
            headline: `MISSION BRIEFING: ${title}`,
            body: briefing,
            timestamp: nowTs(),
            classification: 'SECRET',
        };

        const statusMsg: ChatMessage = {
            id: `status-${Date.now() + 1}`,
            source: 'INTEL_DIVISION',
            headline: 'OPERATIONAL STATUS REPORT',
            body: `Battlefield topography analyzed. Tactical deployment ready in sector. High-priority objectives identified. Communications uplink secure.`,
            timestamp: nowTs(),
            classification: 'CONFIDENTIAL',
        };

        setChatMessages(prev => [...prev, briefingMsg, statusMsg]);

        toast({
            title: "Incoming Transmission",
            description: "AI Strategist has uploaded the mission briefing.",
        });
    };

    const [units, setUnits] = useState<Unit[]>([
        { id: 'f1', type: 'FRIENDLY', x: 2, y: 3, label: 'Alpha Platoon' },
        { id: 'f2', type: 'FRIENDLY', x: 5, y: 6, label: 'Bravo Support' },
        { id: 'e1', type: 'ENEMY', x: 10, y: 2, label: 'Unknown Hostile 01' },
        { id: 'e2', type: 'ENEMY', x: 11, y: 7, label: 'Fortified Outpost' },
        { id: 'o1', type: 'OBJECTIVE', x: 6, y: 4, label: 'Objective Sierra' },
    ]);

    const fetchStrategicAnalysis = async () => {
        setLoadingAnalysis(true);
        try {
            const summary = `
        Turn ${turn}.
        Units breakdown: ${units.map(u => `${u.label} (${u.type}) at [${u.x},${u.y}]`).join(', ')}.
      `;
            const result = await receiveStrategicAnalysis({
                battlefieldSummary: summary,
                missionObjectives: "Secure Objective Sierra and neutralize enemy threats in Sector Alpha-9."
            });
            setAnalysis(result);
        } catch (error) {
            console.error('Failed to get AI analysis', error);
            toast({
                title: "Communication Failure",
                description: "AI Strategist uplink timed out.",
                variant: "destructive",
            });
        } finally {
            setLoadingAnalysis(false);
        }
    };

    useEffect(() => {
        fetchStrategicAnalysis();
    }, [turn, units]);

    const handleExecuteCommand = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || status === 'PROCESSING') return;

        const command = inputValue.trim();
        setInputValue('');
        setStatus('PROCESSING');

        // Add user message to shared chat feed
        const userMsg: ChatMessage = {
            id: `uw-${Date.now()}`,
            source: 'COMMAND_INPUT',
            body: command,
            timestamp: nowTs(),
        };
        setChatMessages(prev => [...prev, userMsg]);

        try {
            const res = await fetch('/api/sitrep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    directive: command,
                    mode: 'GENERAL',
                    battlefield_data: `Turn ${turn}. Units: ${units.map(u => `${u.label} (${u.type}) at [${u.x},${u.y}]`).join(', ')}.`,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                const aiMsg: ChatMessage = {
                    id: `ai-${Date.now()}`,
                    source: 'AI_STRATEGIST',
                    headline: 'TACTICAL AI RESPONSE',
                    body: data.response ?? '(Empty response from AI server)',
                    timestamp: nowTs(),
                    classification: 'CONFIDENTIAL',
                };
                setChatMessages(prev => [...prev, aiMsg]);

                // Update simulation state
                setTurn(prev => prev + 1);
                setUnits(prev => prev.map(u => ({
                    ...u,
                    x: Math.max(1, Math.min(11, u.x + (Math.random() > 0.8 ? 1 : Math.random() < 0.2 ? -1 : 0))),
                    y: Math.max(1, Math.min(7, u.y + (Math.random() > 0.8 ? 1 : Math.random() < 0.2 ? -1 : 0)))
                })));

                setLastResult({
                    command,
                    success: 85,
                    risk: 15,
                    outcome: `AI STRATEGIST: Tactical directive processed.`
                });
            } else {
                throw new Error(data.error || 'AI server failed');
            }
        } catch (err: any) {
            console.error('Command execution failed:', err);
            const sysMsg: ChatMessage = {
                id: `sw-${Date.now()}`,
                source: 'SYSTEM',
                body: `UPLINK FAILURE — ${err.message || 'Check AI server status.'}`,
                timestamp: nowTs(),
            };
            setChatMessages(prev => [...prev, sysMsg]);
        } finally {
            setStatus('ACTIVE');
        }
    };

    const visibleUnits = units;

    return (
        <div className="flex flex-col h-screen select-none bg-[#0A0A0A] overflow-hidden">
            <Header
                turn={turn}
                status={status}
                onOpenBuilder={() => setIsBuilderOpen(true)}
            />

            <main className="flex-1 p-4 flex gap-4 overflow-hidden">
                {/* LEFT ZONE: Intel Widgets */}
                <div className="w-64 flex flex-col gap-4 shrink-0 overflow-y-auto pr-1 scrollbar-hide">
                    <TacticalWidget title="Terrain Status" icon={Boxes}>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-[#E6EDF3] font-medium">Highland / Rugged</span>
                            <div className="flex justify-between items-center text-[9px] text-[#9CA3AF] uppercase font-bold">
                                <span>Difficulty</span>
                                <span className="text-[#F59E0B]">Elevated</span>
                            </div>
                        </div>
                    </TacticalWidget>

                    <TacticalWidget title="Weather Status" icon={CloudRain}>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-[#E6EDF3] font-medium">Partly Cloudy / 18°C</span>
                            <div className="flex justify-between items-center text-[9px] text-[#9CA3AF] uppercase font-bold">
                                <span>Visibility</span>
                                <span className="text-[#22C55E]">8.5 KM</span>
                            </div>
                        </div>
                    </TacticalWidget>

                    <TacticalWidget title="Comm Status" icon={Radio}>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                                <span className="text-[10px] font-mono text-[#E6EDF3]">LINK_ESTABLISHED</span>
                            </div>
                            <span className="text-[9px] text-[#9CA3AF] uppercase font-bold tracking-tighter">ENCRYPTION: AES-256</span>
                        </div>
                    </TacticalWidget>

                    <TacticalWidget title="Power Grid" icon={Zap}>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-[9px] text-[#9CA3AF] uppercase font-bold">
                                <span>Stability</span>
                                <span className="text-[#22C55E]">88%</span>
                            </div>
                            <div className="h-1 bg-[#0D223A] rounded-full overflow-hidden">
                                <div className="h-full bg-[#22C55E] w-[88%]" />
                            </div>
                        </div>
                    </TacticalWidget>
                </div>

                {/* CENTER & RIGHT ZONE */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    <div className="flex-1 flex gap-4 overflow-hidden">
                        <div className="flex-1 relative">
                            <TacticalMap units={visibleUnits} />
                            <TerrainIntelligencePanel />
                        </div>

                        <div className="w-80 flex flex-col shrink-0">
                            <TacticalWidget
                                title="AI Strategic Analysis"
                                icon={BrainCircuit}
                                headerAction={loadingAnalysis && <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />}
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-[#9CA3AF] uppercase font-bold">Status</span>
                                        <span className={`text-[10px] font-bold ${loadingAnalysis ? 'text-[#F59E0B]' : 'text-[#22C55E]'}`}>
                                            {loadingAnalysis ? 'ANALYZING...' : 'READY'}
                                        </span>
                                    </div>
                                    <div className="bg-[#0D223A]/30 border border-[#1F6FEB]/10 p-2 rounded-sm">
                                        <span className="text-[9px] text-[#9CA3AF] uppercase font-bold mb-1 block">Risk Signals</span>
                                        <span className="text-sm font-headline font-bold text-[#EF4444]">
                                            {analysis ? 'LOW-MODERATE' : '---'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[#9CA3AF] italic leading-relaxed">
                                        {analysis ? 'Operational environment assessed. Strategic recommendations cached.' : 'Awaiting battlefield snapshot for updated briefing.'}
                                    </p>
                                </div>
                            </TacticalWidget>
                        </div>
                    </div>

                    {/* BOTTOM ZONE: Modular Widgets */}
                    <div className="h-44 flex gap-4 shrink-0">
                        <TacticalWidget title="Simulation Engine" icon={Cpu} className="w-64">
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-[#9CA3AF] uppercase font-bold">Mission Turn</span>
                                        <span className="text-xl font-headline text-white leading-none">{turn.toString().padStart(3, '0')}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] text-[#9CA3AF] uppercase font-bold block">Outcome Prob.</span>
                                        <span className="text-sm font-bold text-[#22C55E]">84.2%</span>
                                    </div>
                                </div>
                                <div className="text-[9px] font-mono text-[#4B5563] border-t border-[#1F6FEB]/10 pt-2">
                                    STATE: {status === 'ACTIVE' ? 'SYNCHRONIZED' : 'PROCESSING_BUFFER'}
                                </div>
                            </div>
                        </TacticalWidget>

                        <TacticalWidget
                            title="Secure Comms"
                            icon={MessageSquare}
                            className="flex-1"
                            headerAction={
                                <button
                                    onClick={() => setIsCommsConsoleOpen(true)}
                                    className="w-5 h-5 flex items-center justify-center rounded-sm border border-[#1F6FEB]/20 text-[#1F6FEB]/50 hover:text-[#3A8DFF] hover:border-[#1F6FEB]/50 transition-all"
                                    title="Open Strategic Ops Console"
                                >
                                    <Maximize2 className="w-2.5 h-2.5" />
                                </button>
                            }
                        >
                            <form onSubmit={handleExecuteCommand} className="flex-1 flex flex-col gap-3">
                                <div className="flex-1 flex flex-col min-h-0 bg-[#0A0A0A]/50 border border-[#1F6FEB]/10 rounded-sm p-2 overflow-y-auto scrollbar-hide">
                                    {chatMessages.slice(-5).map((msg) => (
                                        <div key={msg.id} className="mb-2 last:mb-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className="text-[7px] font-bold text-[#3A8DFF] uppercase tracking-wider">{msg.source}</span>
                                                <span className="text-[6px] font-mono text-[#4B5563]">{msg.timestamp}</span>
                                            </div>
                                            <p className="text-[10px] font-mono text-[#9CA3AF] line-clamp-2">{msg.body}</p>
                                        </div>
                                    ))}
                                    {chatMessages.length === 0 && (
                                        <div className="text-[11px] font-mono text-[#4B5563]">Awaiting tactical directive...</div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Terminal className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#1F6FEB]/50" />
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Input Operational Directive..."
                                            className="w-full h-9 bg-[#0D223A]/50 border border-[#1F6FEB]/30 rounded-sm pl-8 pr-2 text-[10px] font-mono text-white placeholder:text-[#4B5563] focus:outline-none focus:border-[#3A8DFF] transition-all"
                                            disabled={status === 'PROCESSING'}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!inputValue.trim() || status === 'PROCESSING'}
                                        className="w-10 h-9 bg-[#1A3B5D] hover:bg-[#3A8DFF] disabled:opacity-30 flex items-center justify-center rounded-sm border border-[#1F6FEB]/30 transition-all"
                                    >
                                        <Send className="w-3.5 h-3.5 text-[#3A8DFF]" />
                                    </button>
                                </div>
                            </form>
                        </TacticalWidget>

                        <TacticalWidget title="Operations Feed" icon={ShieldAlert} className="w-80">
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center text-[9px] text-[#9CA3AF] uppercase font-bold">
                                    <span>Latest Status</span>
                                    <span className="text-[#22C55E]">TRANSMITTING</span>
                                </div>
                                <div className="p-2 bg-[#151A20] border-l border-[#1F6FEB] rounded-sm">
                                    <p className="text-[10px] font-mono text-[#E6EDF3] leading-tight">
                                        {lastResult ? `EXEC: ${lastResult.command}` : 'AWAITING_UPLINK'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 mt-auto">
                                    <Activity className="w-3 h-3 text-[#1F6FEB] animate-pulse" />
                                    <span className="text-[8px] font-mono text-[#4B5563]">QUEUE_EMPTY // READY_FOR_STATE_CHANGE</span>
                                </div>
                            </div>
                        </TacticalWidget>
                    </div>
                </div>
            </main>

            <ScenarioBuilder
                units={units}
                onUpdateUnits={setUnits}
                isOpen={isBuilderOpen}
                onClose={() => setIsBuilderOpen(false)}
                onBriefingGenerated={handleBriefingGenerated}
            />

            <SecureCommsConsole
                messages={chatMessages}
                onMessagesChange={setChatMessages}
                isOpen={isCommsConsoleOpen}
                onClose={() => setIsCommsConsoleOpen(false)}
                battlefieldContext={`Turn ${turn}. ${units.map(u => `${u.label} (${u.type}) at [${u.x},${u.y}]`).join(', ')}.`}
            />

            <div className="fixed inset-0 pointer-events-none z-[60] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        </div>
    );
}
