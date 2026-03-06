import React, { useState } from 'react';
import { Settings2, Plus, Trash2, MapPin, Shield, Swords, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Unit {
  id: string;
  type: 'FRIENDLY' | 'ENEMY' | 'OBJECTIVE';
  x: number;
  y: number;
  label: string;
}

interface ScenarioBuilderProps {
  units: Unit[];
  onUpdateUnits: (units: Unit[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ScenarioBuilder({ units, onUpdateUnits, isOpen, onClose }: ScenarioBuilderProps) {
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<'FRIENDLY' | 'ENEMY' | 'OBJECTIVE'>('FRIENDLY');

  const handleAddUnit = () => {
    if (!newLabel) return;
    const newUnit: Unit = {
      id: Math.random().toString(36).substr(2, 9),
      type: newType,
      x: Math.floor(Math.random() * 11) + 1,
      y: Math.floor(Math.random() * 7) + 1,
      label: newLabel,
    };
    onUpdateUnits([...units, newUnit]);
    setNewLabel('');
  };

  const handleRemoveUnit = (id: string) => {
    onUpdateUnits(units.filter(u => u.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0F1115] border border-[#1F6FEB]/30 rounded-sm shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-[#1F6FEB]/20 flex items-center justify-between bg-[#151A20]">
          <div className="flex items-center gap-3">
            <Settings2 className="w-5 h-5 text-[#1F6FEB]" />
            <h2 className="font-headline font-bold text-sm uppercase tracking-widest text-[#E6EDF3]">Modular Scenario Builder</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-[#9CA3AF] hover:text-white">✕</Button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add Unit Form */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-[#1F6FEB] uppercase tracking-[0.2em]">Add Asset / Entity</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9CA3AF] uppercase font-bold">Entity Label</label>
                  <Input 
                    placeholder="e.g., Heavy Armor Div." 
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="h-10 bg-[#0A0F1C] border-[#1F6FEB]/20 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9CA3AF] uppercase font-bold">Alliance Role</label>
                  <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                    <SelectTrigger className="h-10 bg-[#0A0F1C] border-[#1F6FEB]/20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F1115] border-[#1F6FEB]/30 text-white">
                      <SelectItem value="FRIENDLY">Friendly (Blue Team)</SelectItem>
                      <SelectItem value="ENEMY">Hostile (Red Team)</SelectItem>
                      <SelectItem value="OBJECTIVE">Mission Objective</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddUnit} className="w-full bg-[#1A3B5D] hover:bg-[#3A8DFF] text-xs uppercase font-bold tracking-widest h-10 transition-all">
                  <Plus className="w-4 h-4 mr-2" /> Inject Entity
                </Button>
              </div>
            </div>

            {/* Active Assets List */}
            <div className="flex flex-col">
              <h3 className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-[0.2em] mb-4">Active Deployments</h3>
              <ScrollArea className="flex-1 bg-[#0A0A0A]/50 border border-[#1F6FEB]/10 rounded-sm p-3">
                <div className="space-y-2">
                  {units.map((unit) => (
                    <div key={unit.id} className="flex items-center justify-between p-2 bg-[#151A20] border border-[#1F6FEB]/10 rounded-sm group">
                      <div className="flex items-center gap-3">
                        {unit.type === 'FRIENDLY' ? <Shield className="w-3.5 h-3.5 text-[#22C55E]" /> : 
                         unit.type === 'ENEMY' ? <Swords className="w-3.5 h-3.5 text-[#EF4444]" /> : 
                         <Crosshair className="w-3.5 h-3.5 text-[#F59E0B]" />}
                        <div className="flex flex-col">
                          <span className="text-[11px] font-mono text-white leading-tight">{unit.label}</span>
                          <span className="text-[9px] text-[#9CA3AF] uppercase font-bold tracking-tighter">COORD: {unit.x}, {unit.y}</span>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveUnit(unit.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-sm transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {units.length === 0 && (
                    <div className="text-center py-8 text-[10px] text-[#4B5563] uppercase font-bold italic">No active entities</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[#1F6FEB]/20 bg-[#151A20] flex justify-end">
          <Button onClick={onClose} className="bg-[#1F6FEB] hover:bg-[#3A8DFF] text-xs font-bold uppercase tracking-widest px-8">
            Finalize Scenario
          </Button>
        </div>
      </div>
    </div>
  );
}
