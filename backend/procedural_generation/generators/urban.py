import random
from typing import List, Dict, Tuple, Any
from ..models.urban import (
    RoadEdge,
    District,
    BuildingZone,
    StrategicInfrastructure,
    CellMetadata,
    UrbanMapResponse,
)

# ─── 3D Asset Registry Configurations ──────────────────────────────────────────

RESIDENTIAL_ASSETS = [
    "buildings/residential/asia_building.glb",
    "buildings/residential/brutalist_building.glb",
    "buildings/residential/futuristic_building.glb",
    "buildings/residential/building_1.glb",
    "buildings/residential/building_2.glb",
    "buildings/residential/building_3.glb",
    "buildings/residential/building_6.glb",
]

COMMERCIAL_ASSETS = [
    "buildings/commercial/building_-_new_york.glb",
    "buildings/commercial/city_building_2.glb",
    "buildings/commercial/game_ready_building_5.glb",
    "buildings/commercial/old_building_1.glb",
    "buildings/commercial/school_building.glb",
]

INDUSTRIAL_ASSETS = [
    "buildings/industrial/industrial_building.glb",
    "buildings/industrial/warehouse_building.glb",
    "buildings/industrial/warehouse_building_1.glb",
    "buildings/industrial/abandoned_building.glb",
]

OFFICE_ASSETS = [
    "buildings/office/office_building.glb",
    "buildings/office/building_05.glb",
    "buildings/office/whitehall_building.glb",
    "buildings/office/city_building.glb",
]

LANDMARK_ASSETS = [
    "buildings/landmark/tu_ducs_tomb_-_stele_building_cyark_dataset.glb",
    "buildings/landmark/sci-fi_building.glb",
    "buildings/landmark/sci-fi_building_2.glb",
    "buildings/landmark/the_view_building.glb",
]

COMM_TOWER_ASSETS = [
    "communication_tower/signal_tower.glb",
    "communication_tower/40_meter_radiotower.glb",
    "communication_tower/prefabbed_radio_tower_with_blankout_signs.glb",
]

RADAR_ASSETS = [
    "radar_station/aerial_scan_radar_station_camp_hero_montauk_ny.glb",
    "radar_station/devils_slide_bunker_-_pacifica_ca.glb",
]

