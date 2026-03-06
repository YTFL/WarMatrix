'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { TacticalMapDisplay } from '@/components/TacticalMapDisplay';
import { ScenarioBuilder } from '@/components/ScenarioBuilder';
import { SecureCommsConsole, ChatMessage, MessageSource, INITIAL_LOG, nowTs } from '@/components/SecureCommsConsole';
import { receiveStrategicAnalysis, ReceiveStrategicAnalysisOutput } from '@/ai/flows/receive-strategic-analysis';
import { GenerateScenarioOutput } from '@/ai/flows/generate-scenario';
import { useToast } from '@/hooks/use-toast';
import { TacticalWidget } from '@/components/TacticalWidget';
import {
  Activity,
  CloudRain,
  Radio,
  Boxes,
  Zap,
  BrainCircuit,
  ShieldAlert,
  MessageSquare,
  Send,
  Maximize2,
  MapPin,
  AlertCircle,
  PlayCircle,
  Shuffle,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type TerrainType = 'Highland' | 'Forest' | 'Urban' | 'Plains' | 'Desert' | 'Mountain' | 'Coastal' | 'Arctic';
type WeatherType = 'Clear' | 'Partly Cloudy' | 'Storm' | 'Fog' | 'Heavy Rain' | 'Sandstorm';

interface Unit {
  id: string;
  type: 'FRIENDLY' | 'ENEMY' | 'OBJECTIVE';
  x: number;
  y: number;
  label: string;
  assetClass?: string;
  allianceRole?: string;
}

interface ActiveScenario {
  title: string;
  briefing: string;
  terrainType: TerrainType;
  weather?: WeatherType;
  units: Unit[];
  mapPeaks?: { cx: number; cy: number; h: number; r2: number }[];
}

const WIDGET_SOURCE_STYLE: Record<MessageSource, { label: string; color: string; dot: string }> = {
  COMMAND_INPUT: { label: 'COMMANDER', color: '#E6EDF3', dot: '#9CA3AF' },
  AI_STRATEGIST: { label: 'AI STRATEGIST', color: '#3A8DFF', dot: '#1F6FEB' },
  SIMULATION_ENGINE: { label: 'SIMULATION ENGINE', color: '#A78BFA', dot: '#7C3AED' },
  INTEL_DIVISION: { label: 'INTEL DIVISION', color: '#38BDF8', dot: '#0EA5E9' },
  FOG_OF_WAR_MODULE: { label: 'FOG OF WAR MODULE', color: '#94A3B8', dot: '#475569' },
  SYSTEM: { label: 'SYSTEM', color: '#22C55E', dot: '#16A34A' },
};

// ─── Weather display helpers ───────────────────────────────────────────────────

function weatherTemp(w?: WeatherType): string {
  switch (w) {
    case 'Clear': return '24°C';
    case 'Partly Cloudy': return '18°C';
    case 'Storm': return '8°C';
    case 'Fog': return '15°C';
    case 'Heavy Rain': return '12°C';
    case 'Sandstorm': return '34°C';
    default: return '18°C';
  }
}

function weatherVisibility(w?: WeatherType): string {
  switch (w) {
    case 'Storm': return '2.1 KM';
    case 'Fog': return '0.4 KM';
    case 'Heavy Rain': return '3.5 KM';
    case 'Sandstorm': return '1.2 KM';
    default: return '8.5 KM';
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WarMatrixPage() {
  const { toast } = useToast();
  const [turn, setTurn] = useState(1);
  const [status, setStatus] = useState<'ACTIVE' | 'AWAITING COMMAND' | 'PROCESSING'>('ACTIVE');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<ReceiveStrategicAnalysisOutput | null>(null);
  const [role, setRole] = useState<'BLUE_TEAM' | 'RED_TEAM'>('BLUE_TEAM');
  const [centerScenarioMode, setCenterScenarioMode] = useState<'default' | 'random' | 'custom'>('default');
  const [isBuilderWorkspaceActive, setIsBuilderWorkspaceActive] = useState(false);
  const [builderScenarioMode, setBuilderScenarioMode] = useState<'selection' | 'random' | 'custom'>('selection');
  const [isCommsConsoleOpen, setIsCommsConsoleOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [lastResult, setLastResult] = useState<{
    command: string;
    success: number;
    risk: number;
    outcome: string;
  } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_LOG);
  const widgetChatEndRef = React.useRef<HTMLDivElement>(null);

  const handleBriefingGenerated = (title: string, briefing: string) => {
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

  useEffect(() => {
    widgetChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Scenario state ───────────────────────────────────────────────────────────
  const [activeScenario, setActiveScenario] = useState<ActiveScenario | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);

  // ── AI Analysis (only when scenario is active) ────────────────────────────────
  const fetchStrategicAnalysis = async () => {
    if (!activeScenario || units.length === 0) return;
    setLoadingAnalysis(true);
    try {
      const summary = `
        Turn ${turn}. Viewpoint: ${role}. Scenario: ${activeScenario.title}. Terrain: ${activeScenario.terrainType}.
        Units: ${units.map(u => `${u.label} (${u.type}) at [${u.x},${u.y}]`).join(', ')}.
      `;
      const result = await receiveStrategicAnalysis({
        battlefieldSummary: summary,
        missionObjectives: activeScenario.briefing,
      });
      setAnalysis(result);
    } catch (error) {
      console.error('Failed to get AI analysis', error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (activeScenario && units.length > 0) {
      fetchStrategicAnalysis();
    }
  }, [turn, activeScenario]);

  // ── Handle scenario generated from ScenarioBuilder ───────────────────────────
  const handleScenarioGenerated = (
    scenario: GenerateScenarioOutput,
    terrainType: TerrainType,
  ) => {
    const newUnits: Unit[] = scenario.units.map((u, i) => ({
      id: `sc-${Date.now()}-${i}`,
      type: (u.allianceRole === 'NEUTRAL' || u.allianceRole === 'INFRASTRUCTURE')
        ? 'OBJECTIVE'
        : (u.allianceRole as 'FRIENDLY' | 'ENEMY') ?? 'OBJECTIVE',
      x: u.x,
      y: u.y,
      label: u.label,
      assetClass: u.assetClass,
      allianceRole: u.allianceRole,
    }));

    setUnits(newUnits);
    setActiveScenario({
      title: scenario.scenarioTitle,
      briefing: scenario.briefing,
      terrainType,
      units: newUnits,
      mapPeaks: scenario.mapPeaks,
    });
    setTurn(1);
    setAnalysis(null);
    toast({
      title: `Scenario Loaded`,
      description: `${scenario.scenarioTitle} — ${newUnits.length} units deployed on ${terrainType} terrain.`,
    });
  };

  // ── Pending operation config from custom builder ─────────────────────────────
  const [pendingOperationConfig, setPendingOperationConfig] = React.useState<{
    name: string;
    terrain: TerrainType;
    weather: WeatherType;
  } | null>(null);

  const handleOperationConfigured = (name: string, terrain: TerrainType, weather: WeatherType) => {
    setPendingOperationConfig({ name, terrain, weather });
  };

  // ── Handle custom builder closing ─────────────────────────────────────────────
  const handleBuilderWorkspaceClose = () => {
    setIsBuilderWorkspaceActive(false);
    setBuilderScenarioMode('selection');
    const cfg = pendingOperationConfig;
    if (units.length > 0 && !activeScenario) {
      setActiveScenario({
        title: cfg?.name || 'Custom Scenario',
        briefing: 'Manually configured battlefield scenario.',
        terrainType: cfg?.terrain || 'Urban',
        weather: cfg?.weather || 'Clear',
        units,
      });
    } else if (cfg && activeScenario) {
      setActiveScenario(prev => prev ? {
        ...prev,
        title: cfg.name,
        terrainType: cfg.terrain,
        weather: cfg.weather,
      } : prev);
    }
    setPendingOperationConfig(null);
  };

  const handleCenterScenarioClose = () => {
    setCenterScenarioMode('default');
    const cfg = pendingOperationConfig;
    if (units.length > 0 && !activeScenario) {
      setActiveScenario({
        title: cfg?.name || 'Custom Scenario',
        briefing: 'Manually configured battlefield scenario.',
        terrainType: cfg?.terrain || 'Urban',
        weather: cfg?.weather || 'Clear',
        units,
      });
    }
    setPendingOperationConfig(null);
  };

  const handleExecuteCommand = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || status === 'PROCESSING') return;
    if (!activeScenario) {
      toast({
        title: 'No Simulation Active',
        description: 'Deploy a scenario first before issuing commands.',
        variant: 'destructive',
      });
      return;
    }

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
          battlefield_data: activeScenario
            ? `Turn ${turn}. Role: ${role}. Scenario: ${activeScenario.title}. Terrain: ${activeScenario.terrainType}. ${units.map(u => `${u.label} (${u.type}) at [${u.x},${u.y}]`).join(', ')}.`
            : `No scenario active.`,
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

        // Update simulation state as well
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
          outcome: `AI STRATEGIST: Tactical directive acknowledged. Adjusting positioning.`
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

  const visibleUnits = activeScenario ? units.filter(u => {
    if (role === 'BLUE_TEAM') return u.type === 'FRIENDLY' || u.type === 'OBJECTIVE' || (u.type === 'ENEMY' && Math.random() > 0.1);
    if (role === 'RED_TEAM') return u.type === 'ENEMY' || u.type === 'OBJECTIVE' || (u.type === 'FRIENDLY' && Math.random() > 0.1);
    return true;
  }) : [];

  const terrainType = activeScenario?.terrainType ?? 'Highland';

  return (
    <div className="flex flex-col h-screen select-none bg-[#0A0A0A] overflow-hidden">
      <Header
        turn={turn}
        status={status}
        onOpenBuilder={() => {
          setBuilderScenarioMode('selection');
          setIsBuilderWorkspaceActive(true);
        }}
      />

      <main className="flex-1 p-4 flex gap-4 overflow-hidden">
        {/* LEFT ZONE: Intel Widgets */}
        <div className="w-64 flex flex-col gap-4 shrink-0 overflow-y-auto pr-1 custom-scrollbar">
          <TacticalWidget title="Terrain Status" icon={Boxes}>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#E6EDF3] font-medium">
                {activeScenario ? activeScenario.terrainType : '—'}
              </span>
              <div className="flex justify-between items-center text-[9px] text-[#9CA3AF] uppercase font-bold">
                <span>Status</span>
                <span className={activeScenario ? 'text-[#F59E0B]' : 'text-[#4B5563]'}>
                  {activeScenario ? 'OPERATIONAL' : 'STANDBY'}
                </span>
              </div>
            </div>
          </TacticalWidget>

          <TacticalWidget title="Weather Status" icon={CloudRain}>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#E6EDF3] font-medium">
                {activeScenario
                  ? `${activeScenario.weather ?? 'Partly Cloudy'} / ${weatherTemp(activeScenario.weather)}`
                  : '—'}
              </span>
              <div className="flex justify-between items-center text-[9px] text-[#9CA3AF] uppercase font-bold">
                <span>Visibility</span>
                <span className={activeScenario ? 'text-[#22C55E]' : 'text-[#4B5563]'}>
                  {activeScenario ? weatherVisibility(activeScenario.weather) : 'N/A'}
                </span>
              </div>
            </div>
          </TacticalWidget>

          <TacticalWidget title="Comm Status" icon={Radio}>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${activeScenario ? 'bg-[#22C55E] animate-pulse' : 'bg-[#4B5563]'}`} />
                <span className="text-[10px] font-mono text-[#E6EDF3]">
                  {activeScenario ? 'LINK_ESTABLISHED' : 'LINK_IDLE'}
                </span>
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

          <TacticalWidget
            title="AI Strategic Analysis"
            icon={BrainCircuit}
            headerAction={loadingAnalysis && <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />}
          >
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#9CA3AF] uppercase font-bold">Status</span>
                <span className={`text-[10px] font-bold ${!activeScenario ? 'text-[#4B5563]' :
                  loadingAnalysis ? 'text-[#F59E0B]' : 'text-[#22C55E]'
                  }`}>
                  {!activeScenario ? 'OFFLINE' : loadingAnalysis ? 'ANALYZING...' : 'READY'}
                </span>
              </div>
              <div className="bg-[#0D223A]/30 border border-[#1F6FEB]/10 p-2 rounded-sm">
                <span className="text-[9px] text-[#9CA3AF] uppercase font-bold mb-1 block">Risk Signals</span>
                <span className="text-sm font-headline font-bold text-[#EF4444]">
                  {analysis ? 'LOW-MODERATE' : '---'}
                </span>
              </div>
              <p className="text-[10px] text-[#9CA3AF] italic leading-relaxed">
                {!activeScenario
                  ? 'No scenario loaded. Deploy forces to activate strategic analysis.'
                  : analysis
                    ? 'Operational environment assessed. Strategic recommendations cached.'
                    : 'Awaiting battlefield snapshot for updated briefing.'}
              </p>
            </div>
          </TacticalWidget>

          <TacticalWidget title="Operations Feed" icon={ShieldAlert}>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[9px] text-[#9CA3AF] uppercase font-bold">
                <span>Latest Status</span>
                <span className={activeScenario ? 'text-[#22C55E]' : 'text-[#4B5563]'}>
                  {activeScenario ? 'TRANSMITTING' : 'OFFLINE'}
                </span>
              </div>
              <div className="p-2 bg-[#151A20] border-l border-[#1F6FEB] rounded-sm">
                <p className="text-[10px] font-mono text-[#E6EDF3] leading-tight">
                  {lastResult
                    ? `EXEC: ${lastResult.command}`
                    : activeScenario
                      ? `SCENARIO: ${activeScenario.title}`
                      : 'AWAITING_SCENARIO_LOAD'}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <Activity className={`w-3 h-3 ${activeScenario ? 'text-[#1F6FEB] animate-pulse' : 'text-[#374151]'}`} />
                <span className="text-[8px] font-mono text-[#4B5563]">
                  {activeScenario
                    ? 'QUEUE_EMPTY // READY_FOR_STATE_CHANGE'
                    : 'STANDBY // AWAITING_INITIALIZATION'}
                </span>
              </div>
            </div>
          </TacticalWidget>

          {/* Scenario Info when active */}
          {activeScenario && (
            <TacticalWidget title="Active Scenario" icon={MapPin}>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-[#E6EDF3] leading-tight">{activeScenario.title}</span>
                <p className="text-[8px] font-mono text-[#6B7280] leading-snug line-clamp-3">{activeScenario.briefing}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[7px] font-mono text-[#8B5CF6] uppercase">{activeScenario.terrainType}</span>
                  <span className="text-[7px] font-mono text-[#4B5563]">·</span>
                  <span className="text-[7px] font-mono text-[#4B5563]">{units.length} units</span>
                </div>
              </div>
            </TacticalWidget>
          )}
        </div>

        {/* CENTER ZONE */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* MAP ZONE */}
          <div className="flex-1 relative overflow-hidden border border-[#1F6FEB]/20">
            {isBuilderWorkspaceActive ? (
              <ScenarioBuilder
                units={units as any}
                onUpdateUnits={(u) => setUnits(u as Unit[])}
                isOpen={true}
                onClose={handleBuilderWorkspaceClose}
                onScenarioGenerated={handleScenarioGenerated}
                onBriefingGenerated={handleBriefingGenerated}
                onOperationConfigured={handleOperationConfigured}
                initialMode={builderScenarioMode === 'selection' ? null : builderScenarioMode === 'random' ? 'AI' : 'CUSTOM'}
                isInline={true}
              />
            ) : activeScenario ? (
              <TacticalMapDisplay
                units={visibleUnits}
                terrainType={terrainType}
                scenarioTitle={activeScenario.title}
                mapPeaks={activeScenario.mapPeaks}
              />
            ) : centerScenarioMode !== 'default' ? (
              <ScenarioBuilder
                units={units as any}
                onUpdateUnits={(u) => setUnits(u as Unit[])}
                isOpen={true}
                onClose={handleCenterScenarioClose}
                onScenarioGenerated={handleScenarioGenerated}
                onOperationConfigured={handleOperationConfigured}
                initialMode={centerScenarioMode === 'random' ? 'AI' : 'CUSTOM'}
                isInline={true}
              />
            ) : (
              /* ── NO SIMULATION STATE ── */
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                style={{
                  background: 'linear-gradient(160deg, rgba(4,8,16,0.98) 0%, rgba(6,14,28,0.98) 50%, rgba(4,8,18,0.98) 100%)',
                }}
              >
                {/* Subtle grid overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(31,111,235,0.15) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(31,111,235,0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                  }}
                />

                {/* Corner brackets */}
                <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-[#1F6FEB]/30" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-[#1F6FEB]/30" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-[#1F6FEB]/30" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-[#1F6FEB]/30" />

                {/* Status icon */}
                <div className="relative z-10 flex flex-col items-center gap-5">
                  <div
                    className="w-20 h-20 flex items-center justify-center rounded-sm border"
                    style={{
                      background: 'rgba(31,111,235,0.06)',
                      borderColor: 'rgba(31,111,235,0.20)',
                      boxShadow: '0 0 30px rgba(31,111,235,0.08)',
                    }}
                  >
                    <AlertCircle className="w-9 h-9 text-[#1F6FEB]/40" />
                  </div>

                  <div className="text-center">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-[#E6EDF3]/30 mb-2">
                      NO SIMULATION ACTIVE
                    </p>
                    <p className="text-[9px] font-mono text-[#374151] uppercase tracking-wider">
                      Deploy a scenario to initialize the tactical map
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setCenterScenarioMode('random'); }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-sm border text-[9px] font-bold uppercase tracking-widest transition-all"
                      style={{
                        background: 'rgba(139,92,246,0.10)',
                        borderColor: 'rgba(139,92,246,0.35)',
                        color: '#A78BFA',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,92,246,0.20)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(139,92,246,0.20)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,92,246,0.10)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
                      }}
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      Random Scenario
                    </button>
                    <button
                      onClick={() => { setCenterScenarioMode('custom'); }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-sm border text-[9px] font-bold uppercase tracking-widest transition-all"
                      style={{
                        background: 'rgba(31,111,235,0.08)',
                        borderColor: 'rgba(31,111,235,0.25)',
                        color: '#3A8DFF',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(31,111,235,0.16)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(31,111,235,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(31,111,235,0.08)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
                      }}
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Custom Build
                    </button>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#374151]" />
                    <span className="text-[7px] font-mono text-[#374151] uppercase tracking-widest">
                      WARMATRIX ENGINE STANDBY
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT ZONE: Secure Comms */}
        <div className="w-80 flex flex-col shrink-0">
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
            <div className="flex-1 flex flex-col min-h-0">
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto custom-scrollbar py-2 flex flex-col gap-2">
                {chatMessages.map((msg) => {
                  const style = WIDGET_SOURCE_STYLE[msg.source as MessageSource] || WIDGET_SOURCE_STYLE.SYSTEM;
                  const isUser = msg.source === 'COMMAND_INPUT';
                  return (
                    <div key={msg.id} className={`flex flex-col gap-0.5 ${isUser ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 px-0.5">
                        {!isUser && <div className="w-1 h-1 rounded-full" style={{ background: style.dot, boxShadow: `0 0 3px ${style.dot}` }} />}
                        <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: style.color }}>{style.label}</span>
                        <span className="text-[6px] font-mono text-[#4B5563]">{msg.timestamp}</span>
                        {isUser && <div className="w-1 h-1 rounded-full" style={{ background: style.dot }} />}
                      </div>
                      <div
                        className="max-w-[90%] rounded-sm p-1.5 border"
                        style={isUser ? {
                          background: 'rgba(31,111,235,0.08)',
                          borderColor: 'rgba(31,111,235,0.20)',
                        } : {
                          background: 'rgba(10,16,30,0.60)',
                          borderColor: 'rgba(31,111,235,0.10)',
                        }}
                      >
                        {msg.headline && (
                          <p className="text-[7px] font-bold uppercase tracking-wider text-[#E6EDF3] mb-1 leading-tight">
                            {msg.headline}
                          </p>
                        )}
                        <p className="text-[9px] font-mono leading-relaxed text-[#9CA3AF]">
                          {msg.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={widgetChatEndRef} />
              </div>

              {/* Input Bar */}
              <div className="pt-3 border-t border-[#1F6FEB]/10">
                <form onSubmit={handleExecuteCommand} className="flex gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#1F6FEB]/50 bg-transparent">&gt; _</span>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={activeScenario ? 'Enter tactical directive...' : 'System ready. Enter directive...'}
                      className="w-full h-8 bg-[#0D223A]/30 border border-[#1F6FEB]/20 rounded-sm pl-8 pr-2 text-[9px] font-mono text-white placeholder:text-[#374151] focus:outline-none focus:border-[#3A8DFF]/40 transition-all"
                      disabled={status === 'PROCESSING'}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || status === 'PROCESSING'}
                    className="w-8 h-8 bg-[#0D1830] hover:bg-[#1A3B5D] disabled:opacity-30 flex items-center justify-center rounded-sm border border-[#1F6FEB]/25 transition-all text-[#3A8DFF]"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>
            </div>
          </TacticalWidget>
        </div>
      </main>

      <SecureCommsConsole
        messages={chatMessages}
        onMessagesChange={setChatMessages}
        isOpen={isCommsConsoleOpen}
        onClose={() => setIsCommsConsoleOpen(false)}
        battlefieldContext={activeScenario
          ? `Turn ${turn}. Role: ${role}. Scenario: ${activeScenario.title}. Terrain: ${activeScenario.terrainType}. ${units.map(u => `${u.label} (${u.type}) at [${u.x},${u.y}]`).join(', ')}.`
          : `No scenario active. Role: ${role}.`}
      />

      <div className="fixed inset-0 pointer-events-none z-[60] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
}
