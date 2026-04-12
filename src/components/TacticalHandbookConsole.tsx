import React, { useState } from 'react';
import { X, BookOpen, Search, Shield, Target, Zap, Waves, ChevronRight, FileText, ClipboardList, Info, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SOP {
    id: string;
    title: string;
    icon: any;
    category: string;
    content: string;
    requirements: string[];
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

const SOPS: SOP[] = [
    {
        id: 'recon-01',
        title: 'Reconnaissance-in-Force',
        icon: Target,
        category: 'TACTICAL MANEUVERS',
        riskLevel: 'MODERATE',
        content: `Establish forward observation posts at grid intersections. Deploy light mechanized units in a leapfrog pattern to trigger enemy fire and reveal hidden positions without committing main battle forces. 

Reconnaissance-in-force is used when satellite intelligence is obscured or when the enemy has established deep-cover camouflage. Units must be prepared for immediate evasion once contact is established.`,
        requirements: ['Light Mechanized Squad', 'UAV Recon Link', 'LOS Comm-Link']
    },
    {
        id: 'def-02',
        title: 'Elastic Defense Grid',
        icon: Shield,
        category: 'DEFENSIVE DOCTRINE',
        riskLevel: 'LOW',
        content: `Identify primary and secondary fall-back lines. When engaged by superior force, front-line units should conduct a fighting withdrawal to drawing the enemy into prepared kill zones under friendly artillery cover. 

The goal is not to hold ground but to degrade enemy momentum and logistics. Withdrawal must be organized; scattered retreats will be exploited by enemy mechanized pursuit.`,
        requirements: ['Overlapping Fire Sectors', 'Preset Extraction Routes', 'Artillery Support Ready']
    },
    {
        id: 'ambush-03',
        title: 'L-Shaped Ambush',
        icon: Zap,
        category: 'TACTICAL MANEUVERS',
        riskLevel: 'HIGH',
        content: `Position an assault element parallel to the enemy direction of travel and a support element perpendicular. This creates a lethal crossfire while preventing friendly fire incidents. 

Success depends on absolute surprise. The long arm of the 'L' provides the primary volume of fire, while the short arm prevents enemy breakthrough or flanking of the primary element.`,
        requirements: ['Concealment Rating > 85%', 'Redundant Comms', 'Claymore Perimeter']
    },
    {
        id: 'storm-04',
        title: 'Adverse Weather Ops',
        icon: Waves,
        category: 'ENVIRONMENTAL LOGISTICS',
        riskLevel: 'MODERATE',
        content: `During heavy precipitation or fog, reduce mechanized speed by 40%. Increase dependence on thermal optics and short-range acoustic sensors. Maintain strict radio silence to prevent signal triangulation in humid conditions. 

Visibility degradation impacts both friendly and enemy forces; use environmental sound (rain/wind) to mask movement sounds that would otherwise be detectable by acoustic sensors.`,
        requirements: ['Thermal Imaging Online', 'Acoustic Sensor Array', 'Waterproofing Kit-A']
    }
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// ─── Radio Voice Engine ───────────────────────────────────────────────────────

function useRadioVoice() {
    const [enabled, setEnabled] = React.useState(false);
    const audioCtxRef = React.useRef<AudioContext | null>(null);

    const speak = (text: string) => {
        if (!enabled || !window.speechSynthesis) return;

        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const cleanText = text.replace(/[*#_\[\]()]/g, '').replace(/\|/g, ' ').trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Male") || v.lang === 'en-US');
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 1.05;
        utterance.pitch = 0.95;
        window.speechSynthesis.speak(utterance);
    };

    return { enabled, setEnabled, speak };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TacticalHandbookConsole({ isOpen, onClose }: Props) {
    const { enabled: radioEnabled, setEnabled: setRadioEnabled, speak } = useRadioVoice();
    const [selectedId, setSelectedId] = useState(SOPS[0].id);
    const [search, setSearch] = useState('');

    const selected = SOPS.find(s => s.id === selectedId) || SOPS[0];
    
    // Auto-speak on selection change
    React.useEffect(() => {
        if (isOpen && selected) {
            speak(`Loading Doctrine: ${selected.title}. ${selected.content.split('\n')[0]}`);
        }
    }, [selectedId, isOpen, radioEnabled]);
    const filtered = SOPS.filter(s => 
        s.title.toLowerCase().includes(search.toLowerCase()) || 
        s.category.toLowerCase().includes(search.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[301] flex items-center justify-center p-6" style={{ background: 'rgba(5,8,16,0.92)', backdropFilter: 'blur(8px)' }}>
            <div 
                className="relative w-full max-w-[1400px] h-full max-h-[850px] flex flex-col rounded-sm overflow-hidden"
                style={{
                    background: 'linear-gradient(160deg, #070D1A 0%, #050A14 60%, #060C18 100%)',
                    border: '1px solid rgba(167,139,250,0.30)',
                    boxShadow: '0 0 60px rgba(167,139,250,0.08), inset 0 0 80px rgba(80,50,150,0.05)',
                }}
            >
                {/* ── HEADER ── */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#A78BFA]/20 bg-[#060C18]/80 shrink-0">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-4.5 h-4.5 text-[#A78BFA]" />
                        <div>
                            <h2 className="text-[16px] font-bold uppercase tracking-[0.3em] text-[#A78BFA]">
                                DOCTRINE CENTER
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <FileText className="w-2.5 h-2.5 text-[#A78BFA]/60" />
                                <span className="text-[11px] font-mono text-[#A78BFA]/60 uppercase tracking-[0.2em]">
                                    SOP Tactical Handbook — Version 4.2.1-Alpha
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Audio Toggle */}
                        <button
                            onClick={() => setRadioEnabled(!radioEnabled)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border transition-all ${
                                radioEnabled 
                                ? 'bg-[#A78BFA]/10 border-[#A78BFA]/50 text-[#C4B5FD]' 
                                : 'bg-transparent border-[#A78BFA]/10 text-[#4B6A8A]'
                            }`}
                        >
                            {radioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em]">
                                Audio Uplink: {radioEnabled ? 'ON' : 'OFF'}
                            </span>
                        </button>

                        <button
                            onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-sm border border-[#A78BFA]/20 text-[#4B6A8A] hover:text-[#E6EDF3] hover:border-[#A78BFA]/50 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* ── LEFT: BROWSER ── */}
                    <div className="w-72 border-r border-[#A78BFA]/15 flex flex-col shrink-0">
                        <div className="p-4 border-b border-[#A78BFA]/10">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4B6A8A]" />
                                <input 
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="SEARCH DOCTRINE..."
                                    className="w-full h-9 bg-[#0D1830]/50 border border-[#A78BFA]/20 rounded-sm pl-9 pr-3 text-[12px] font-mono text-[#E6EDF3] placeholder:text-[#374151] focus:outline-none focus:border-[#A78BFA]/50 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto warmatrix-scrollbar p-2 flex flex-col gap-1.5">
                            {filtered.map((sop) => (
                                <button
                                    key={sop.id}
                                    onClick={() => setSelectedId(sop.id)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-sm border transition-all flex flex-col gap-1",
                                        selectedId === sop.id 
                                        ? "bg-[#A78BFA]/10 border-[#A78BFA]/40 shadow-[inset_0_0_10px_rgba(167,139,250,0.1)]"
                                        : "bg-transparent border-transparent hover:bg-[#A78BFA]/05"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <sop.icon className={cn("w-3.5 h-3.5", selectedId === sop.id ? "text-[#A78BFA]" : "text-[#4B6A8A]")} />
                                        <span className={cn("text-[12px] font-bold uppercase tracking-wide", selectedId === sop.id ? "text-[#E6EDF3]" : "text-[#8B9BAF]")}>
                                            {sop.title}
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-mono text-[#4B6A8A] uppercase">{sop.category}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── CENTER: DOCTRINE VIEW ── */}
                    <div className="flex-1 flex flex-col overflow-y-auto warmatrix-scrollbar bg-[#050810]/40 p-10">
                        <div className="max-w-4xl mx-auto w-full">
                            {/* Title Section */}
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#A78BFA]/20">
                                <div>
                                    <span className="text-[11px] font-mono text-[#A78BFA] font-bold uppercase tracking-[0.4em] mb-2 block">
                                        Procedure / {selected.id}
                                    </span>
                                    <h1 className="text-[32px] font-headline font-bold text-white uppercase tracking-tighter">
                                        {selected.title}
                                    </h1>
                                </div>
                                <div className="text-right">
                                    <span className="text-[11px] font-mono text-[#4B6A8A] block mb-1">RISK LEVEL</span>
                                    <span className={cn(
                                        "text-[14px] font-bold font-mono tracking-widest px-3 py-1 rounded-sm border",
                                        selected.riskLevel === 'CRITICAL' ? "text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/05" :
                                        selected.riskLevel === 'HIGH' ? "text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/05" :
                                        "text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/05"
                                    )}>
                                        {selected.riskLevel}
                                    </span>
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="md:col-span-2 flex flex-col gap-6">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4 text-[#A78BFA]" />
                                        <span className="text-[13px] font-bold text-[#A78BFA] uppercase tracking-[0.2em]">Operational Overview</span>
                                    </div>
                                    <p className="text-[16px] font-mono leading-relaxed text-[#9CA3AF] whitespace-pre-line">
                                        {selected.content}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-8">
                                    {/* Requirements */}
                                    <div className="p-5 rounded-sm bg-[#0D1830]/40 border border-[#A78BFA]/10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <ClipboardList className="w-4 h-4 text-[#A78BFA]" />
                                            <span className="text-[11px] font-bold text-[#A78BFA] uppercase tracking-[0.2em]">Operational Assets</span>
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            {selected.requirements.map(req => (
                                                <div key={req} className="flex items-center gap-2 px-2 py-1.5 rounded-sm bg-[#A78BFA]/05 border border-[#A78BFA]/10">
                                                    <ChevronRight className="w-2.5 h-2.5 text-[#A78BFA]/50" />
                                                    <span className="text-[11px] font-mono text-[#C9D3E0]">{req}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Classification Tag */}
                                    <div className="border border-[#A78BFA]/20 p-4 rounded-sm flex flex-col gap-2 opacity-50">
                                        <span className="text-[10px] text-center font-bold text-[#A78BFA] uppercase tracking-[0.3em]">Authorized Access Only</span>
                                        <span className="text-[8px] text-center font-mono text-[#4B6A8A]">
                                            DISTRIBUTION RESTRICTED TO SECTION-9 COMMANDERS. 
                                            UNAUTHORIZED VIEWING IS A VIOLATION OF TACTICAL SECURITY ENCRYPTION ACT.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
