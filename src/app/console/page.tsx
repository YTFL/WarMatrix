'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { TacticalMap } from '@/components/TacticalMap';
import { ScenarioBuilder } from '@/components/ScenarioBuilder';
import { TerrainIntelligencePanel } from '@/components/TerrainIntelligencePanel';
import { ChatMessage, INITIAL_LOG, SecureCommsConsole, nowTs } from '@/components/SecureCommsConsole';
import { generateScenario, GenerateScenarioOutput } from '@/ai/flows/generate-scenario';
import { useToast } from '@/hooks/use-toast';
import { TacticalWidget } from '@/components/TacticalWidget';
import {
  Activity,
  BrainCircuit,
  Boxes,
  CloudRain,
  Cpu,
  Maximize2,
  MessageSquare,
  Radio,
  Send,
  ShieldAlert,
  Terminal,
  Zap,
} from 'lucide-react';

interface Unit {
  id: string;
  type: 'FRIENDLY' | 'ENEMY' | 'OBJECTIVE';
  x: number;
  y: number;
  label: string;
}

interface BattlefieldUnit {
  id: string;
  faction: 'FRIENDLY' | 'ENEMY';
  x: number;
  y: number;
  label: string;
  hp: number;
  max_hp: number;
  alive: boolean;
}

interface BattlefieldObjective {
  id: string;
  x: number;
  y: number;
  label: string;
  controller: 'FRIENDLY' | 'ENEMY' | 'NEUTRAL';
  progress_friendly: number;
  progress_enemy: number;
}

interface BattlefieldState {
  turn: number;
  width: number;
  height: number;
  terrain_grid: Array<{ x: number; y: number; terrain: 'plains' | 'forest' | 'urban' | 'hill' | 'water'; elevation: number }>;
  weather: string;
  units: BattlefieldUnit[];
  objectives: BattlefieldObjective[];
  ended: boolean;
  winner?: string;
  end_reason?: string;
}

interface SimulationResponse {
  updated_battlefield_state: BattlefieldState;
  unit_movements: Array<{ unit_id: string; from: { x: number; y: number }; to: { x: number; y: number } }>;
  combat_results: Array<{ attacker_id: string; defender_id: string; outcome: string; damage: number }>;
  objective_status: Array<{ objective_id: string; controller: string }>;
  enemy_actions: Array<{ unit_id: string; action: string }>;
  casualties: Array<{ unit_id: string; faction: string }>;
  simulation_results: {
    expected_success?: number;
    expected_risk_operational?: number;
    recommended_next_action?: string;
  };
  normalized_command: { action_type: string };
  validation?: {
    is_valid: boolean;
    reasons: string[];
  };
  ai_narrative_output: string;
  terminated: boolean;
  termination_reason?: string;
}

function normalizeToSimGrid(unit: Unit): Unit {
  const scaleX = (x: number) => {
    if (x <= 12) return Math.max(1, Math.min(12, x));
    return Math.max(1, Math.min(12, Math.round((x / 44) * 12)));
  };
  const scaleY = (y: number) => {
    if (y <= 8) return Math.max(1, Math.min(8, y));
    return Math.max(1, Math.min(8, Math.round((y / 28) * 8)));
  };

  return {
    ...unit,
    x: scaleX(Number.isFinite(unit.x) ? unit.x : 1),
    y: scaleY(Number.isFinite(unit.y) ? unit.y : 1),
  };
}

