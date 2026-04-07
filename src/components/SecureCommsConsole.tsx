'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    X,
    Send,
    Terminal,
    BrainCircuit,
    ShieldAlert,
    Cpu,
    Radio,
    ChevronRight,
    Lock,
    Zap,
    Eye,
    AlertTriangle,
    HelpCircle,
    LucideIcon,
} from 'lucide-react';
import { strategicCommandChat, StrategicChatOutput } from '@/ai/flows/strategic-command-chat';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageSource =
    | 'COMMAND_INPUT'
    | 'AI_STRATEGIST'
    | 'SIMULATION_ENGINE'
    | 'INTEL_DIVISION'
    | 'FOG_OF_WAR_MODULE'
    | 'SYSTEM';

export interface ChatMessage {
    id: string;
    source: MessageSource;
    headline?: string;
    body: string;
    timestamp: string;
    classification?: string;
    metrics?: { label: string; value: string }[];
}

type ActionMode = 'SCENARIO_SEED' | 'INTEL_UPDATE' | 'FOG_OF_WAR' | 'EXPLAIN_DECISION' | 'GENERAL';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    battlefieldContext?: string;
    messages: ChatMessage[];
    onMessagesChange: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
    disableDirectAiCalls?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function nowTs() {
    return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const sourceStyle: Record<MessageSource, { label: string; color: string; dot: string }> = {
    COMMAND_INPUT: { label: 'COMMANDER', color: '#E6EDF3', dot: '#9CA3AF' },
    AI_STRATEGIST: { label: 'AI STRATEGIST', color: '#3A8DFF', dot: '#1F6FEB' },
    SIMULATION_ENGINE: { label: 'SIMULATION ENGINE', color: '#A78BFA', dot: '#7C3AED' },
    INTEL_DIVISION: { label: 'INTEL DIVISION', color: '#38BDF8', dot: '#0EA5E9' },
    FOG_OF_WAR_MODULE: { label: 'FOG OF WAR MODULE', color: '#94A3B8', dot: '#475569' },
    SYSTEM: { label: 'SYSTEM', color: '#22C55E', dot: '#16A34A' },
};

const classificationColor: Record<string, string> = {
    TOP_SECRET: '#EF4444',
    SECRET: '#F59E0B',
    CONFIDENTIAL: '#3A8DFF',
    UNCLASSIFIED: '#4B5563',
};

export const INITIAL_LOG: ChatMessage[] = [
    {
        id: 'sys-1',
        source: 'SYSTEM',
        body: 'Encrypted link established on channel WARMATRIX-ALPHA. AES-256 active.',
        timestamp: '00:00:01',
    },
    {
        id: 'sys-2',
        source: 'SYSTEM',
        body: 'AI Strategist core loaded. Awaiting commander directive.',
        timestamp: '00:00:02',
    },
    {
        id: 'sys-3',
        source: 'AI_STRATEGIST',
        headline: 'System Ready',
        body: 'Strategic Operations Channel is active. All simulation subsystems online. Awaiting your tactical directive, Commander.',
        timestamp: '00:00:03',
        classification: 'CONFIDENTIAL',
    },
];

// ─── Action Buttons ───────────────────────────────────────────────────────────

interface ActionDef {
    mode: ActionMode;
    label: string;
    sublabel: string;
    icon: LucideIcon;
    prompt: string;
}

const ACTIONS: ActionDef[] = [
    {
        mode: 'SCENARIO_SEED',
        label: 'SCENARIO SEEDING',
        sublabel: 'Generate operational narrative',
        icon: BrainCircuit,
        prompt: 'Generate a full operational scenario briefing including strategic context, battlefield situation, and initial intelligence.',
    },
    {
        mode: 'INTEL_UPDATE',
        label: 'INTELLIGENCE UPDATE',
        sublabel: 'Enemy movements & signals',
        icon: Eye,
        prompt: 'Provide latest intelligence update including enemy movements, signal intercepts, and threat assessments.',
    },
    {
        mode: 'FOG_OF_WAR',
        label: 'FOG OF WAR EVENT',
        sublabel: 'Inject uncertainty event',
        icon: AlertTriangle,
        prompt: 'Inject a realistic fog-of-war uncertainty event into the current operational scenario.',
    },
    {
        mode: 'EXPLAIN_DECISION',
        label: 'EXPLAIN DECISION',
        sublabel: 'Explainable AI reasoning',
        icon: HelpCircle,
        prompt: 'Explain the reasoning behind the current simulation results, predicted outcomes, and risk signals.',
    },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function SecureCommsConsole({ isOpen, onClose, battlefieldContext = 'Sector Alpha-9, Highland terrain. Friendly forces at grid B3 and E5. Enemy forces detected at grid D7 and F2.', messages, onMessagesChange, disableDirectAiCalls = false }: Props) {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiServerOnline, setAiServerOnline] = useState<boolean | null>(null); // null = checking
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const container = chatEndRef.current?.parentElement;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
            if (isAtBottom) {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
            // Ping the health proxy to show real AI server status
            fetch('/api/sitrep')
                .then((r) => setAiServerOnline(r.ok))
                .catch(() => setAiServerOnline(false));
        }
    }, [isOpen]);

    const sendDirective = async (directive: string, mode: ActionMode = 'GENERAL') => {
        if (!directive.trim() || loading) return;

        const userMsg: ChatMessage = {
            id: `cmd-${Date.now()}`,
            source: 'COMMAND_INPUT',
            body: directive.trim(),
            timestamp: nowTs(),
        };

        onMessagesChange((prev) => [...prev, userMsg]);
        setInputValue('');

        if (disableDirectAiCalls) {
            const sysMsg: ChatMessage = {
                id: `sys-${Date.now()}`,
                source: 'SYSTEM',
                body: 'Direct AI chat is disabled in simulation-authoritative mode. Submit actions via Command Link to process turn simulation and AI narrative together.',
                timestamp: nowTs(),
            };
            onMessagesChange((prev) => [...prev, sysMsg]);
            return;
        }

        setLoading(true);

        try {
            // ── PRIMARY: Python fine-tuned AI server ──────────────────────────
            let usedFallback = false;
            let serverErrorMsg: string | null = null;
            let aiMsg: ChatMessage | null = null;

            try {
                const res = await fetch('/api/sitrep', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        directive: directive.trim(),
                        mode,
                        battlefield_data: battlefieldContext,
                    }),
                });

                const data = await res.json();

                if (res.ok) {
                    // ✅ Success — model responded
                    setAiServerOnline(true);
                    aiMsg = {
                        id: `ai-${Date.now()}`,
                        source: 'AI_STRATEGIST',
                        headline: 'TACTICAL AI RESPONSE',
                        body: data.response ?? '(Empty response from AI server)',
                        timestamp: nowTs(),
                        classification: 'CONFIDENTIAL',
                    };
                } else if (data?.error === 'ai_server_offline') {
                    // ❌ Server genuinely not reachable
                    setAiServerOnline(false);
                    serverErrorMsg = 'AI SERVER OFFLINE — Local model server is not reachable. Start backend_server.py to restore the uplink.';
                    usedFallback = true;
                } else if (data?.error === 'ai_inference_timeout') {
                    // ⏳ Server is alive but took too long (CPU inference is slow)
                    setAiServerOnline(true);
                    serverErrorMsg = 'INFERENCE TIMEOUT — The model is still processing. Wait a moment and try again, or reduce the length of your directive.';
                    usedFallback = true;
                } else {
                    // ⚠️ Server is up but inference failed (bad flags, OOM, etc.)
                    setAiServerOnline(true);
                    serverErrorMsg = `INFERENCE ERROR — ${data?.details ?? 'The model returned an error. Check backend_server.py logs.'}`;
                    usedFallback = true;
                }
            } catch {
                // Network-level failure (fetch threw) → treat as offline
                setAiServerOnline(false);
                serverErrorMsg = 'AI SERVER OFFLINE — Could not reach backend_server.py.';
                usedFallback = true;
            }

            // ── STRATEGIC ANALYSIS: Local LLM fallback ─────────────────────────
            if (usedFallback || aiMsg === null) {
                const result: StrategicChatOutput = await strategicCommandChat({
                    directive: directive.trim(),
                    mode,
                    context: battlefieldContext,
                });
                aiMsg = {
                    id: `ai-${Date.now()}`,
                    source: result.source as MessageSource,
                    headline: result.headline,
                    body: result.body,
                    timestamp: nowTs(),
                    classification: result.classification,
                    metrics: result.metrics,
                };
            }

            onMessagesChange((prev) => [...prev, aiMsg!]);
        } catch (err) {
            const errMsg: ChatMessage = {
                id: `err-${Date.now()}`,
                source: 'SYSTEM',
                body: 'UPLINK FAILURE — All AI channels timed out. Check server status.',
                timestamp: nowTs(),
            };
            onMessagesChange((prev) => [...prev, errMsg]);
        } finally {
            setLoading(false);
        }

    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendDirective(inputValue, 'GENERAL');
    };

    const handleAction = (action: ActionDef) => {
        sendDirective(action.prompt, action.mode);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(5,8,16,0.90)', backdropFilter: 'blur(6px)' }}>
            {/* Panel */}
            <div
                className="relative w-full max-w-[1400px] h-full max-h-[820px] flex flex-col rounded-sm overflow-hidden"
                style={{
                    background: 'linear-gradient(160deg, #070D1A 0%, #050A14 60%, #060C18 100%)',
                    border: '1px solid rgba(31,111,235,0.35)',
                    boxShadow: '0 0 60px rgba(31,111,235,0.12), 0 0 120px rgba(0,60,150,0.08), inset 0 0 80px rgba(0,30,80,0.10)',
                }}
            >
                {/* ── HEADER ── */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#1F6FEB]/20 bg-[#060C18]/80 shrink-0">
                    <div className="flex items-center gap-3">
                        <Radio className="w-4 h-4 text-[#1F6FEB]" />
                        <div>
                            <h2 className="text-[15px] font-bold uppercase tracking-[0.25em] text-[#1F6FEB]">
                                COMMAND LINK
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Lock className="w-2.5 h-2.5 text-[#22C55E]" />
                                <span className="text-[11.5px] font-mono text-[#22C55E] uppercase tracking-wider">
                                    STRATEGIC OPS UPLINK — SECURE
                                </span>
                                <span className="text-[11.5px] font-mono text-[#1F6FEB]/40">| AES-256 | CHANNEL ALPHA</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" style={{ boxShadow: '0 0 6px #22C55E' }} />
                            <span className="text-[11.5px] font-mono text-[#22C55E] uppercase">LINK ACTIVE</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 flex items-center justify-center rounded-sm border border-[#1F6FEB]/20 text-[#4B5563] hover:text-[#E6EDF3] hover:border-[#1F6FEB]/50 transition-all"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* ── TOP DIVIDER GLOW ── */}
                <div className="h-px w-full shrink-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(31,111,235,0.4), transparent)' }} />

                {/* ── BODY ── */}
                <div className="flex-1 flex overflow-hidden">

                    {/* ──────────────── LEFT: CONVERSATION HISTORY ──────────────── */}
                    <div className="w-64 flex flex-col border-r border-[#1F6FEB]/15 shrink-0">
                        <div className="px-3 py-2 border-b border-[#1F6FEB]/10 bg-[#060C18]/60 shrink-0">
                            <span className="text-[11.5px] font-bold uppercase tracking-[0.2em] text-[#1F6FEB]/70">Conversation Log</span>
                        </div>
                        <div className="flex-1 overflow-y-auto warmatrix-scrollbar p-2 flex flex-col gap-1 min-h-0">
                            {messages.map((msg) => {
                                const style = sourceStyle[msg.source];
                                return (
                                    <div
                                        key={msg.id}
                                        className="p-2 rounded-sm border border-[#1F6FEB]/08 bg-[#0A1020]/40 hover:bg-[#0D1830]/60 transition-colors cursor-default"
                                    >
                                        <div className="flex items-center justify-between mb-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full shrink-0" style={{ background: style.dot }} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: style.color }}>
                                                    {style.label}
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-mono text-[#4B5563]">{msg.timestamp}</span>
                                        </div>
                                        <p className="text-[11.5px] font-mono text-[#6B7280] leading-relaxed line-clamp-2">
                                            {msg.body}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ──────────────── CENTER: ACTIVE CHAT CHANNEL ──────────────── */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto warmatrix-scrollbar p-4 flex flex-col gap-3 min-h-0">
                            {messages.map((msg) => {
                                const style = sourceStyle[msg.source];
                                const isUser = msg.source === 'COMMAND_INPUT';
                                const clsColor = msg.classification ? classificationColor[msg.classification] : undefined;

                                return (
                                    <div key={msg.id} className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                                        {/* Header row */}
                                        <div className="flex items-center gap-2 px-1">
                                            {!isUser && (
                                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: style.dot, boxShadow: `0 0 4px ${style.dot}` }} />
                                            )}
                                            <span className="text-[11.5px] font-bold uppercase tracking-widest" style={{ color: style.color }}>
                                                {style.label}
                                            </span>
                                            <span className="text-[10.5px] font-mono text-[#4B5563]">{msg.timestamp}</span>
                                            {clsColor && (
                                                <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded-sm border uppercase" style={{ color: clsColor, borderColor: `${clsColor}40` }}>
                                                    {msg.classification}
                                                </span>
                                            )}
                                            {isUser && (
                                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: style.dot }} />
                                            )}
                                        </div>

                                        {/* Message bubble */}
                                        <div
                                            className="max-w-[75%] rounded-sm p-3"
                                            style={
                                                isUser
                                                    ? {
                                                        background: 'rgba(31,111,235,0.10)',
                                                        border: '1px solid rgba(31,111,235,0.25)',
                                                    }
                                                    : {
                                                        background: 'rgba(10,16,30,0.80)',
                                                        border: '1px solid rgba(31,111,235,0.12)',
                                                    }
                                            }
                                        >
                                            {msg.headline && (
                                                <p className="text-[13px] font-bold uppercase tracking-wider text-[#E6EDF3] mb-1.5">
                                                    {msg.headline}
                                                </p>
                                            )}
                                            <p className="text-[14px] font-mono leading-relaxed text-[#9CA3AF]">
                                                {msg.body}
                                            </p>

                                            {/* Metrics */}
                                            {msg.metrics && msg.metrics.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-[#1F6FEB]/10 flex flex-wrap gap-3">
                                                    {msg.metrics.map((m) => (
                                                        <div key={m.label} className="flex flex-col">
                                                            <span className="text-[10px] font-mono text-[#4B5563] uppercase">{m.label}</span>
                                                            <span className="text-[14px] font-bold text-[#3A8DFF]">{m.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Loading indicator */}
                            {loading && (
                                <div className="flex items-center gap-2 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1F6FEB] animate-ping" />
                                    <span className="text-[11.5px] font-mono text-[#3A8DFF] uppercase tracking-wider">
                                        PROCESSING DIRECTIVE...
                                    </span>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Input bar */}
                        <div className="shrink-0 px-4 py-3 border-t border-[#1F6FEB]/15 bg-[#060C18]/60">
                            <form onSubmit={handleSubmit} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#1F6FEB]/50" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Enter tactical directive..."
                                        disabled={loading}
                                        className="w-full h-11 bg-[#0D1830]/70 border border-[#1F6FEB]/25 rounded-sm pl-9 pr-3 text-[15px] font-mono text-white placeholder:text-[#374151] focus:outline-none focus:border-[#3A8DFF]/60 transition-all disabled:opacity-50"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || loading}
                                    className="w-11 h-11 bg-[#0D1830] hover:bg-[#1A3B5D] disabled:opacity-30 flex items-center justify-center rounded-sm border border-[#1F6FEB]/30 hover:border-[#3A8DFF]/60 transition-all"
                                >
                                    <Send className="w-3.5 h-3.5 text-[#3A8DFF]" />
                                </button>
                            </form>
                            <div className="mt-1.5 flex items-center gap-2">
                                <ChevronRight className="w-2.5 h-2.5 text-[#1F6FEB]/40" />
                                <span className="text-[10px] font-mono text-[#4B5563]">
                                    Try: &quot;Generate battlefield briefing&quot; · &quot;Simulate enemy reinforcement&quot; · &quot;Evaluate mission risk&quot;
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ──────────────── RIGHT: AI ACTION MODULES ──────────────── */}
                    <div className="w-60 flex flex-col border-l border-[#1F6FEB]/15 shrink-0">
                        <div className="px-3 py-2 border-b border-[#1F6FEB]/10 bg-[#060C18]/60 shrink-0">
                            <span className="text-[11.5px] font-bold uppercase tracking-[0.2em] text-[#1F6FEB]/70">AI Action Modules</span>
                        </div>
                        <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto warmatrix-scrollbar min-h-0">
                            {ACTIONS.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <button
                                        key={action.mode}
                                        onClick={() => handleAction(action)}
                                        disabled={loading}
                                        className="w-full text-left p-3 rounded-sm border border-[#1F6FEB]/15 bg-[#0A1020]/50 hover:bg-[#0D1830]/80 hover:border-[#1F6FEB]/40 transition-all disabled:opacity-40 group"
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <div className="mt-0.5 w-6 h-6 flex items-center justify-center rounded-sm bg-[#1F6FEB]/10 border border-[#1F6FEB]/20 shrink-0 group-hover:bg-[#1F6FEB]/20 transition-colors">
                                                <Icon className="w-3 h-3 text-[#1F6FEB]" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#E6EDF3] group-hover:text-white transition-colors leading-tight">
                                                    {action.label}
                                                </span>
                                                <span className="text-[10px] font-mono text-[#4B5563] mt-0.5 leading-relaxed">
                                                    {action.sublabel}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {/* Status block */}
                            <div className="mt-auto pt-3 border-t border-[#1F6FEB]/10">
                                <div className="p-2.5 rounded-sm bg-[#0A1020]/60 border border-[#1F6FEB]/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Cpu className="w-3 h-3 text-[#1F6FEB]/60" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F6FEB]/60">System Status</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        {[
                                            {
                                                label: 'AI Core',
                                                value: aiServerOnline === null ? 'CHECKING' : aiServerOnline ? 'ONLINE' : 'OFFLINE',
                                                ok: aiServerOnline === true,
                                                warn: aiServerOnline === null,
                                            },
                                            { label: 'Sim Engine', value: 'READY', ok: true, warn: false },
                                            { label: 'Intel Feed', value: 'ACTIVE', ok: true, warn: false },
                                            { label: 'Link Integrity', value: '99.8%', ok: true, warn: false },
                                        ].map((s) => (
                                            <div key={s.label} className="flex justify-between items-center">
                                                <span className="text-[10px] font-mono text-[#4B5563]">{s.label}</span>
                                                <span className={`text-[10px] font-bold font-mono ${s.warn ? 'text-[#F59E0B]' : s.ok ? 'text-[#22C55E]' : 'text-[#EF4444]'
                                                    }`}>
                                                    {s.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                    <Zap className="w-2.5 h-2.5 text-[#1F6FEB]/40 animate-pulse" />
                                    <span className="text-[9px] font-mono text-[#374151]">WARMATRIX AI ENGINE v3.1.4</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
