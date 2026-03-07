export interface TerrainPeak {
  cx: number;
  cy: number;
  h: number;
  r2: number;
}

// 2D tactical contour breakpoints used in TacticalMapDisplay.
export const TACTICAL_CONTOUR_LEVELS = [0.2, 0.35, 0.52, 0.68, 0.82, 0.92] as const;

// 2D map annotation mapping: m = round(h * 3100 + 180)
export const TACTICAL_MIN_ELEVATION_M = 180;
export const TACTICAL_ELEVATION_SPAN_M = 3100;

export function normalizedHeightToMeters(h: number): number {
  return h * TACTICAL_ELEVATION_SPAN_M + TACTICAL_MIN_ELEVATION_M;
}

function seededRng(seed: number) {
  let s = Math.abs(seed) | 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

// Shared procedural heightmap used by both 2D contour rendering and 3D terrain.
export function buildProceduralHeightmap(
  terrain: string,
  cols: number,
  rows: number,
  seedString: string,
  mapPeaks?: TerrainPeak[],
): Float32Array {
  const N = (cols + 1) * (rows + 1);
  const map = new Float32Array(N);
  const idx = (r: number, c: number) => r * (cols + 1) + c;
  const combinedSeed = terrain + seedString;
  const rng = seededRng(
    combinedSeed.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 17),
  );

  const peaks: TerrainPeak[] = [];

  if (mapPeaks && mapPeaks.length > 0) {
    mapPeaks.forEach((p) => {
      peaks.push({ ...p, h: p.h * 1.5, r2: p.r2 * 1.5 });
    });

    for (let i = 0; i < 12; i++) {
      peaks.push({
        cx: rng() * cols,
        cy: rng() * rows,
        h: rng() * 0.35 + 0.1,
        r2: (rng() * cols * 0.15 + cols * 0.05) ** 2,
      });
    }
  } else {
    const numPeaks = terrain === 'Plains' ? 12 : terrain === 'Urban' ? 32 : 24;
    for (let i = 0; i < numPeaks; i++) {
      peaks.push({
        cx: rng() * cols,
        cy: rng() * rows,
        h: rng() * 0.45 + 0.25,
        r2: (rng() * cols * 0.25 + cols * 0.05) ** 2,
      });
    }
  }

  let maxH = 0;
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      let h = 0;
      for (const p of peaks) {
        const dx = c - p.cx;
        const dy = r - p.cy;
        h += p.h * Math.exp(-(dx * dx + dy * dy) / p.r2);
      }
      map[idx(r, c)] = h;
      if (h > maxH) maxH = h;
    }
  }

  const scale = maxH > 0 ? 1 / maxH : 1;
  for (let i = 0; i < N; i++) {
    let h = map[i] * scale;
    h += (rng() - 0.5) * 0.06;
    map[i] = Math.max(0, Math.min(1, h));
  }

  return map;
}