function buildDefaultStateFromUnits(units: Unit[]): BattlefieldState {
  const terrain_grid = Array.from({ length: 8 }).flatMap((_, yIndex) =>
    Array.from({ length: 12 }).map((__, xIndex) => {
      const x = xIndex + 1;
      const y = yIndex + 1;
      let terrain: 'plains' | 'forest' | 'urban' | 'hill' | 'water' = 'plains';
      if ((x + y) % 11 === 0) terrain = 'water';
      else if ((x * 2 + y) % 7 === 0) terrain = 'forest';
      else if ((x + y * 2) % 9 === 0) terrain = 'urban';
      else if ((x + y) % 5 === 0) terrain = 'hill';
      return { x, y, terrain, elevation: ((x * 3 + y * 5) % 7) + (terrain === 'hill' ? 1 : 0) };
    })
  );

  const simUnits = units
    .filter((u) => u.type !== 'OBJECTIVE')
    .map((u) => ({
      id: u.id,
      faction: u.type,
      x: u.x,
      y: u.y,
      label: u.label,
      hp: 100,
      max_hp: 100,
      alive: true,
    } as BattlefieldUnit));

  const objectives = units
    .filter((u) => u.type === 'OBJECTIVE')
    .map((u) => ({
      id: u.id,
      x: u.x,
      y: u.y,
      label: u.label,
      controller: 'NEUTRAL',
      progress_friendly: 0,
      progress_enemy: 0,
    } as BattlefieldObjective));

  return {
    turn: 1,
    width: 12,
    height: 8,
    terrain_grid,
    weather: 'clear',
    units: simUnits,
    objectives,
    ended: false,
  };
}

function mapStateToUnits(state: BattlefieldState): Unit[] {
  const unitMarkers: Unit[] = state.units
    .filter((u) => u.alive)
    .map((u) => ({
      id: u.id,
      type: u.faction,
      x: Math.max(1, Math.min(12, u.x)),
      y: Math.max(1, Math.min(8, u.y)),
      label: `${u.label} [${u.hp}]`,
    }));

  const objectiveMarkers: Unit[] = state.objectives.map((o) => ({
    id: o.id,
    type: 'OBJECTIVE',
    x: Math.max(1, Math.min(12, o.x)),
    y: Math.max(1, Math.min(8, o.y)),
    label: `${o.label} (${o.controller})`,
  }));

  return [...unitMarkers, ...objectiveMarkers];
}

