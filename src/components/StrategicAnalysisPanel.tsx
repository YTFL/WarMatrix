import React from 'react';
import { BrainCircuit, AlertTriangle, TrendingUp, Target, Loader2, Info, LayoutGrid, Zap, Database } from 'lucide-react';
import { ReceiveStrategicAnalysisOutput } from '@/ai/flows/receive-strategic-analysis';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StrategicAnalysisPanelProps {
  analysis: ReceiveStrategicAnalysisOutput | null;
  loading: boolean;
}

export function StrategicAnalysisPanel({ analysis, loading }: StrategicAnalysisPanelProps) {
  return (
    <aside className="w-80 bg-[#151A20] border-l border-[#1F6FEB]/20 flex flex-col shrink-0 overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-[#1F6FEB]/10 bg-[#0F1115] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-[#F59E0B]" />
          <h2 className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-[#F59E0B]">Staff Analysis Briefing</h2>
        </div>
        <Info className="w-3.5 h-3.5 text-[#9CA3AF]/40" />
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[#9CA3AF] p-8">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-[#1F6FEB] mb-4" />
            <div className="absolute inset-0 blur-xl bg-[#1F6FEB]/20 animate-pulse" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] animate-pulse text-center">Consulting Strategic HQ...</span>
          <div className="mt-4 flex gap-1">
            <div className="w-1 h-1 bg-[#1F6FEB] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-[#1F6FEB] animate-bounce" style={{ animationDelay: '200ms' }} />
            <div className="w-1 h-1 bg-[#1F6FEB] animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>
        </div>
      ) : analysis ? (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Executive Overview */}
            <section className="space-y-3 bg-[#0A0A0A]/50 border border-[#1F6FEB]/10 p-3 rounded-sm">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-[#1F6FEB]" />
                <h3 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Operational Overview</h3>
              </div>
              <p className="text-[11px] text-[#E6EDF3] leading-relaxed italic border-l border-[#1F6FEB]/30 pl-3">
                "{analysis.strategicOverview}"
              </p>
            </section>

            {/* Explanable Staff Analysis Layer */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] pb-1 border-b border-[#1F6FEB]/10">Evidence-Based Assessment</h3>
              
              <div className="space-y-3">
                <div className="bg-[#1A3B5D]/10 border-l-2 border-[#1F6FEB] p-2 rounded-r-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <LayoutGrid className="w-3 h-3 text-[#1F6FEB]" />
                    <span className="text-[9px] font-bold text-[#1F6FEB] uppercase tracking-wider">Maneuver Analysis</span>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] leading-snug">{analysis.staffAnalysis.maneuver}</p>
                </div>

                <div className="bg-[#1A3B5D]/10 border-l-2 border-[#22C55E] p-2 rounded-r-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3 h-3 text-[#22C55E]" />
                    <span className="text-[9px] font-bold text-[#22C55E] uppercase tracking-wider">Logistics Stability</span>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] leading-snug">{analysis.staffAnalysis.logistics}</p>
                </div>

                <div className="bg-[#1A3B5D]/10 border-l-2 border-[#F59E0B] p-2 rounded-r-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-3 h-3 text-[#F59E0B]" />
                    <span className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-wider">Signals Intelligence</span>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] leading-snug">{analysis.staffAnalysis.intelligence}</p>
                </div>
              </div>
            </section>

            {/* Risk Assessment */}
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
                <h3 className="text-[10px] font-bold text-[#EF4444] uppercase tracking-widest">Risk Factors</h3>
              </div>
              <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 p-3 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-8 h-8 bg-[#EF4444]/10 rounded-bl-full group-hover:scale-110 transition-transform" />
                <p className="text-[11px] text-[#E6EDF3] leading-relaxed">
                  {analysis.riskAssessment}
                </p>
              </div>
            </section>

            {/* Enemy Behavior */}
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#F59E0B]" />
                <h3 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Enemy Forecast</h3>
              </div>
              <p className="text-[11px] text-[#9CA3AF] leading-relaxed bg-[#0A0A0A] p-2 border border-[#1F6FEB]/10 rounded-sm">
                {analysis.predictedEnemyBehavior}
              </p>
            </section>

            {/* Recommended Actions */}
            <section className="space-y-3 pt-4 border-t border-[#1F6FEB]/10">
              <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Staff Recommendations</h3>
              <div className="space-y-2">
                {analysis.recommendedActions.map((action, idx) => (
                  <div key={idx} className="flex gap-3 group bg-[#151A20] hover:bg-[#1A3B5D]/20 p-2 rounded-sm border border-transparent hover:border-[#1F6FEB]/30 transition-all cursor-default">
                    <span className="text-[10px] font-mono text-[#1F6FEB] font-bold">0{idx + 1}</span>
                    <p className="text-[11px] text-[#E6EDF3] leading-snug">
                      {action}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 opacity-40">
          <div className="w-12 h-12 border-2 border-dashed border-[#1F6FEB] rounded-full flex items-center justify-center animate-pulse mb-4">
            <Database className="w-6 h-6 text-[#1F6FEB]" />
          </div>
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#9CA3AF]">
            Awaiting Battlefield State for Strategic Feed
          </p>
        </div>
      )}

      <div className="mt-auto p-4 bg-[#0F1115] border-t border-[#1F6FEB]/20">
        <div className="bg-[#0D223A] p-2 rounded-sm border border-[#1F6FEB]/20 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse shadow-[0_0_5px_#22C55E]" />
          <span className="text-[9px] font-mono text-[#9CA3AF] uppercase tracking-widest">AI Strategist Uplink Secure</span>
        </div>
      </div>
    </aside>
  );
}
