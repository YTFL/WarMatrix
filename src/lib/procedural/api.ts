import { UrbanMapResponse } from './types';

export async function generateUrbanMap(seed: number, size: 'Small' | 'Medium' | 'Large'): Promise<UrbanMapResponse> {
  const response = await fetch('/api/procedural/urban/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ seed, size }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'Failed to generate procedural urban environment');
  }

  return response.json();
}

export async function getUrbanMapBySeed(seed: number, size: 'Small' | 'Medium' | 'Large'): Promise<UrbanMapResponse> {
  const response = await fetch(`/api/procedural/urban/${seed}?size=${size}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'Failed to fetch map by seed');
  }

  return response.json();
}
