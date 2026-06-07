import React, { useState } from 'react';
import { RefreshCw, Play, ShieldAlert } from 'lucide-react';

interface SeedInputProps {
  onGenerate: (seed: number, size: 'Small' | 'Medium' | 'Large') => void;
  loading: boolean;
  activeLayers: {
    roads: boolean;
    districts: boolean;
    buildings: boolean;
    infrastructure: boolean;
    metadata: boolean;
  };
  setActiveLayers: React.Dispatch<React.SetStateAction<{
    roads: boolean;
    districts: boolean;
    buildings: boolean;
    infrastructure: boolean;
    metadata: boolean;
  }>>;
  viewMode: '2d' | '3d';
  setViewMode: (mode: '2d' | '3d') => void;
  metadataField: 'cover' | 'movement' | 'visibility' | 'comms';
  setMetadataField: (field: 'cover' | 'movement' | 'visibility' | 'comms') => void;
}

export function SeedInput({
  onGenerate,
  loading,
  activeLayers,
  setActiveLayers,
  viewMode,
  setViewMode,
  metadataField,
  setMetadataField,
}: SeedInputProps) {
  const [seedInput, setSeedInput] = useState<string>('847293');
  const [sizeInput, setSizeInput] = useState<'Small' | 'Medium' | 'Large'>('Medium');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const seed = parseInt(seedInput, 10);
    if (!isNaN(seed)) {
      onGenerate(seed, sizeInput);
    }
  };

  const handleRandomize = () => {
    const randSeed = Math.floor(Math.random() * 1000000);
    setSeedInput(randSeed.toString());
    onGenerate(randSeed, sizeInput);
  };

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="w-80 bg-[#0A0E17]/95 border-r border-[#1F6FEB]/20 p-5 flex flex-col gap-6 font-mono text-[#E6EDF3] select-none h-full overflow-y-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse" />
          <h1 className="text-sm font-bold tracking-widest uppercase text-[#00e5ff]">
            Procedural Urban Core
          </h1>
        </div>
        <p className="text-[10px] text-[#9CA3AF]">
          Deterministic simulation boundary generation tool.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-[#9CA3AF] uppercase font-bold">
            Simulation Seed
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              className="flex-1 bg-[#02050A] border border-[#1F6FEB]/30 rounded px-3 py-1.5 text-sm font-mono text-[#E6EDF3] focus:outline-none focus:border-[#00e5ff] transition-colors"
            />
            <button
              type="button"
              onClick={handleRandomize}
              className="bg-[#111827] border border-[#1F6FEB]/30 hover:border-[#00e5ff] hover:text-[#00e5ff] px-2.5 py-1.5 rounded transition-all flex items-center justify-center"
              title="Randomize Seed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-[#9CA3AF] uppercase font-bold">
            City Scale
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Small', 'Medium', 'Large'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSizeInput(sz)}
                className={`text-xs py-1.5 rounded border transition-all ${
                  sizeInput === sz
                    ? 'bg-[#1F6FEB]/20 border-[#00e5ff] text-[#00e5ff]'
                    : 'bg-[#02050A] border-[#1F6FEB]/20 text-[#9CA3AF] hover:border-[#1F6FEB]/40'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1F6FEB] hover:bg-[#388BFD] text-black font-bold py-2 rounded text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-black" />
          )}
          Generate Simulation
        </button>
      </form>

      <div className="border-t border-[#1F6FEB]/10 pt-4">
        <label className="text-[10px] text-[#9CA3AF] uppercase font-bold block mb-3">
          Visualization Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setViewMode('2d')}
            className={`text-xs py-1.5 rounded border transition-all ${
              viewMode === '2d'
                ? 'bg-[#1F6FEB]/20 border-[#00e5ff] text-[#00e5ff]'
                : 'bg-[#02050A] border-[#1F6FEB]/20 text-[#9CA3AF] hover:border-[#1F6FEB]/40'
            }`}
          >
            2D Tactical View
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`text-xs py-1.5 rounded border transition-all ${
              viewMode === '3d'
                ? 'bg-[#1F6FEB]/20 border-[#00e5ff] text-[#00e5ff]'
                : 'bg-[#02050A] border-[#1F6FEB]/20 text-[#9CA3AF] hover:border-[#1F6FEB]/40'
            }`}
          >
            3D Hologram
          </button>
        </div>
      </div>

      <div className="border-t border-[#1F6FEB]/10 pt-4 flex flex-col gap-3">
        <label className="text-[10px] text-[#9CA3AF] uppercase font-bold block">
          Simulation Layer Overlays
        </label>

        <div className="flex flex-col gap-2">
          {Object.entries(activeLayers).map(([key, val]) => (
            <label
              key={key}
              className="flex items-center justify-between text-xs cursor-pointer py-1 px-2 hover:bg-[#111827] rounded transition-colors"
            >
              <span className="capitalize">{key}</span>
              <input
                type="checkbox"
                checked={val}
                onChange={() => toggleLayer(key as keyof typeof activeLayers)}
                className="accent-[#00e5ff]"
              />
            </label>
          ))}
        </div>
      </div>

      {activeLayers.metadata && (
        <div className="border-t border-[#1F6FEB]/10 pt-4 flex flex-col gap-2">
          <label className="text-[10px] text-[#9CA3AF] uppercase font-bold block">
            Metadata Parameter
          </label>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {([
              ['cover', 'Cover Val'],
              ['movement', 'Mov Cost'],
              ['visibility', 'Vis Mod'],
              ['comms', 'Comms Mod'],
            ] as const).map(([field, label]) => (
              <button
                key={field}
                onClick={() => setMetadataField(field)}
                className={`py-1 rounded border text-[9px] font-bold transition-all ${
                  metadataField === field
                    ? 'bg-[#1F6FEB]/20 border-[#00e5ff] text-[#00e5ff]'
                    : 'bg-[#02050A] border-[#1F6FEB]/20 text-[#9CA3AF] hover:border-[#1F6FEB]/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto border-t border-[#1F6FEB]/10 pt-4 flex gap-2 items-start text-[10px] text-[#9CA3AF]/60">
        <ShieldAlert className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
        <span>
          Sandbox environment: Operations executed in isolation from wargaming tick queue.
        </span>
      </div>
    </div>
  );
}
