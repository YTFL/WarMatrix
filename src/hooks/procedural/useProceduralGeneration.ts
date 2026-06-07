import { useState, useCallback } from 'react';
import { UrbanMapResponse } from '@/lib/procedural/types';
import { generateUrbanMap } from '@/lib/procedural/api';

export function useProceduralGeneration() {
  const [mapData, setMapData] = useState<UrbanMapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (seed: number, size: 'Small' | 'Medium' | 'Large') => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateUrbanMap(seed, size);
      setMapData(data);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mapData,
    loading,
    error,
    generate,
  };
}
