from pydantic import BaseModel
from typing import List, Dict, Any, Tuple

class RoadEdge(BaseModel):
    id: str
    type: str  # "Primary", "Secondary", "Local"
    start: Tuple[int, int]
    end: Tuple[int, int]
    connected_roads: List[str]

class District(BaseModel):
    id: str
    type: str  # "Residential", "Commercial", "Industrial", "Government", "Military"
    bounds: Dict[str, int]  # {"min_x": int, "max_x": int, "min_y": int, "max_y": int}
    density: float

class BuildingZone(BaseModel):
    id: str
    district_id: str
    type: str
    x: int
    y: int
    height: int
    cover_value: float
    visibility_modifier: float
    movement_penalty: int
    asset_key: str  # e.g., "residential/asia_building.glb"
    rotation: float # in degrees or radians

class StrategicInfrastructure(BaseModel):
    id: str
    type: str  # "Military Base", "Communication Center", "Power Station", "Fuel Depot", "Government Complex", "Industrial Facility"
    x: int
    y: int
    strategic_value: float
    asset_key: str
    rotation: float

class CellMetadata(BaseModel):
    x: int
    y: int
    district_type: str
    is_road: bool
    road_type: str | None
    cover_value: float
    movement_cost: int
    visibility_modifier: float
    communication_modifier: float

class UrbanMapResponse(BaseModel):
    seed: int
    size: str
    grid_size: Tuple[int, int]
    city_bounds: Dict[str, int]
    roads: List[RoadEdge]
    districts: List[District]
    buildings: List[BuildingZone]
    infrastructure: List[StrategicInfrastructure]
    metadata: List[CellMetadata]
