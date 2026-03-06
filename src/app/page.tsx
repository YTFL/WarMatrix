'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { IntelligencePanel } from '@/components/IntelligencePanel';
import { TacticalMap } from '@/components/TacticalMap';
import { StrategicAnalysisPanel } from '@/components/StrategicAnalysisPanel';
import { CommandConsole } from '@/components/CommandConsole';
import { receiveStrategicAnalysis, ReceiveStrategicAnalysisOutput } from '@/ai/flows/receive-strategic-analysis';
import { useToast } from '@/hooks/use-toast';

export default function WarMatrixPage() {
  const { toast } = useToast();
  const [turn, setTurn] = useState(1);
  const [status, setStatus] = useState<'ACTIVE' | 'AWAITING COMMAND' | 'PROCESSING'>('ACTIVE');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<ReceiveStrategicAnalysisOutput | null>(null);
  const [lastResult, setLastResult] = useState<{
    command: string;
    success: number;
    risk: number;
    outcome: string;
  } | null>(null);

  // Initial setup of units
  const [units, setUnits] = useState([
    { id: 'f1', type: 'FRIENDLY' as const, x: 2, y: 3, label: 'Alpha Platoon' },
    { id: 'f2', type: 'FRIENDLY' as const, x: 5, y: 6, label: 'Bravo Support' },
    { id: 'e1', type: 'ENEMY' as const, x: 10, y: 2, label: 'Unknown Hostile 01' },
    { id: 'e2', type: 'ENEMY' as const, x: 11, y: 7, label: 'Fortified Outpost' },
    { id: 'o1', type: 'OBJECTIVE' as const, x: 6, y: 4, label: 'Objective Sierra' },
  ]);

  const fetchStrategicAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const summary = `
        Turn ${turn}. Friendly units: Alpha Platoon at (2,3), Bravo Support at (5,6). 
        Enemy activity: Hostile 01 at (10,2), Outpost at (11,7). 
        Objective Sierra is central at (6,4). Terrain is rugged.
      `;
      const result = await receiveStrategicAnalysis({ battlefieldSummary: summary });
      setAnalysis(result);
    } catch (error) {
      console.error('Failed to get AI analysis', error);
      toast({
        title: "Communication Failure",
        description: "AI Strategist uplink timed out. Retrying link...",
        variant: "destructive",
      });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    fetchStrategicAnalysis();
  }, [turn]);

  const handleExecuteCommand = async (command: string) => {
    setStatus('PROCESSING');
    
    // Simulate battlefield update
    setTimeout(async () => {
      setTurn(prev => prev + 1);
      
      // Update unit positions randomly for visualization
      setUnits(prev => prev.map(u => ({
        ...u,
        x: Math.max(1, Math.min(11, u.x + (Math.random() > 0.5 ? 1 : -1))),
        y: Math.max(1, Math.min(7, u.y + (Math.random() > 0.5 ? 1 : -1)))
      })));

      const success = Math.floor(Math.random() * 40) + 60;
      const risk = Math.floor(Math.random() * 30) + 10;
      
      setLastResult({
        command,
        success,
        risk,
        outcome: `Mission phase complete. Units have repositioned following ${command.replace(/_/g, ' ')} directive. Objectives remain priority.`
      });

      setStatus('ACTIVE');
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen select-none">
      <Header turn={turn} status={status} />
      
      <main className="flex-1 flex overflow-hidden">
        <IntelligencePanel />
        <TacticalMap units={units} />
        <StrategicAnalysisPanel analysis={analysis} loading={loadingAnalysis} />
      </main>

      <CommandConsole 
        onExecute={handleExecuteCommand} 
        executing={status === 'PROCESSING'} 
        lastResult={lastResult}
      />

      {/* Grid Overlay / CRT Effect - subtle */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
}
