'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { IntelligencePanel } from '@/components/IntelligencePanel';
import { TacticalMap } from '@/components/TacticalMap';
import { StrategicAnalysisPanel } from '@/components/StrategicAnalysisPanel';
import { CommandConsole } from '@/components/CommandConsole';
import { ScenarioBuilder } from '@/components/ScenarioBuilder';
import { receiveStrategicAnalysis, ReceiveStrategicAnalysisOutput } from '@/ai/flows/receive-strategic-analysis';
import { useToast } from '@/hooks/use-toast';

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
  const [role, setRole] = useState<'BLUE_TEAM' | 'RED_TEAM'>('BLUE_TEAM');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [lastResult, setLastResult] = useState<{
    command: string;
    success: number;
    risk: number;
    outcome: string;
  } | null>(null);

  // Initial setup of units
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
        Turn ${turn}. Viewpoint: ${role}. 
        Units breakdown: ${units.map(u => `${u.label} (${u.type}) at [${u.x},${u.y}]`).join(', ')}.
        Current environment: Rugged terrain, operational signals detected near enemy outposts.
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
        description: "AI Strategist uplink timed out. Operational fog of war increased.",
        variant: "destructive",
      });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    fetchStrategicAnalysis();
  }, [turn, units, role]);

  const handleExecuteCommand = async (command: string) => {
    setStatus('PROCESSING');
    
    // Probabilistic Engine Logic
    // Success is higher if friendly units are closer to objectives than enemies
    setTimeout(async () => {
      setTurn(prev => prev + 1);
      
      const objective = units.find(u => u.type === 'OBJECTIVE');
      const friendlies = units.filter(u => u.type === 'FRIENDLY');
      const enemies = units.filter(u => u.type === 'ENEMY');

      // Simple proximity rule for deterministic bias
      let successBase = 50;
      if (objective) {
        const minFriendlyDist = Math.min(...friendlies.map(f => Math.abs(f.x - objective.x) + Math.abs(f.y - objective.y)));
        const minEnemyDist = Math.min(...enemies.map(e => Math.abs(e.x - objective.x) + Math.abs(e.y - objective.y)));
        
        if (minFriendlyDist < minEnemyDist) successBase += 20;
        else successBase -= 10;
      }

      const success = Math.min(99, Math.max(1, successBase + Math.floor(Math.random() * 30) - 15));
      const risk = 100 - success + Math.floor(Math.random() * 20) - 10;
      
      // Update unit positions randomly to simulate evolving battlefield
      setUnits(prev => prev.map(u => ({
        ...u,
        x: Math.max(1, Math.min(11, u.x + (Math.random() > 0.7 ? 1 : Math.random() < 0.3 ? -1 : 0))),
        y: Math.max(1, Math.min(7, u.y + (Math.random() > 0.7 ? 1 : Math.random() < 0.3 ? -1 : 0)))
      })));

      setLastResult({
        command,
        success,
        risk: Math.max(5, Math.min(95, risk)),
        outcome: `STAFF REPORT: Command directive "${command}" processed for Turn ${turn + 1}. ${
          success > 70 ? 'Strategic momentum secured.' : success > 40 ? 'Operational gains mixed.' : 'Significant tactical setbacks encountered.'
        } Position shifts recorded globally.`
      });

      setStatus('ACTIVE');
    }, 1500);
  };

  // Filter units based on role (Fog of War simulation)
  const visibleUnits = units.filter(u => {
    if (role === 'BLUE_TEAM') return u.type === 'FRIENDLY' || u.type === 'OBJECTIVE' || (u.type === 'ENEMY' && Math.random() > 0.1);
    if (role === 'RED_TEAM') return u.type === 'ENEMY' || u.type === 'OBJECTIVE' || (u.type === 'FRIENDLY' && Math.random() > 0.1);
    return true;
  });

  return (
    <div className="flex flex-col h-screen select-none bg-[#0A0A0A]">
      <Header 
        turn={turn} 
        status={status} 
        role={role} 
        onRoleSwitch={setRole} 
        onOpenBuilder={() => setIsBuilderOpen(true)}
      />
      
      <main className="flex-1 flex overflow-hidden">
        <IntelligencePanel />
        <TacticalMap units={visibleUnits} />
        <StrategicAnalysisPanel analysis={analysis} loading={loadingAnalysis} />
      </main>

      <CommandConsole 
        onExecute={handleExecuteCommand} 
        executing={status === 'PROCESSING'} 
        lastResult={lastResult}
      />

      <ScenarioBuilder 
        units={units} 
        onUpdateUnits={setUnits} 
        isOpen={isBuilderOpen} 
        onClose={() => setIsBuilderOpen(false)} 
      />

      {/* Grid Overlay / CRT Effect */}
      <div className="fixed inset-0 pointer-events-none z-[60] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
}
