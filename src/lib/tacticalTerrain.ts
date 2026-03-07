export type TerrainCellType =
  | 'plain'
  | 'forest'
  | 'hill'
  | 'mountain'
  | 'river'
  | 'road'
  | 'urban';

export type TacticalTeam = 'ally' | 'enemy' | 'objective' | 'neutral';

export interface TacticalTerrainUnit {
  id: string;
  type: string;
  team: TacticalTeam;
  x: number;
  y: number;
  label?: string;
}

export interface TacticalTerrainMapData {
  map_size: [number, number];
  terrain: TerrainCellType[][];
  units: TacticalTerrainUnit[];
}

export const TERRAIN_HEIGHTS: Record<TerrainCellType, number> = {
  plain: 0,
  forest: 0.3,
  hill: 1,
  mountain: 2,
  river: -0.2,
  road: 0,
  urban: 0.2,
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function getTerrainHeight(terrainType: string): number {
  if (terrainType in TERRAIN_HEIGHTS) {
    return TERRAIN_HEIGHTS[terrainType as TerrainCellType];
  }
  return TERRAIN_HEIGHTS.plain;
}

export function normalizeTerrainHeight(terrainType: string): number {
  // Normalizes the required elevation range [-0.2, 2] to [0, 1] for 2D styling.
  const h = getTerrainHeight(terrainType);
  return clamp((h + 0.2) / 2.2, 0, 1);
}

export function gridToWorldPosition(
  x: number,
  y: number,
  cols: number,
  rows: number,
): { wx: number; wy: number } {
  const wx = x - cols / 2 + 0.5;
  const wy = rows / 2 - y - 0.5;
  return { wx, wy };
}

export function buildTerrainGridFromPeaks(
  width: number,
  height: number,
  terrainType: string,
  mapPeaks?: Array<{ cx: number; cy: number; h: number; r2: number }>,
): TerrainCellType[][] {
  const rows = Math.max(1, height);
  const cols = Math.max(1, width);

  const base: TerrainCellType = terrainType === 'Forest'
    ? 'forest'
    : terrainType === 'Urban'
      ? 'urban'
      : terrainType === 'Mountain'
        ? 'hill'
        : 'plain';

  const grid: TerrainCellType[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => base),
  );

  if (mapPeaks && mapPeaks.length > 0) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let influence = 0;
        for (const peak of mapPeaks) {
          const dx = x + 1 - peak.cx;
          const dy = y + 1 - peak.cy;
          const r2 = Math.max(1, peak.r2);
          influence += peak.h * Math.exp(-(dx * dx + dy * dy) / r2);
        }

        if (influence > 0.9) {
          grid[y][x] = 'mountain';
        } else if (influence > 0.45) {
          grid[y][x] = 'hill';
        }
      }
    }
  }

  if (terrainType === 'Forest') {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if ((x + y) % 7 === 0 && grid[y][x] === 'plain') {
          grid[y][x] = 'forest';
        }
      }
    }
  }

  if (terrainType === 'Urban') {
    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (Math.abs(x - centerX) <= 2 || Math.abs(y - centerY) <= 2) {
          grid[y][x] = 'urban';
        }

        if (x === centerX || y === centerY) {
          grid[y][x] = 'road';
        }
      }
    }
  }

  if (terrainType === 'Coastal' || terrainType === 'Plains') {
    const riverMid = Math.floor(rows * 0.55);
    for (let x = 0; x < cols; x++) {
      const wave = Math.round(Math.sin(x * 0.18) * 2);
      const y = clamp(riverMid + wave, 0, rows - 1);
      grid[y][x] = 'river';
      if (y + 1 < rows && grid[y + 1][x] === 'plain') {
        grid[y + 1][x] = 'forest';
      }
    }
  }

  if (terrainType === 'Desert') {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if ((x * 3 + y) % 19 === 0 && grid[y][x] === 'plain') {
          grid[y][x] = 'hill';
        }
      }
    }
  }

  return grid;
}
