export interface RoadEdge {
  id: string;
  type: 'Primary' | 'Secondary' | 'Local';
  start: [number, number];
  end: [number, number];
  connected_roads: string[];
}

export interface District {
  id: string;
  type: 'Residential' | 'Commercial' | 'Industrial' | 'Government' | 'Military';
  bounds: { min_x: number; max_x: number; min_y: number; max_y: number };
  density: number;
}

export interface BuildingZone {
  id: string;
  district_id: string;
  type: string;
  x: number;
  y: number;
  height: number;
  cover_value: number;
  visibility_modifier: number;
  movement_penalty: number;
  asset_key: string;
  rotation: number;
}

export interface StrategicInfrastructure {
  id: string;
  type: string;
  x: number;
  y: number;
  strategic_value: number;
  asset_key: string;
  rotation: number;
}

export interface CellMetadata {
  x: number;
  y: number;
  district_type: string;
  is_road: boolean;
  road_type: 'Primary' | 'Secondary' | 'Local' | null;
  cover_value: number;
  movement_cost: number;
  visibility_modifier: number;
  communication_modifier: number;
}

export interface UrbanMapResponse {
  seed: number;
  size: 'Small' | 'Medium' | 'Large';
  grid_size: [number, number];
  city_bounds: { min_x: number; max_x: number; min_y: number; max_y: number };
  roads: RoadEdge[];
  districts: District[];
  buildings: BuildingZone[];
  infrastructure: StrategicInfrastructure[];
  metadata: CellMetadata[];
}