class UrbanEnvironmentGenerator:
    def __init__(self, seed: int, size: str = "Medium"):
        self.master_seed = seed
        self.size = size
        
        # Grid dimensions based on size
        if size == "Small":
            self.width, self.height = 24, 16
            self.margin = 2
        elif size == "Large":
            self.width, self.height = 48, 32
            self.margin = 4
        else:  # Medium / default
            self.width, self.height = 36, 24
            self.margin = 3

        # Derive isolated seeds for each layer
        self.boundary_rng = random.Random(self._derive_seed(1))
        self.road_rng = random.Random(self._derive_seed(2))
        self.district_rng = random.Random(self._derive_seed(3))
        self.building_rng = random.Random(self._derive_seed(4))
        self.infra_rng = random.Random(self._derive_seed(5))
        self.asset_rng = random.Random(self._derive_seed(6))

        # Setup city bounding box
        self.city_bounds = {
            "min_x": self.margin,
            "max_x": self.width - 1 - self.margin,
            "min_y": self.margin,
            "max_y": self.height - 1 - self.margin,
        }

    def _derive_seed(self, offset: int) -> int:
        # Simple deterministic seed derivation
        return hash((self.master_seed, offset)) & 0xFFFFFFFF

    def generate(self) -> UrbanMapResponse:
        # 1. Generate primary main roads grid
        roads = self._generate_roads()
        
        # 2. Build road lookup for fast cell queries
        road_cells = self._build_road_cells_lookup(roads)

        # 3. Generate districts
        districts = self._generate_districts()

        # 4. Generate buildings & infrastructure
        buildings, infrastructure = self._generate_urban_features(road_cells, districts)

        # 5. Compile cell-by-cell metadata grid
        metadata = self._compile_metadata(road_cells, districts, buildings, infrastructure)

        return UrbanMapResponse(
            seed=self.master_seed,
            size=self.size,
            grid_size=(self.width, self.height),
            city_bounds=self.city_bounds,
            roads=roads,
            districts=districts,
            buildings=buildings,
            infrastructure=infrastructure,
            metadata=metadata,
        )

    def _generate_roads(self) -> List[RoadEdge]:
        roads: List[RoadEdge] = []
        
        # Determine center intersection coordinates
        cx = self.width // 2 + self.road_rng.randint(-2, 2)
        cy = self.height // 2 + self.road_rng.randint(-2, 2)

        # Primary Vertical Highway
        roads.append(RoadEdge(
            id="road-primary-vert",
            type="Primary",
            start=(cx, 0),
            end=(cx, self.height - 1),
            connected_roads=["road-primary-horiz"]
        ))

        # Primary Horizontal Highway
        roads.append(RoadEdge(
            id="road-primary-horiz",
            type="Primary",
            start=(0, cy),
            end=(self.width - 1, cy),
            connected_roads=["road-primary-vert"]
        ))

        # Secondary Ring/Grid Roads
        # We place vertical/horizontal boundaries offset from the center highway
        v_offset = self.road_rng.randint(5, 7)
        h_offset = self.road_rng.randint(4, 6)

        left_x = max(self.city_bounds["min_x"], cx - v_offset)
        right_x = min(self.city_bounds["max_x"], cx + v_offset)
        top_y = max(self.city_bounds["min_y"], cy - h_offset)
        bottom_y = min(self.city_bounds["max_y"], cy + h_offset)

        roads.append(RoadEdge(
            id="road-secondary-left",
            type="Secondary",
            start=(left_x, top_y),
            end=(left_x, bottom_y),
            connected_roads=["road-secondary-top", "road-secondary-bottom", "road-primary-horiz"]
        ))

        roads.append(RoadEdge(
            id="road-secondary-right",
            type="Secondary",
            start=(right_x, top_y),
            end=(right_x, bottom_y),
            connected_roads=["road-secondary-top", "road-secondary-bottom", "road-primary-horiz"]
        ))

        roads.append(RoadEdge(
            id="road-secondary-top",
            type="Secondary",
            start=(left_x, top_y),
            end=(right_x, top_y),
            connected_roads=["road-secondary-left", "road-secondary-right", "road-primary-vert"]
        ))

        roads.append(RoadEdge(
            id="road-secondary-bottom",
            type="Secondary",
            start=(left_x, bottom_y),
            end=(right_x, bottom_y),
            connected_roads=["road-secondary-left", "road-secondary-right", "road-primary-vert"]
        ))

        # Local Streets (branching off secondary structures into neighborhoods)
        # Create a few minor dead-end local streets
        local_count = 3 if self.size == "Small" else (5 if self.size == "Medium" else 8)
        for i in range(local_count):
            road_id = f"road-local-{i+1}"
            
            # Select a random secondary road intersection to branch off
            from_right = self.road_rng.choice([True, False])
            from_top = self.road_rng.choice([True, False])
            
            if from_right:
                # Vertical local road branching off top or bottom secondary road
                start_x = self.road_rng.randint(cx + 1, right_x - 1)
                start_y = top_y if from_top else bottom_y
                length = self.road_rng.randint(3, 5)
                end_y = start_y + length if from_top else start_y - length
                end_y = max(0, min(self.height - 1, end_y))
                roads.append(RoadEdge(
                    id=road_id,
                    type="Local",
                    start=(start_x, start_y),
                    end=(start_x, end_y),
                    connected_roads=["road-secondary-top" if from_top else "road-secondary-bottom"]
                ))
            else:
                # Horizontal local road branching off left or right secondary road
                start_x = left_x if from_top else right_x
                start_y = self.road_rng.randint(cy + 1, bottom_y - 1)
                length = self.road_rng.randint(3, 5)
                end_x = start_x + length if from_top else start_x - length
                end_x = max(0, min(self.width - 1, end_x))
                roads.append(RoadEdge(
                    id=road_id,
                    type="Local",
                    start=(start_x, start_y),
                    end=(end_x, start_y),
                    connected_roads=["road-secondary-left" if from_top else "road-secondary-right"]
                ))

        return roads

    def _build_road_cells_lookup(self, roads: List[RoadEdge]) -> Dict[Tuple[int, int], str]:
        # Walk along road vectors and tag grid cells occupied by roads
        road_cells: Dict[Tuple[int, int], str] = {}
        for r in roads:
            x0, y0 = r.start
            x1, y1 = r.end
            
            # Step in integer grid direction
            dx = 1 if x1 > x0 else (-1 if x1 < x0 else 0)
            dy = 1 if y1 > y0 else (-1 if y1 < y0 else 0)
            
            x, y = x0, y0
            road_cells[(x, y)] = r.type
            while x != x1 or y != y1:
                x += dx
                y += dy
                road_cells[(x, y)] = r.type
        return road_cells

    def _generate_districts(self) -> List[District]:
        districts: List[District] = []
        
        # Find center coords
        cx = self.width // 2
        cy = self.height // 2

        # 1. Commercial Center District (City core)
        districts.append(District(
            id="district-commercial",
            type="Commercial",
            bounds={
                "min_x": cx - 5,
                "max_x": cx + 5,
                "min_y": cy - 4,
                "max_y": cy + 4
            },
            density=0.85
        ))

        # 2. Government / Office District (Surrounding the core)
        districts.append(District(
            id="district-office",
            type="Commercial",  # Map semantic category to general types
            bounds={
                "min_x": cx - 9,
                "max_x": cx + 9,
                "min_y": cy - 7,
                "max_y": cy + 7
            },
            density=0.75
        ))

        # 3. Residential Districts (Outer east/west wings)
        districts.append(District(
            id="district-residential-west",
            type="Residential",
            bounds={
                "min_x": self.city_bounds["min_x"],
                "max_x": cx - 6,
                "min_y": self.city_bounds["min_y"],
                "max_y": self.city_bounds["max_y"]
            },
            density=0.60
        ))

        districts.append(District(
            id="district-residential-east",
            type="Residential",
            bounds={
                "min_x": cx + 6,
                "max_x": self.city_bounds["max_x"],
                "min_y": self.city_bounds["min_y"],
                "max_y": self.city_bounds["max_y"]
            },
            density=0.60
        ))

        # 4. Industrial District (Northern edge / transport links)
        districts.append(District(
            id="district-industrial",
            type="Industrial",
            bounds={
                "min_x": self.city_bounds["min_x"],
                "max_x": self.city_bounds["max_x"],
                "min_y": self.city_bounds["min_y"],
                "max_y": self.city_bounds["min_y"] + 3
            },
            density=0.50
        ))

        # 5. Dedicated Military Base Zone
        # Pick one corner deterministically for the military base
        mil_corners = [
            ("top-left", {
                "min_x": self.city_bounds["min_x"], "max_x": self.city_bounds["min_x"] + 5,
                "min_y": self.city_bounds["min_y"], "max_y": self.city_bounds["min_y"] + 4
            }),
            ("bottom-right", {
                "min_x": self.city_bounds["max_x"] - 5, "max_x": self.city_bounds["max_x"],
                "min_y": self.city_bounds["max_y"] - 4, "max_y": self.city_bounds["max_y"]
            })
        ]
        
        mil_idx = self.district_rng.randint(0, len(mil_corners) - 1)
        _, mil_bounds = mil_corners[mil_idx]

        districts.append(District(
            id="district-military",
            type="Military",
            bounds=mil_bounds,
            density=0.45
        ))

        return districts

    def _get_district_at_cell(self, x: int, y: int, districts: List[District]) -> District | None:
        # Retrieve the highest-priority district covering this cell (Military > Industrial > Commercial > Office > Residential)
        priority_order = ["district-military", "district-industrial", "district-commercial", "district-office", "district-residential-west", "district-residential-east"]
        matched_districts = []
        for d in districts:
            if d.bounds["min_x"] <= x <= d.bounds["max_x"] and d.bounds["min_y"] <= y <= d.bounds["max_y"]:
                matched_districts.append(d)
        
        if not matched_districts:
            return None
            
        for d_id in priority_order:
            for md in matched_districts:
                if md.id == d_id:
                    return md
        return matched_districts[0]

    def _generate_urban_features(
        self,
        road_cells: Dict[Tuple[int, int], str],
        districts: List[District]
    ) -> Tuple[List[BuildingZone], List[StrategicInfrastructure]]:
        buildings: List[BuildingZone] = []
        infrastructure: List[StrategicInfrastructure] = []
        
        # Grid coordinates tracker to prevent placing objects on the same cell
        occupied_cells: Dict[Tuple[int, int], str] = {}
        for cell in road_cells:
            occupied_cells[cell] = "Road"

        # 1. Place Strategic Infrastructure first (higher priority)
        # Small: 2 items, Medium: 4 items, Large: 6 items
        infra_types = ["Military Base", "Communication Center", "Power Station", "Fuel Depot", "Government Complex", "Industrial Facility"]
        infra_count = 2 if self.size == "Small" else (4 if self.size == "Medium" else 6)
        
        for i in range(infra_count):
            infra_type = infra_types[i % len(infra_types)]
            placed = False
            
            # Try 50 random location coordinates inside bounds to place
            for _ in range(50):
                x = self.infra_rng.randint(self.city_bounds["min_x"], self.city_bounds["max_x"])
                y = self.infra_rng.randint(self.city_bounds["min_y"], self.city_bounds["max_y"])
                
                if (x, y) not in occupied_cells:
                    district = self._get_district_at_cell(x, y, districts)
                    if district:
                        # Match infrastructure type to appropriate districts if possible
                        if infra_type in ("Military Base", "Fuel Depot") and district.type != "Military":
                            continue
                        if infra_type == "Power Station" and district.type != "Industrial":
                            continue
                        if infra_type == "Government Complex" and district.type not in ("Commercial", "Military"):
                            continue

                    # Select deterministic asset key and strategic value
                    val = self.infra_rng.randint(60, 100)
                    rot = self.infra_rng.choice([0.0, 90.0, 180.0, 270.0])
                    
                    if infra_type == "Communication Center":
                        asset = self.infra_rng.choice(COMM_TOWER_ASSETS)
                    elif infra_type in ("Military Base", "Government Complex"):
                        asset = self.infra_rng.choice(RADAR_ASSETS)
                    else:
                        asset = self.infra_rng.choice(INDUSTRIAL_ASSETS)

                    infrastructure.append(StrategicInfrastructure(
                        id=f"infra-{i+1}",
                        type=infra_type,
                        x=x,
                        y=y,
                        strategic_value=float(val),
                        asset_key=asset,
                        rotation=rot
                    ))
                    occupied_cells[(x, y)] = "Infrastructure"
                    placed = True
                    break

        # 2. Populate remaining building zones cell by cell
        bldg_index = 1
        for y in range(self.city_bounds["min_y"], self.city_bounds["max_y"] + 1):
            for x in range(self.city_bounds["min_x"], self.city_bounds["max_x"] + 1):
                if (x, y) in occupied_cells:
                    continue

                district = self._get_district_at_cell(x, y, districts)
                if not district:
                    continue

                # Roll density to see if we place a building here
                if self.building_rng.random() < district.density:
                    # Deterministic build parameters
                    rot = self.building_rng.choice([0.0, 90.0, 180.0, 270.0])
                    
                    if district.type == "Residential":
                        asset = self.building_rng.choice(RESIDENTIAL_ASSETS)
                        h = self.building_rng.randint(1, 3)
                        cov = 0.45
                        vis = 0.80
                        mov = 2
                    elif district.type == "Commercial":
                        # Commercial Core vs Office Heights
                        if district.id == "district-office":
                            asset = self.building_rng.choice(OFFICE_ASSETS)
                            h = self.building_rng.randint(4, 8)
                            cov = 0.55
                            vis = 0.60
                            mov = 3
                        else:
                            asset = self.building_rng.choice(COMMERCIAL_ASSETS)
                            h = self.building_rng.randint(2, 4)
                            cov = 0.50
                            vis = 0.70
                            mov = 2
                    elif district.type == "Industrial":
                        asset = self.building_rng.choice(INDUSTRIAL_ASSETS)
                        h = self.building_rng.randint(1, 2)
                        cov = 0.60
                        vis = 0.70
                        mov = 3
                    elif district.type == "Military":
                        # Mix of landmarks and destroyed buildings for interesting defense structures
                        is_ruin = self.building_rng.random() < 0.35
                        if is_ruin:
                            # Destroyed assets
                            asset = "buildings/destroyed/ruin_building.glb"
                            h = 1
                            cov = 0.70  # Ruins provide highly defensive infantry cover
                            vis = 0.65
                            mov = 4
                        else:
                            asset = self.building_rng.choice(LANDMARK_ASSETS)
                            h = self.building_rng.randint(2, 4)
                            cov = 0.75
                            vis = 0.50
                            mov = 4
                    else:
                        asset = self.building_rng.choice(RESIDENTIAL_ASSETS)
                        h = 1
                        cov = 0.40
                        vis = 0.85
                        mov = 2

                    buildings.append(BuildingZone(
                        id=f"bldg-{bldg_index}",
                        district_id=district.id,
                        type=district.type,
                        x=x,
                        y=y,
                        height=h,
                        cover_value=cov,
                        visibility_modifier=vis,
                        movement_penalty=mov,
                        asset_key=asset,
                        rotation=rot
                    ))
                    occupied_cells[(x, y)] = "Building"
                    bldg_index += 1

        return buildings, infrastructure

    def _compile_metadata(
        self,
        road_cells: Dict[Tuple[int, int], str],
        districts: List[District],
        buildings: List[BuildingZone],
        infrastructure: List[StrategicInfrastructure]
    ) -> List[CellMetadata]:
        metadata: List[CellMetadata] = []
        
        # Build quick lookups for buildings and infrastructure
        bldg_lookup = {(b.x, b.y): b for b in buildings}
        infra_lookup = {(inf.x, inf.y): inf for inf in infrastructure}

        for y in range(self.height):
            for x in range(self.width):
                # Check if cell is road
                is_road = (x, y) in road_cells
                road_type = road_cells.get((x, y))

                # Identify district
                district = self._get_district_at_cell(x, y, districts)
                district_type = district.type if district else "Outskirts"

                # Check properties based on occupied elements
                bldg = bldg_lookup.get((x, y))
                infra = infra_lookup.get((x, y))

                # Default values for open grid cells
                cover = 0.0
                mov_cost = 1
                vis_mod = 1.0
                comm_mod = 1.0

                if is_road:
                    # Roads increase speed
                    cover = 0.0
                    mov_cost = 1
                    vis_mod = 1.0
                elif bldg:
                    cover = bldg.cover_value
                    mov_cost = 1 + bldg.movement_penalty
                    vis_mod = bldg.visibility_modifier
                elif infra:
                    cover = 0.65
                    mov_cost = 3
                    vis_mod = 0.55
                elif district_type != "Outskirts":
                    # General open district cell cover
                    cover = 0.10
                    mov_cost = 1
                    vis_mod = 0.95

                # Adjust comm modifier if in range of a strategic Communication Center
                for inf in infrastructure:
                    if inf.type == "Communication Center":
                        # Distance formula
                        dist = ((x - inf.x) ** 2 + (y - inf.y) ** 2) ** 0.5
                        if dist <= 8.0:
                            # Communications are boosted (+20%) close to comm towers
                            comm_mod = round(1.20 - (dist * 0.02), 2)
                            break

                metadata.append(CellMetadata(
                    x=x,
                    y=y,
                    district_type=district_type,
                    is_road=is_road,
                    road_type=road_type,
                    cover_value=cover,
                    movement_cost=mov_cost,
                    visibility_modifier=vis_mod,
                    communication_modifier=comm_mod
                ))

        return metadata