export default function WarMatrixPage() {
  const { toast } = useToast();

  const [status, setStatus] = useState<'ACTIVE' | 'AWAITING COMMAND' | 'PROCESSING'>('ACTIVE');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isCommsConsoleOpen, setIsCommsConsoleOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_LOG);

  const [battlefieldState, setBattlefieldState] = useState<BattlefieldState | null>(null);
  const [mapUnits, setMapUnits] = useState<Unit[]>([
    { id: 'f1', type: 'FRIENDLY', x: 2, y: 3, label: 'Alpha Platoon' },
    { id: 'f2', type: 'FRIENDLY', x: 5, y: 6, label: 'Bravo Support' },
    { id: 'e1', type: 'ENEMY', x: 10, y: 2, label: 'Hostile Vanguard' },
    { id: 'e2', type: 'ENEMY', x: 11, y: 7, label: 'Fortified Outpost' },
    { id: 'o1', type: 'OBJECTIVE', x: 6, y: 4, label: 'Objective Sierra' },
    { id: 'o2', type: 'OBJECTIVE', x: 9, y: 5, label: 'Objective Delta' },
  ]);
  const [turn, setTurn] = useState(1);

  const [lastResult, setLastResult] = useState<{
    command: string;
    success: number;
    risk: number;
    outcome: string;
  } | null>(null);

  const [movementEvents, setMovementEvents] = useState<SimulationResponse['unit_movements']>([]);
  const [combatEvents, setCombatEvents] = useState<SimulationResponse['combat_results']>([]);
  const [terrainSummary, setTerrainSummary] = useState<{ dominant: string; avgElevation: number }>({ dominant: 'plains', avgElevation: 0 });

  useEffect(() => {
    setBattlefieldState(buildDefaultStateFromUnits(mapUnits));
  }, []);

  const friendlyUnits = useMemo(
    () => (battlefieldState?.units ?? []).filter((u) => u.alive && u.faction === 'FRIENDLY'),
    [battlefieldState]
  );

  const enemyUnits = useMemo(
    () => (battlefieldState?.units ?? []).filter((u) => u.alive && u.faction === 'ENEMY'),
    [battlefieldState]
  );

  const friendlyCasualties = useMemo(
    () => (battlefieldState?.units ?? []).filter((u) => !u.alive && u.faction === 'FRIENDLY').length,
    [battlefieldState]
  );

  const enemyCasualties = useMemo(
    () => (battlefieldState?.units ?? []).filter((u) => !u.alive && u.faction === 'ENEMY').length,
    [battlefieldState]
  );

  const friendlyObjectives = useMemo(
    () => (battlefieldState?.objectives ?? []).filter((o) => o.controller === 'FRIENDLY').length,
    [battlefieldState]
  );

  const enemyObjectives = useMemo(
    () => (battlefieldState?.objectives ?? []).filter((o) => o.controller === 'ENEMY').length,
    [battlefieldState]
  );

  const objectiveStatus = useMemo(() => battlefieldState?.objectives ?? [], [battlefieldState]);

  useEffect(() => {
    if (!battlefieldState) return;
    const counts: Record<string, number> = {};
    let elevTotal = 0;
    for (const c of battlefieldState.terrain_grid) {
      counts[c.terrain] = (counts[c.terrain] || 0) + 1;
      elevTotal += c.elevation;
    }
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'plains';
    const avgElevation = battlefieldState.terrain_grid.length
      ? elevTotal / battlefieldState.terrain_grid.length
      : 0;
    setTerrainSummary({ dominant, avgElevation });
  }, [battlefieldState]);

  const initializeFromScenario = async (
    scenario: GenerateScenarioOutput,
    terrainType: string,
    weather: string
  ) => {
    setLoadingAnalysis(true);
    try {
      const res = await fetch('/api/sitrep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialize_scenario: true,
          scenario: {
            scenarioTitle: scenario.scenarioTitle,
            briefing: scenario.briefing,
            terrainType,
            weather,
            units: scenario.units,
            mapPeaks: scenario.mapPeaks ?? [],
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.details || data?.error || 'Scenario initialization failed');
      }

      const state = data.updated_battlefield_state as BattlefieldState;
      setBattlefieldState(state);
      setTurn(state.turn);
      setMapUnits(mapStateToUnits(state));
      setMovementEvents([]);
      setCombatEvents([]);
      setLastResult(null);

      const initMsg: ChatMessage = {
        id: `init-${Date.now()}`,
        source: 'SIMULATION_ENGINE',
        headline: 'SCENARIO INITIALIZED',
        body: `Authoritative state initialized from AI-generated scenario "${scenario.scenarioTitle}".`,
        timestamp: nowTs(),
        classification: 'CONFIDENTIAL',
      };
      setChatMessages((prev) => [...prev, initMsg]);
      setStatus('ACTIVE');
    } catch (err: any) {
      toast({
        title: 'Scenario Initialization Failed',
        description: err?.message ?? 'Unable to initialize backend simulation state.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const applySimulationResponse = (commandText: string, data: SimulationResponse) => {
    setBattlefieldState(data.updated_battlefield_state);
    setTurn(data.updated_battlefield_state.turn);
    setMapUnits(mapStateToUnits(data.updated_battlefield_state));

    setMovementEvents(data.unit_movements ?? []);
    setCombatEvents(data.combat_results ?? []);

    setLastResult({
      command: commandText,
      success: Math.round((data.simulation_results?.expected_success ?? 0) * 100),
      risk: Math.round((data.simulation_results?.expected_risk_operational ?? 0) * 100),
      outcome: data.termination_reason ?? `Normalized as ${data.normalized_command?.action_type ?? 'HOLD'}`,
    });

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      source: 'AI_STRATEGIST',
      headline: 'BATTLEFIELD NARRATIVE',
      body: data.ai_narrative_output || 'Narrative unavailable for this turn.',
      timestamp: nowTs(),
      classification: 'CONFIDENTIAL',
    };
    setChatMessages((prev) => [...prev, aiMsg]);

    if (data.terminated) {
      setStatus('AWAITING COMMAND');
      toast({ title: 'Simulation Ended', description: data.termination_reason ?? 'Termination condition reached.' });
    } else {
      setStatus('ACTIVE');
    }
  };

  const sendSimulationRequest = async (command: string, endSimulation: boolean) => {
    setStatus('PROCESSING');

    const userMsg: ChatMessage = {
      id: `cmd-${Date.now()}`,
      source: 'COMMAND_INPUT',
      body: command,
      timestamp: nowTs(),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/sitrep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          end_simulation: endSimulation,
          current_state: battlefieldState ?? buildDefaultStateFromUnits(mapUnits),
          max_new_tokens: 320,
          temperature: 0.35,
          top_p: 0.9,
        }),
      });

      const data = (await res.json()) as SimulationResponse;
      if (!res.ok) {
        throw new Error((data as any).details || (data as any).error || 'Simulation request failed');
      }

      applySimulationResponse(command, data);
    } catch (err: any) {
      const backendValidation = err?.message?.includes('invalid_action') ? 'Action validation failed in simulation backend.' : null;
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        source: 'SYSTEM',
        body: backendValidation
          ? `${backendValidation} ${err?.message ?? ''}`.trim()
          : `SIMULATION LINK FAILURE — ${err?.message ?? 'Unknown error.'}`,
        timestamp: nowTs(),
      };
      setChatMessages((prev) => [...prev, sysMsg]);
      setStatus('ACTIVE');
    }
  };

  const handleExecuteCommand = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || status === 'PROCESSING' || battlefieldState?.ended) return;
    const command = inputValue.trim();
    setInputValue('');
    await sendSimulationRequest(command, false);
  };

  const handleEndSimulation = async () => {
    if (status === 'PROCESSING' || battlefieldState?.ended) return;
    await sendSimulationRequest('End simulation', true);
  };

  const handleScenarioUnitsUpdate = (units: Unit[]) => {
    const normalized = units.map(normalizeToSimGrid);
    setMapUnits(normalized);
    setBattlefieldState(buildDefaultStateFromUnits(normalized));
    setTurn(1);
    setMovementEvents([]);
    setCombatEvents([]);
  };

  return (
    <div className="flex flex-col h-screen select-none bg-[#0A0A0A] overflow-hidden">
      <Header turn={turn} status={status} onOpenBuilder={() => setIsBuilderOpen(true)} />

      <main className="flex-1 p-4 flex gap-4 overflow-hidden">
        <div className="w-64 flex flex-col gap-4 shrink-0 overflow-y-auto pr-1 scrollbar-hide">
          <TacticalWidget title="Terrain Status" icon={Boxes}>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#E6EDF3] font-medium">{terrainSummary.dominant.toUpperCase()} Sector</span>
              <div className="flex justify-between items-center text-[9px] text-[#9CA3AF] uppercase font-bold">
                <span>Difficulty</span>
                <span className="text-[#F59E0B]">Elev {terrainSummary.avgElevation.toFixed(1)}</span>
              </div>
            </div>
          </TacticalWidget>

          <TacticalWidget title="Weather Status" icon={CloudRain}>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#E6EDF3] font-medium">{battlefieldState?.weather ?? 'clear'}</span>
              <div className="flex justify-between items-center text-[9px] text-[#9CA3AF] uppercase font-bold">
                <span>Visibility</span>
                <span className="text-[#22C55E]">MODEL-BASED</span>
              </div>
            </div>
          </TacticalWidget>

          <TacticalWidget title="Battlefield Data" icon={Radio}>
            <div className="flex flex-col gap-2 text-[9px] font-mono text-[#9CA3AF]">
              <div>Turn: <span className="text-[#3A8DFF]">{battlefieldState?.turn ?? turn}</span></div>
              <div>Friendly Alive: <span className="text-[#22C55E]">{friendlyUnits.length}</span></div>
              <div>Enemy Alive: <span className="text-[#EF4444]">{enemyUnits.length}</span></div>
              <div>Friendly KIA: <span className="text-[#F59E0B]">{friendlyCasualties}</span></div>
              <div>Enemy KIA: <span className="text-[#EF4444]">{enemyCasualties}</span></div>
              <div>Obj Control (F/E): <span className="text-[#E6EDF3]">{friendlyObjectives}/{enemyObjectives}</span></div>
              <div className="pt-1 border-t border-[#1F6FEB]/20">Objectives</div>
              {objectiveStatus.map((o) => (
                <div key={o.id} className="flex items-center justify-between">
                  <span>{o.label}</span>
                  <span className={o.controller === 'FRIENDLY' ? 'text-[#22C55E]' : o.controller === 'ENEMY' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}>
                    {o.controller}
                  </span>
                </div>
              ))}
            </div>
          </TacticalWidget>

          <TacticalWidget title="Power Grid" icon={Zap}>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[9px] text-[#9CA3AF] uppercase font-bold">
                <span>Stability</span>
                <span className="text-[#22C55E]">SYNCHRONIZED</span>
              </div>
              <div className="h-1 bg-[#0D223A] rounded-full overflow-hidden">
                <div className="h-full bg-[#22C55E] w-[88%]" />
              </div>
            </div>
          </TacticalWidget>
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 flex gap-4 overflow-hidden">
            <div className="flex-1 relative">
              <TacticalMap units={mapUnits} movements={movementEvents} combatEvents={combatEvents} />
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
                      {loadingAnalysis ? 'INITIALIZING...' : 'BACKEND-DRIVEN'}
                    </span>
                  </div>
                  <div className="bg-[#0D223A]/30 border border-[#1F6FEB]/10 p-2 rounded-sm">
                    <span className="text-[9px] text-[#9CA3AF] uppercase font-bold mb-1 block">Risk Signals</span>
                    <span className="text-sm font-headline font-bold text-[#EF4444]">{lastResult ? `${lastResult.risk}%` : '---'}</span>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] italic leading-relaxed">
                    {lastResult ? 'Narrative and analysis generated after simulation resolution.' : 'Generate a scenario to initialize simulation state.'}
                  </p>
                </div>
              </TacticalWidget>
            </div>
          </div>

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
                    <span className="text-sm font-bold text-[#22C55E]">{lastResult ? `${lastResult.success}%` : '--'}</span>
                  </div>
                </div>
                <div className="text-[9px] font-mono text-[#4B5563] border-t border-[#1F6FEB]/10 pt-2">
                  STATE: {status === 'ACTIVE' ? 'SYNCHRONIZED' : status === 'PROCESSING' ? 'PROCESSING_BUFFER' : 'HALTED'}
                </div>
              </div>
            </TacticalWidget>

            <TacticalWidget
              title="Command Link"
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
                      <p className="text-[10px] font-mono text-[#9CA3AF] whitespace-pre-wrap break-words">{msg.body}</p>
                    </div>
                  ))}
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
                      disabled={status === 'PROCESSING' || battlefieldState?.ended}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || status === 'PROCESSING' || battlefieldState?.ended}
                    className="w-10 h-9 bg-[#1A3B5D] hover:bg-[#3A8DFF] disabled:opacity-30 flex items-center justify-center rounded-sm border border-[#1F6FEB]/30 transition-all"
                  >
                    <Send className="w-3.5 h-3.5 text-[#3A8DFF]" />
                  </button>
                  <button
                    type="button"
                    onClick={handleEndSimulation}
                    disabled={status === 'PROCESSING' || battlefieldState?.ended}
                    className="h-9 px-3 bg-[#3B1A1A] hover:bg-[#7A2323] disabled:opacity-30 rounded-sm border border-[#EF4444]/40 text-[9px] font-bold uppercase tracking-wider text-[#FCA5A5]"
                  >
                    End
                  </button>
                </div>
              </form>
            </TacticalWidget>

            <TacticalWidget title="Operations Feed" icon={ShieldAlert} className="w-80">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[9px] text-[#9CA3AF] uppercase font-bold">
                  <span>Latest Status</span>
                  <span className={battlefieldState?.ended ? 'text-[#EF4444]' : 'text-[#22C55E]'}>
                    {battlefieldState?.ended ? 'TERMINATED' : 'TRANSMITTING'}
                  </span>
                </div>
                <div className="p-2 bg-[#151A20] border-l border-[#1F6FEB] rounded-sm">
                  <p className="text-[10px] font-mono text-[#E6EDF3] leading-tight">
                    {lastResult ? `EXEC: ${lastResult.command}` : 'AWAITING_UPLINK'}
                  </p>
                </div>
                <div className="text-[9px] font-mono text-[#9CA3AF]">Outcome: {lastResult?.outcome ?? '--'}</div>
                <div className="text-[9px] font-mono text-[#9CA3AF]">Risk: {lastResult ? `${lastResult.risk}%` : '--'}</div>
                <div className="flex items-center gap-2 mt-auto">
                  <Activity className="w-3 h-3 text-[#1F6FEB] animate-pulse" />
                  <span className="text-[8px] font-mono text-[#4B5563]">BACKEND_AUTHORITY // TURN_SYNC</span>
                </div>
              </div>
            </TacticalWidget>
          </div>
        </div>
      </main>

      <ScenarioBuilder
        units={mapUnits}
        onUpdateUnits={handleScenarioUnitsUpdate}
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onScenarioGenerated={(scenario, terrainType) => {
          void initializeFromScenario(scenario, terrainType, 'Clear');
        }}
        onOperationConfigured={async (name, terrain, weather) => {
          // Manual mode still performs one initial AI call to generate structured scenario seed.
          setLoadingAnalysis(true);
          try {
            const friendly = mapUnits.filter((u) => u.type === 'FRIENDLY').length;
            const enemy = mapUnits.filter((u) => u.type === 'ENEMY').length;
            const balance =
              friendly === enemy
                ? 'Balanced Forces'
                : friendly > enemy
                  ? 'Friendly Advantage'
                  : 'Hostile Advantage';
            const objectiveType = mapUnits.some((u) => u.type === 'OBJECTIVE')
              ? 'Capture Territory'
              : 'Defend Position';

            const scenario = await generateScenario({
              missionContext: `${name}. Weather ${weather}. Current deployments: ${mapUnits
                .map((u) => `${u.label} ${u.type} [${u.x},${u.y}]`)
                .join(', ')}.`,
              terrainType: (terrain === 'Mountain' || terrain === 'Coastal' || terrain === 'Arctic' ? 'Highland' : terrain) as any,
              forceBalance: balance as any,
              objectiveType: objectiveType as any,
            });

            const briefingMsg: ChatMessage = {
              id: `briefing-manual-${Date.now()}`,
              source: 'AI_STRATEGIST',
              headline: `MISSION BRIEFING: ${scenario.scenarioTitle}`,
              body: scenario.briefing,
              timestamp: nowTs(),
              classification: 'SECRET',
            };
            setChatMessages((prev) => [...prev, briefingMsg]);
            await initializeFromScenario(scenario, terrain, weather);
          } catch (err: any) {
            toast({
              title: 'Scenario Generation Failed',
              description: err?.message ?? 'Unable to generate initial scenario from AI.',
              variant: 'destructive',
            });
          } finally {
            setLoadingAnalysis(false);
          }
        }}
        onBriefingGenerated={(title, briefing) => {
          const briefingMsg: ChatMessage = {
            id: `briefing-${Date.now()}`,
            source: 'AI_STRATEGIST',
            headline: `MISSION BRIEFING: ${title}`,
            body: briefing,
            timestamp: nowTs(),
            classification: 'SECRET',
          };
          setChatMessages((prev) => [...prev, briefingMsg]);
          toast({ title: 'Incoming Transmission', description: 'AI Strategist has uploaded the mission briefing.' });
        }}
      />

      <SecureCommsConsole
        messages={chatMessages}
        onMessagesChange={setChatMessages}
        isOpen={isCommsConsoleOpen}
        onClose={() => setIsCommsConsoleOpen(false)}
        disableDirectAiCalls={true}
        battlefieldContext={`Turn ${turn}. ${(battlefieldState?.units ?? [])
          .map((u) => `${u.label} (${u.faction}) at [${u.x},${u.y}]`) 
          .join(', ')}.`}
      />

      <div className="fixed inset-0 pointer-events-none z-[60] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
}
