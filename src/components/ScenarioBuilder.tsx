import React, { useState } from 'react';
import {
  Settings2,
  Plus,
  Trash2,
  Shield,
  Swords,
  Crosshair,
  Building2,
  Truck,
  Radio,
  Zap,
  Eye,
  Target,
  ChevronRight,
  ChevronLeft,
  MapPin,
  BrainCircuit,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─── Types ────────────────────────────────────────────────────────────────────

type EntryMode = null | 'CUSTOM' | 'AI';
type UnitType = 'FRIENDLY' | 'ENEMY' | 'OBJECTIVE' | 'NEUTRAL' | 'INFRASTRUCTURE';

type AssetClass =
  | 'Infantry'
  | 'Mechanized'
  | 'Armor'
  | 'Artillery'
  | 'Recon'
  | 'Logistics'
  | 'Command Unit'
  | 'Infrastructure'
  | 'Objective';

interface Unit {
  id: string;
  type: 'FRIENDLY' | 'ENEMY' | 'OBJECTIVE';
  x: number;
  y: number;
  label: string;
  assetClass?: AssetClass;
  allianceRole?: string;
}

interface ScenarioBuilderProps {
  units: Unit[];
  onUpdateUnits: (units: Unit[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSET_CLASSES: { label: AssetClass; icon: React.ElementType }[] = [
  { label: 'Infantry', icon: Shield },
  { label: 'Mechanized', icon: Zap },
  { label: 'Armor', icon: Swords },
  { label: 'Artillery', icon: Target },
  { label: 'Recon', icon: Eye },
  { label: 'Logistics', icon: Truck },
  { label: 'Command Unit', icon: Radio },
  { label: 'Infrastructure', icon: Building2 },
  { label: 'Objective', icon: Crosshair },
];

const ALLIANCE_OPTIONS: { value: UnitType; label: string }[] = [
  { value: 'FRIENDLY', label: 'Friendly (Blue Team)' },
  { value: 'ENEMY', label: 'Hostile (Red Team)' },
  { value: 'NEUTRAL', label: 'Neutral' },
  { value: 'INFRASTRUCTURE', label: 'Civilian Infrastructure' },
];

// Map extended UnitType → core grid type
function toGridType(role: UnitType): 'FRIENDLY' | 'ENEMY' | 'OBJECTIVE' {
  if (role === 'ENEMY') return 'ENEMY';
  if (role === 'OBJECTIVE' || role === 'NEUTRAL' || role === 'INFRASTRUCTURE') return 'OBJECTIVE';
  return 'FRIENDLY';
}

const roleStyle: Record<string, { color: string; label: string }> = {
  FRIENDLY: { color: '#22C55E', label: 'Friendly' },
  ENEMY: { color: '#EF4444', label: 'Hostile' },
  NEUTRAL: { color: '#9CA3AF', label: 'Neutral' },
  INFRASTRUCTURE: { color: '#60A5FA', label: 'Infrastructure' },
  OBJECTIVE: { color: '#F59E0B', label: 'Objective' },
};

function UnitIcon({ type }: { type: 'FRIENDLY' | 'ENEMY' | 'OBJECTIVE' }) {
  if (type === 'FRIENDLY') return <Shield className="w-3.5 h-3.5 text-[#22C55E]" />;
  if (type === 'ENEMY') return <Swords className="w-3.5 h-3.5 text-[#EF4444]" />;
  return <Crosshair className="w-3.5 h-3.5 text-[#F59E0B]" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScenarioBuilder({ units, onUpdateUnits, isOpen, onClose }: ScenarioBuilderProps) {

  // ── Entry mode gate ──────────────────────────────────────────────────────────
  const [entryMode, setEntryMode] = useState<EntryMode>(null);

  // ── Manual deployment state ──────────────────────────────────────────────────
  const [newLabel, setNewLabel] = useState('');
  const [assetClass, setAssetClass] = useState<AssetClass>('Infantry');
  const [allianceRole, setAllianceRole] = useState<UnitType>('FRIENDLY');
  const [gridX, setGridX] = useState('');
  const [gridY, setGridY] = useState('');

  // ── Deploy ───────────────────────────────────────────────────────────────────
  const handleDeploy = () => {
    if (!newLabel.trim()) return;
    const x = Math.max(1, Math.min(11, parseInt(gridX) || Math.floor(Math.random() * 11) + 1));
    const y = Math.max(1, Math.min(7, parseInt(gridY) || Math.floor(Math.random() * 7) + 1));
    onUpdateUnits([...units, {
      id: Math.random().toString(36).substr(2, 9),
      type: toGridType(allianceRole),
      x, y,
      label: newLabel.trim(),
      assetClass,
      allianceRole,
    }]);
    setNewLabel('');
    setGridX('');
    setGridY('');
  };

  // ── Remove ───────────────────────────────────────────────────────────────────
  const handleRemove = (id: string) => onUpdateUnits(units.filter(u => u.id !== id));

  // ── Mission summary ───────────────────────────────────────────────────────────
  const friendlyCount = units.filter(u => u.type === 'FRIENDLY').length;
  const hostileCount = units.filter(u => u.type === 'ENEMY').length;
  const objectiveCount = units.filter(u => (u.allianceRole || u.type) === 'OBJECTIVE').length;
  const infrastructureCount = units.filter(u => u.allianceRole === 'INFRASTRUCTURE').length;

  if (!isOpen) return null;

  // ── Mode selection entry cards ────────────────────────────────────────────────
  const ENTRY_OPTIONS: {
    mode: 'CUSTOM' | 'AI';
    icon: React.ElementType;
    title: string;
    description: string;
    available: boolean;
    badge?: string;
  }[] = [
      {
        mode: 'CUSTOM',
        icon: Wrench,
        title: 'Custom Scenario Builder',
        description: 'Manually configure battlefield units, objectives, and deployment positions.',
        available: true,
      },
      {
        mode: 'AI',
        icon: BrainCircuit,
        title: 'Random Scenario Generator',
        description: 'Automatically generate a battlefield scenario using AI.',
        available: false,
        badge: 'COMING ONLINE',
      },
    ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-[#0F1115] border border-[#1F6FEB]/30 rounded-sm shadow-2xl flex flex-col max-h-[88vh]">

        {/* ── HEADER ── */}
        <div className="p-4 border-b border-[#1F6FEB]/20 flex items-center justify-between bg-[#151A20] shrink-0">
          <div className="flex items-center gap-3">
            <Settings2 className="w-4 h-4 text-[#1F6FEB]" />
            <div>
              <h2 className="font-headline font-bold text-sm uppercase tracking-widest text-[#E6EDF3]">
                Modular Scenario Builder
              </h2>
              <span className="text-[7px] font-mono text-[#1F6FEB]/50 uppercase tracking-[0.2em]">
                Ground Operations Deployment Console
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Back to mode selection only visible when a mode is chosen */}
            {entryMode !== null && (
              <button
                onClick={() => setEntryMode(null)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm border border-[#1F6FEB]/20 text-[8px] font-bold uppercase tracking-wider text-[#4B5563] hover:text-[#9CA3AF] hover:border-[#1F6FEB]/40 transition-all"
              >
                <ChevronLeft className="w-2.5 h-2.5" />
                Change Mode
              </button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="text-[#9CA3AF] hover:text-white">✕</Button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* ════════════════════════════════════════
              MODE: NULL — SCENARIO TYPE SELECTION
              ════════════════════════════════════════ */}
          {entryMode === null && (
            <div className="flex-1 flex flex-col justify-center p-8 gap-6">
              {/* Section label */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#1F6FEB]/15" />
                <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#9CA3AF]/70 shrink-0">
                  Scenario Type
                </span>
                <div className="h-px flex-1 bg-[#1F6FEB]/15" />
              </div>

              {/* Selection cards */}
              <div className="grid grid-cols-2 gap-5">
                {ENTRY_OPTIONS.map(({ mode, icon: Icon, title, description, available, badge }) => (
                  <button
                    key={mode}
                    onClick={() => available && setEntryMode(mode)}
                    disabled={!available}
                    className="relative flex flex-col items-start text-left p-5 rounded-sm border transition-all group"
                    style={{
                      background: 'rgba(10,15,30,0.70)',
                      borderColor: 'rgba(31,111,235,0.18)',
                      cursor: available ? 'pointer' : 'default',
                    }}
                    onMouseEnter={(e) => {
                      if (!available) return;
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(31,111,235,0.60)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 16px rgba(31,111,235,0.12), inset 0 0 20px rgba(31,111,235,0.04)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15,25,50,0.80)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(31,111,235,0.18)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(10,15,30,0.70)';
                    }}
                  >
                    {/* Badge */}
                    {badge && (
                      <div className="absolute top-3 right-3">
                        <span className="text-[6px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm border border-[#1F6FEB]/20 text-[#1F6FEB]/40">
                          {badge}
                        </span>
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className="w-10 h-10 flex items-center justify-center rounded-sm border mb-4 transition-all"
                      style={{
                        background: available ? 'rgba(31,111,235,0.10)' : 'rgba(31,111,235,0.04)',
                        borderColor: available ? 'rgba(31,111,235,0.25)' : 'rgba(31,111,235,0.10)',
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: available ? '#1F6FEB' : '#374151' }}
                      />
                    </div>

                    {/* Title */}
                    <h3
                      className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 transition-colors"
                      style={{ color: available ? '#E6EDF3' : '#374151' }}
                    >
                      {title}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-[9px] font-mono leading-relaxed"
                      style={{ color: available ? '#4B5563' : '#2D3748' }}
                    >
                      {description}
                    </p>

                    {/* Active arrow indicator */}
                    {available && (
                      <div className="mt-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-mono text-[#1F6FEB]/70 uppercase tracking-wider">Select</span>
                        <ChevronRight className="w-2.5 h-2.5 text-[#1F6FEB]/70" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Footer note */}
              <p className="text-center text-[7px] font-mono text-[#374151] uppercase tracking-wider">
                Select a scenario type to begin configuration
              </p>
            </div>
          )}

          {/* ════════════════════════════════════════
              MODE: CUSTOM — FULL MANUAL BUILDER
              ════════════════════════════════════════ */}
          {entryMode === 'CUSTOM' && (
            <>
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* ──────── LEFT: DEPLOYMENT CONTROLS ──────── */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-[9px] font-bold text-[#1F6FEB] uppercase tracking-[0.25em]">
                      Deployment Controls
                    </h3>

                    {/* SECTION 1 — ASSET CLASS */}
                    <div className="space-y-2">
                      <label className="text-[9px] text-[#9CA3AF] uppercase font-bold tracking-wider">
                        Asset Class
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {ASSET_CLASSES.map(({ label, icon: Icon }) => {
                          const active = assetClass === label;
                          return (
                            <button
                              key={label}
                              onClick={() => setAssetClass(label)}
                              className="flex items-center gap-1 px-2 py-1 rounded-sm text-[8px] font-bold uppercase tracking-wider border transition-all"
                              style={
                                active
                                  ? {
                                    background: 'rgba(31,111,235,0.20)',
                                    borderColor: 'rgba(31,111,235,0.70)',
                                    color: '#60A5FA',
                                    boxShadow: '0 0 8px rgba(31,111,235,0.25)',
                                  }
                                  : {
                                    background: 'rgba(10,15,30,0.60)',
                                    borderColor: 'rgba(31,111,235,0.15)',
                                    color: '#4B5563',
                                  }
                              }
                            >
                              <Icon className="w-2.5 h-2.5" />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SECTION 2 — ENTITY LABEL */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-[#9CA3AF] uppercase font-bold tracking-wider">
                        Entity Label
                      </label>
                      <Input
                        placeholder="e.g., Alpha Armor Division"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleDeploy()}
                        className="h-9 bg-[#0A0F1C] border-[#1F6FEB]/20 text-[11px] font-mono"
                      />
                    </div>

                    {/* SECTION 3 — ALLIANCE ROLE */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-[#9CA3AF] uppercase font-bold tracking-wider">
                        Alliance Role
                      </label>
                      <Select value={allianceRole} onValueChange={(v: any) => setAllianceRole(v)}>
                        <SelectTrigger className="h-9 bg-[#0A0F1C] border-[#1F6FEB]/20 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0F1115] border-[#1F6FEB]/30 text-white">
                          {ALLIANCE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* SECTION 4 — DEPLOYMENT LOCATION */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-[#9CA3AF] uppercase font-bold tracking-wider">
                        Deployment Location
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <span className="text-[7px] font-mono text-[#4B5563] uppercase">Grid X (1–11)</span>
                          <Input
                            type="number"
                            min={1} max={11}
                            placeholder="X"
                            value={gridX}
                            onChange={(e) => setGridX(e.target.value)}
                            className="h-9 bg-[#0A0F1C] border-[#1F6FEB]/20 text-[11px] font-mono"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <span className="text-[7px] font-mono text-[#4B5563] uppercase">Grid Y (1–7)</span>
                          <Input
                            type="number"
                            min={1} max={7}
                            placeholder="Y"
                            value={gridY}
                            onChange={(e) => setGridY(e.target.value)}
                            className="h-9 bg-[#0A0F1C] border-[#1F6FEB]/20 text-[11px] font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="w-2.5 h-2.5 text-[#1F6FEB]/40" />
                        <span className="text-[8px] font-mono text-[#374151]">
                          Leave blank to auto-place on tactical grid
                        </span>
                      </div>
                    </div>

                    {/* SECTION 5 — DEPLOY UNIT */}
                    <Button
                      onClick={handleDeploy}
                      disabled={!newLabel.trim()}
                      className="w-full h-10 bg-[#1A3B5D] hover:bg-[#1F6FEB] disabled:opacity-30 text-[10px] font-bold uppercase tracking-widest border border-[#1F6FEB]/30 hover:border-[#3A8DFF] transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 mr-2" />
                      Deploy Unit
                    </Button>
                  </div>

                  {/* ──────── RIGHT: ACTIVE DEPLOYMENTS ──────── */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-[0.25em]">
                        Active Deployments
                      </h3>
                      <span className="text-[8px] font-mono text-[#4B5563]">
                        {units.length} UNIT{units.length !== 1 ? 'S' : ''} DEPLOYED
                      </span>
                    </div>

                    <ScrollArea className="flex-1 bg-[#0A0A0A]/50 border border-[#1F6FEB]/10 rounded-sm p-2 min-h-[220px] max-h-[280px]">
                      <div className="space-y-1.5">
                        {units.map((unit) => {
                          const rs = roleStyle[unit.allianceRole || unit.type] || roleStyle['FRIENDLY'];
                          const AssetIcon = ASSET_CLASSES.find(a => a.label === unit.assetClass)?.icon;
                          return (
                            <div
                              key={unit.id}
                              className="flex items-start justify-between p-2.5 bg-[#151A20] border border-[#1F6FEB]/10 rounded-sm group hover:border-[#1F6FEB]/25 transition-colors"
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="mt-0.5 shrink-0">
                                  <UnitIcon type={unit.type} />
                                </div>
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="text-[10px] font-mono text-[#E6EDF3] leading-tight truncate">
                                    {unit.label}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                    {unit.assetClass && (
                                      <span className="flex items-center gap-1 text-[7px] font-bold uppercase text-[#3A8DFF]/80">
                                        {AssetIcon && <AssetIcon className="w-2 h-2" />}
                                        {unit.assetClass}
                                      </span>
                                    )}
                                    <span
                                      className="text-[7px] font-bold uppercase tracking-tight"
                                      style={{ color: rs.color }}
                                    >
                                      {rs.label}
                                    </span>
                                    <span className="text-[7px] font-mono text-[#4B5563]">
                                      [{unit.x},{unit.y}]
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemove(unit.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-[#EF4444]/60 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-sm transition-all shrink-0 ml-2"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                        {units.length === 0 && (
                          <div className="text-center py-10 text-[9px] text-[#374151] uppercase font-bold italic">
                            No units deployed
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                {/* ──────── MISSION CONFIGURATION SUMMARY ──────── */}
                <div className="rounded-sm p-3 border border-[#1F6FEB]/15 bg-[#0A1020]/60">
                  <div className="flex items-center gap-2 mb-2.5">
                    <ChevronRight className="w-3 h-3 text-[#1F6FEB]/60" />
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#1F6FEB]/70">
                      Mission Configuration
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: 'Friendly Units', value: friendlyCount, color: '#22C55E' },
                      { label: 'Hostile Units', value: hostileCount, color: '#EF4444' },
                      { label: 'Objectives', value: objectiveCount, color: '#F59E0B' },
                      { label: 'Infrastructure', value: infrastructureCount, color: '#60A5FA' },
                      { label: 'Total Deployed', value: units.length, color: '#9CA3AF' },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center p-2 rounded-sm bg-[#0A0F1C]/60 border border-[#1F6FEB]/08"
                      >
                        <span className="text-base font-headline font-bold leading-none" style={{ color }}>
                          {value}
                        </span>
                        <span className="text-[7px] font-mono text-[#4B5563] uppercase mt-1 text-center leading-tight">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[#1F6FEB]/08 flex items-center gap-2">
                    <span className="text-[7px] font-mono text-[#4B5563] uppercase">Terrain:</span>
                    <span className="text-[7px] font-bold font-mono text-[#E6EDF3]/60 uppercase">
                      Highland / Rugged — Sector Alpha-9
                    </span>
                  </div>
                </div>
              </div>

              {/* ── FOOTER ── */}
              <div className="px-5 py-4 border-t border-[#1F6FEB]/20 bg-[#151A20] flex items-center justify-between shrink-0">
                <span className="text-[8px] font-mono text-[#374151] uppercase">
                  {units.length > 0
                    ? `${units.length} unit${units.length !== 1 ? 's' : ''} ready for deployment`
                    : 'Add units to configure scenario'}
                </span>
                <Button
                  onClick={onClose}
                  className="bg-[#1F6FEB] hover:bg-[#3A8DFF] text-[10px] font-bold uppercase tracking-widest px-8 h-9 transition-all"
                >
                  Finalize Scenario
                </Button>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════
              MODE: AI — PLACEHOLDER
              ════════════════════════════════════════ */}
          {entryMode === 'AI' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
              <div
                className="flex flex-col items-center gap-4 p-8 rounded-sm border max-w-sm w-full"
                style={{
                  background: 'rgba(10,15,30,0.60)',
                  borderColor: 'rgba(31,111,235,0.15)',
                }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center rounded-sm border"
                  style={{ background: 'rgba(31,111,235,0.08)', borderColor: 'rgba(31,111,235,0.20)' }}
                >
                  <BrainCircuit className="w-6 h-6 text-[#1F6FEB]/50" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-mono text-[#4B5563] uppercase tracking-wider leading-relaxed">
                    AI Scenario Generation module coming online...
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    <div className="w-1 h-1 rounded-full bg-[#1F6FEB]/40 animate-pulse" />
                    <div className="w-1 h-1 rounded-full bg-[#1F6FEB]/40 animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 rounded-full bg-[#1F6FEB]/40 animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
              <span className="text-[7px] font-mono text-[#2D3748] uppercase tracking-widest">
                Module deployment in progress
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
