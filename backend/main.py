from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from dataclasses import dataclass
import json
import os
import math
import random
import re
from typing import Any, Dict, List, Literal, Optional, Tuple
from urllib.error import URLError
from urllib.request import Request, urlopen

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from api.routes import router
from engine.game_state import GameState
from engine.monte_carlo import run_monte_carlo
from engine.mcts import run_mcts
from engine.strategy import strategic_override

app = FastAPI(title="WarMatrix Simulation Backend")

def log(msg: str):
    print(f"[BACKEND] {msg}", flush=True)

app.include_router(router, prefix="/api")

GRID_WIDTH = 12
GRID_HEIGHT = 8
AI_SERVER_URL = "http://127.0.0.1:8000/api/sitrep"
AI_NARRATIVE_TIMEOUT_SEC = 120

TERRAIN_RULES: Dict[str, Dict[str, float]] = {
    "plains": {"move_cost": 1.0, "block_los": 0.0, "defense": 0.0},
    "forest": {"move_cost": 1.4, "block_los": 0.35, "defense": 0.12},
    "urban": {"move_cost": 1.3, "block_los": 0.45, "defense": 0.18},
    "hill": {"move_cost": 1.2, "block_los": 0.0, "defense": 0.08},
    "water": {"move_cost": 99.0, "block_los": 0.0, "defense": 0.0},
}

ACTION_SYNONYMS = {
    "MOVE": ["move", "advance", "push", "maneuver", "reposition"],
    "ATTACK": ["attack", "engage", "fire", "strike", "assault"],
    "HOLD": ["hold", "wait", "pause", "maintain", "stay"],
    "CAPTURE": ["capture", "secure", "seize", "take objective"],
    "RECON": ["recon", "scout", "observe", "survey"],
    "DEFEND": ["defend", "fortify", "dig in", "protect"],
}


class StructuredTarget(BaseModel):
    x: Optional[int] = None
    y: Optional[int] = None
    unit_id: Optional[str] = None
    objective_id: Optional[str] = None


class StructuredCommand(BaseModel):
    action_type: Literal["MOVE", "ATTACK", "HOLD", "CAPTURE", "RECON", "DEFEND"] = "HOLD"
    unit_id: Optional[str] = None
    target: Optional[StructuredTarget] = None
    raw_input: str = ""


class BattlefieldUnit(BaseModel):
    id: str
    faction: Literal["FRIENDLY", "ENEMY"]
    label: str
    x: int
    y: int
    hp: int = 100
    max_hp: int = 100
    attack: int = 26
    defense: int = 14
    range: int = 3
    mobility: int = 3
    vision: int = 6
    alive: bool = True


class BattlefieldObjective(BaseModel):
    id: str
    label: str
    x: int
    y: int
    controller: Literal["FRIENDLY", "ENEMY", "NEUTRAL"] = "NEUTRAL"
    progress_friendly: int = 0
    progress_enemy: int = 0
    capture_threshold: int = 2


class BattlefieldCell(BaseModel):
    x: int
    y: int
    terrain: Literal["plains", "forest", "urban", "hill", "water"]
    elevation: int = 0


class BattlefieldState(BaseModel):
    turn: int = 1
    width: int = GRID_WIDTH
    height: int = GRID_HEIGHT
    terrain_grid: List[BattlefieldCell]
    units: List[BattlefieldUnit]
    objectives: List[BattlefieldObjective]
    weather: str = "clear"
    ended: bool = False
    winner: Optional[str] = None
    end_reason: Optional[str] = None


class BatchAction(BaseModel):
    unit_id: str
    action_type: str = "MOVE"
    target_x: Optional[int] = None
    target_y: Optional[int] = None
    target_unit_id: Optional[str] = None

class SimulationTickRequest(BaseModel):
    command: Any
    current_state: Optional[BattlefieldState] = None
    end_simulation: bool = False
    max_new_tokens: int = Field(default=512, ge=32)
    temperature: float = Field(default=0.45, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.1, le=1.0)
    # New: if passed, the backend knows we have pre-extracted batch actions
    batch_actions: Optional[List[BatchAction]] = None


class ScenarioInitUnit(BaseModel):
    label: str
    assetClass: str = "Infantry"
    allianceRole: Literal["FRIENDLY", "ENEMY", "NEUTRAL", "INFRASTRUCTURE"]
    x: int
    y: int


class ScenarioMapPeak(BaseModel):
    cx: float
    cy: float
    h: float
    r2: Optional[float] = None


class ScenarioInitData(BaseModel):
    scenarioTitle: str
    briefing: str
    terrainType: Literal["Highland", "Forest", "Urban", "Plains", "Desert", "Mountain", "Coastal", "Arctic"] = "Plains"
    weather: str = "Clear"
    units: List[ScenarioInitUnit] = Field(default_factory=list)
    mapPeaks: List[ScenarioMapPeak] = Field(default_factory=list)


class ScenarioInitializeRequest(BaseModel):
    scenario: ScenarioInitData


def _seeded_random_for_state(turn: int) -> random.Random:
    return random.Random(1009 + turn * 17)


def _default_terrain_cell(x: int, y: int) -> BattlefieldCell:
    # Light deterministic pattern so map has mixed constraints.
    terrain = "plains"
    if (x + y) % 11 == 0:
        terrain = "water"
    elif (x * 2 + y) % 7 == 0:
        terrain = "forest"
    elif (x + y * 2) % 9 == 0:
        terrain = "urban"
    elif (x + y) % 5 == 0:
        terrain = "hill"

    elevation = ((x * 3 + y * 5) % 7) + (1 if terrain == "hill" else 0)
    return BattlefieldCell(x=x, y=y, terrain=terrain, elevation=elevation)


def _default_state() -> BattlefieldState:
    terrain_grid = [_default_terrain_cell(x, y) for y in range(1, GRID_HEIGHT + 1) for x in range(1, GRID_WIDTH + 1)]
    units = [
        BattlefieldUnit(id="f1", faction="FRIENDLY", label="Alpha Platoon", x=2, y=3, mobility=3, range=3),
        BattlefieldUnit(id="f2", faction="FRIENDLY", label="Bravo Support", x=5, y=6, mobility=2, range=4, attack=28),
        BattlefieldUnit(id="e1", faction="ENEMY", label="Hostile Vanguard", x=10, y=2, mobility=3, range=3),
        BattlefieldUnit(id="e2", faction="ENEMY", label="Fortified Outpost", x=11, y=7, mobility=2, range=4, defense=20),
    ]
    objectives = [
        BattlefieldObjective(id="o1", label="Objective Sierra", x=6, y=4),
        BattlefieldObjective(id="o2", label="Objective Delta", x=9, y=5),
    ]
    return BattlefieldState(terrain_grid=terrain_grid, units=units, objectives=objectives)


def _scale_to_backend_grid(x: int, y: int) -> Tuple[int, int]:
    # AI scenario generator uses a 44x28 grid; simulation engine uses 12x8.
    sx = max(1, min(GRID_WIDTH, int(round((x / 44) * GRID_WIDTH))))
    sy = max(1, min(GRID_HEIGHT, int(round((y / 28) * GRID_HEIGHT))))
    return sx, sy


def _terrain_from_profile(terrain_type: str, x: int, y: int) -> str:
    t = terrain_type.lower()
    if t in {"desert", "arctic"}:
        return "plains" if (x + y) % 7 else "hill"
    if t in {"urban"}:
        return "urban" if (x + y) % 3 else "plains"
    if t in {"forest", "coastal"}:
        return "forest" if (x * y) % 4 else "plains"
    if t in {"mountain", "highland"}:
        return "hill" if (x + y) % 2 else "plains"
    return "plains"


def _build_terrain_grid_from_scenario(scenario: ScenarioInitData) -> List[BattlefieldCell]:
    peaks = scenario.mapPeaks or []
    if not peaks:
        return [
            BattlefieldCell(
                x=x,
                y=y,
                terrain=_terrain_from_profile(scenario.terrainType, x, y),
                elevation=((x * 3 + y * 5) % 6) + (1 if _terrain_from_profile(scenario.terrainType, x, y) == "hill" else 0),
            )
            for y in range(1, GRID_HEIGHT + 1)
            for x in range(1, GRID_WIDTH + 1)
        ]

    cells: List[BattlefieldCell] = []
    for y in range(1, GRID_HEIGHT + 1):
        for x in range(1, GRID_WIDTH + 1):
            sx = (x / GRID_WIDTH) * 44
            sy = (y / GRID_HEIGHT) * 28
            elev_f = 0.0
            for p in peaks:
                r2 = p.r2 if p.r2 and p.r2 > 1 else 20.0
                dx = sx - p.cx
                dy = sy - p.cy
                elev_f += p.h * math.exp(-((dx * dx + dy * dy) / r2))
            elevation = max(0, min(9, int(round(elev_f * 3.0))))

            terrain = _terrain_from_profile(scenario.terrainType, x, y)
            if elevation >= 6:
                terrain = "hill"
            cells.append(BattlefieldCell(x=x, y=y, terrain=terrain, elevation=elevation))
    return cells


def _build_state_from_scenario(scenario: ScenarioInitData) -> BattlefieldState:
    terrain_grid = _build_terrain_grid_from_scenario(scenario)

    units: List[BattlefieldUnit] = []
    objectives: List[BattlefieldObjective] = []

    # If scenario has no units, bootstrap sensible defaults.
    source_units = scenario.units
    if not source_units:
        source_units = [
            ScenarioInitUnit(label="Alpha Platoon", assetClass="Infantry", allianceRole="FRIENDLY", x=8, y=7),
            ScenarioInitUnit(label="Bravo Support", assetClass="Mechanized", allianceRole="FRIENDLY", x=13, y=11),
            ScenarioInitUnit(label="Hostile Vanguard", assetClass="Armor", allianceRole="ENEMY", x=35, y=9),
            ScenarioInitUnit(label="Enemy Outpost", assetClass="Objective", allianceRole="NEUTRAL", x=24, y=14),
        ]

    for idx, su in enumerate(source_units):
        sx, sy = _scale_to_backend_grid(su.x, su.y)
        asset = su.assetClass.lower()

        if su.allianceRole in {"NEUTRAL", "INFRASTRUCTURE"} or asset in {"objective", "infrastructure"}:
            objectives.append(
                BattlefieldObjective(
                    id=f"o{len(objectives) + 1}",
                    label=su.label,
                    x=sx,
                    y=sy,
                )
            )
            continue

        mobility = 3
        attack = 26
        defense = 14
        if asset == "armor":
            mobility, attack, defense = 3, 34, 20
        elif asset == "mechanized":
            mobility, attack, defense = 3, 30, 16
        elif asset == "artillery":
            mobility, attack, defense = 2, 36, 12
        elif asset == "recon":
            mobility, attack, defense = 4, 20, 10
        elif asset == "logistics":
            mobility, attack, defense = 2, 12, 10
        elif asset == "command unit":
            mobility, attack, defense = 2, 18, 14

        faction = "FRIENDLY" if su.allianceRole == "FRIENDLY" else "ENEMY"
        unit_id = f"{'f' if faction == 'FRIENDLY' else 'e'}{len([u for u in units if u.faction == faction]) + 1}"
        units.append(
            BattlefieldUnit(
                id=unit_id,
                faction=faction,
                label=su.label,
                x=sx,
                y=sy,
                mobility=mobility,
                attack=attack,
                defense=defense,
                range=4 if asset == "artillery" else 3,
                vision=7 if asset == "recon" else 6,
            )
        )

    if not objectives:
        objectives = [
            BattlefieldObjective(id="o1", label="Primary Objective", x=6, y=4),
            BattlefieldObjective(id="o2", label="Secondary Objective", x=9, y=5),
        ]

    # Ensure each side has at least one combat unit so simulation can run.
    if not any(u.faction == "FRIENDLY" for u in units):
        units.append(BattlefieldUnit(id="f1", faction="FRIENDLY", label="Alpha Platoon", x=2, y=3))
    if not any(u.faction == "ENEMY" for u in units):
        units.append(BattlefieldUnit(id="e1", faction="ENEMY", label="Hostile Vanguard", x=10, y=2))

    return BattlefieldState(
        turn=1,
        width=GRID_WIDTH,
        height=GRID_HEIGHT,
        terrain_grid=terrain_grid,
        units=units,
        objectives=objectives,
        weather=scenario.weather.lower(),
        ended=False,
    )


def _cell_lookup(state: BattlefieldState) -> Dict[Tuple[int, int], BattlefieldCell]:
    return {(c.x, c.y): c for c in state.terrain_grid}


def _distance(a: Tuple[int, int], b: Tuple[int, int]) -> float:
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def _adjacent_cells(x: int, y: int, width: int, height: int) -> List[Tuple[int, int]]:
    out: List[Tuple[int, int]] = []
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 1 <= nx <= width and 1 <= ny <= height:
            out.append((nx, ny))
    return out


def _movement_cost(cell: BattlefieldCell) -> float:
    return TERRAIN_RULES[cell.terrain]["move_cost"]


def _occupied_positions(state: BattlefieldState, exclude_unit_id: Optional[str] = None) -> Dict[Tuple[int, int], BattlefieldUnit]:
    out: Dict[Tuple[int, int], BattlefieldUnit] = {}
    for unit in state.units:
        if not unit.alive:
            continue
        if exclude_unit_id and unit.id == exclude_unit_id:
            continue
        out[(unit.x, unit.y)] = unit
    return out


def _find_unit(state: BattlefieldState, unit_id: Optional[str], faction: str) -> Optional[BattlefieldUnit]:
    if unit_id:
        for unit in state.units:
            if unit.id == unit_id and unit.faction == faction and unit.alive:
                return unit
    for unit in state.units:
        if unit.faction == faction and unit.alive:
            return unit
    return None


def _line_points(x0: int, y0: int, x1: int, y1: int) -> List[Tuple[int, int]]:
    points: List[Tuple[int, int]] = []
    dx = abs(x1 - x0)
    sx = 1 if x0 < x1 else -1
    dy = -abs(y1 - y0)
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    x, y = x0, y0

    while True:
        points.append((x, y))
        if x == x1 and y == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x += sx
        if e2 <= dx:
            err += dx
            y += sy

    return points


def _has_line_of_sight(state: BattlefieldState, attacker: BattlefieldUnit, defender: BattlefieldUnit) -> bool:
    cells = _cell_lookup(state)
    line = _line_points(attacker.x, attacker.y, defender.x, defender.y)
    attacker_elev = cells.get((attacker.x, attacker.y), BattlefieldCell(x=attacker.x, y=attacker.y, terrain="plains", elevation=0)).elevation
    defender_elev = cells.get((defender.x, defender.y), BattlefieldCell(x=defender.x, y=defender.y, terrain="plains", elevation=0)).elevation
    base_sight = max(attacker.vision, 2)
    if _distance((attacker.x, attacker.y), (defender.x, defender.y)) > base_sight:
        return False

    for ix, (x, y) in enumerate(line):
        if ix == 0 or ix == len(line) - 1:
            continue
        c = cells.get((x, y))
        if not c:
            continue
        # Forest/urban can block LOS unless attacker has clear elevation advantage.
        if TERRAIN_RULES[c.terrain]["block_los"] >= 0.4 and attacker_elev <= c.elevation:
            return False
        # Strong ridge between attacker and defender can block LOS.
        interp = attacker_elev + (defender_elev - attacker_elev) * (ix / max(1, len(line) - 1))
        if c.elevation >= interp + 2:
            return False
    return True


def _reconstruct_path(prev: Dict[Tuple[int, int], Tuple[int, int]], end: Tuple[int, int]) -> List[Tuple[int, int]]:
    path = [end]
    while path[-1] in prev:
        path.append(prev[path[-1]])
    path.reverse()
    return path


def _find_path_with_constraints(
    state: BattlefieldState,
    unit: BattlefieldUnit,
    target: Tuple[int, int],
) -> List[Tuple[int, int]]:
    cells = _cell_lookup(state)
    occupied = _occupied_positions(state, exclude_unit_id=unit.id)
    start = (unit.x, unit.y)
    max_cost = float(max(1, unit.mobility))
    max_step_up = 2

    frontier: List[Tuple[float, Tuple[int, int]]] = [(0.0, start)]
    best_cost: Dict[Tuple[int, int], float] = {start: 0.0}
    prev: Dict[Tuple[int, int], Tuple[int, int]] = {}

    while frontier:
        frontier.sort(key=lambda it: it[0])
        cost, node = frontier.pop(0)
        if node == target:
            break
        for nx, ny in _adjacent_cells(node[0], node[1], state.width, state.height):
            if (nx, ny) in occupied:
                continue
            cur_cell = cells.get(node)
            next_cell = cells.get((nx, ny))
            if not cur_cell or not next_cell:
                continue
            if next_cell.terrain == "water":
                continue
            if next_cell.elevation - cur_cell.elevation > max_step_up:
                continue
            step_cost = _movement_cost(next_cell) + max(0.0, (next_cell.elevation - cur_cell.elevation) * 0.35)
            new_cost = cost + step_cost
            if new_cost > max_cost + 1e-6:
                continue
            old = best_cost.get((nx, ny))
            if old is None or new_cost < old:
                best_cost[(nx, ny)] = new_cost
                prev[(nx, ny)] = node
                frontier.append((new_cost, (nx, ny)))

    reachable_nodes = [p for p, c in best_cost.items() if c <= max_cost + 1e-6]
    if target in best_cost:
        return _reconstruct_path(prev, target)

    if not reachable_nodes:
        return [start]

    best = min(reachable_nodes, key=lambda p: _distance(p, target))
    return _reconstruct_path(prev, best)


def _normalize_action_type(text: str) -> Literal["MOVE", "ATTACK", "HOLD", "CAPTURE", "RECON", "DEFEND"]:
    lowered = text.lower()
    for act, tokens in ACTION_SYNONYMS.items():
        for token in tokens:
            if token in lowered:
                return act  # type: ignore[return-value]
    return "HOLD"


def _normalize_command(command_input: Any, state: BattlefieldState) -> StructuredCommand:
    if isinstance(command_input, dict):
        action = str(command_input.get("action_type") or command_input.get("action") or "HOLD").upper()
        if action not in {"MOVE", "ATTACK", "HOLD", "CAPTURE", "RECON", "DEFEND"}:
            action = _normalize_action_type(json.dumps(command_input))
        target_dict = command_input.get("target") or {}
        target = StructuredTarget(
            x=target_dict.get("x"),
            y=target_dict.get("y"),
            unit_id=target_dict.get("unit_id"),
            objective_id=target_dict.get("objective_id"),
        )
        return StructuredCommand(
            action_type=action,
            unit_id=command_input.get("unit_id"),
            target=target,
            raw_input=str(command_input.get("raw_input") or json.dumps(command_input)),
        )

    raw = str(command_input or "").strip()
    action = _normalize_action_type(raw)
    unit_id = None
    target = StructuredTarget()

    for unit in state.units:
        if unit.id.lower() in raw.lower() or unit.label.lower() in raw.lower():
            unit_id = unit.id
            break

    coords = re.findall(r"(?:x\s*[:=]?\s*(\d+)\D+y\s*[:=]?\s*(\d+))|(?:\[(\d+)\s*,\s*(\d+)\])", raw, flags=re.IGNORECASE)
    if coords:
        c = coords[0]
        x = int(c[0] or c[2])
        y = int(c[1] or c[3])
        target.x = max(1, min(GRID_WIDTH, x))
        target.y = max(1, min(GRID_HEIGHT, y))

    for obj in state.objectives:
        if obj.id.lower() in raw.lower() or obj.label.lower() in raw.lower():
            target.objective_id = obj.id
            if target.x is None or target.y is None:
                target.x, target.y = obj.x, obj.y
            break

    enemy_units = [u for u in state.units if u.faction == "ENEMY" and u.alive]
    reference = next((u for u in state.units if u.faction == "FRIENDLY" and u.alive), state.units[0] if state.units else None)
    if action == "ATTACK" and target.unit_id is None and enemy_units:
        if reference:
            nearest = min(enemy_units, key=lambda e: _distance((e.x, e.y), (reference.x, reference.y)))
            target.unit_id = nearest.id

    return StructuredCommand(action_type=action, unit_id=unit_id, target=target, raw_input=raw)


@dataclass
class TickArtifacts:
    movements: List[Dict[str, Any]]
    combat_results: List[Dict[str, Any]]
    casualties: List[Dict[str, Any]]
    objective_status: List[Dict[str, Any]]
    enemy_actions: List[Dict[str, Any]]
    simulation_results: Dict[str, Any]


def _validate_command(state: BattlefieldState, command: StructuredCommand) -> Dict[str, Any]:
    reasons: List[str] = []

    friendly_alive = [u for u in state.units if u.alive and u.faction == "FRIENDLY"]
    if not friendly_alive:
        reasons.append("No alive friendly units available to execute an action.")

    actor = _find_unit(state, command.unit_id, "FRIENDLY")
    if command.unit_id and not actor:
        reasons.append(f"Unit '{command.unit_id}' is not an alive friendly unit.")
    if not actor and friendly_alive:
        actor = friendly_alive[0]

    resolved_target: Dict[str, Any] = {}
    if command.target:
        resolved_target = command.target.dict(exclude_none=True)

    target_xy: Optional[Tuple[int, int]] = None
    if command.target and command.target.objective_id:
        obj = next((o for o in state.objectives if o.id == command.target.objective_id), None)
        if not obj:
            reasons.append(f"Objective '{command.target.objective_id}' does not exist.")
        else:
            target_xy = (obj.x, obj.y)
            resolved_target["x"] = obj.x
            resolved_target["y"] = obj.y

    if command.target and command.target.x is not None and command.target.y is not None:
        tx = int(command.target.x)
        ty = int(command.target.y)
        if not (1 <= tx <= state.width and 1 <= ty <= state.height):
            reasons.append(f"Target coordinates ({tx}, {ty}) are outside the battlefield bounds.")
        else:
            target_xy = (tx, ty)
            resolved_target["x"] = tx
            resolved_target["y"] = ty

    cells = _cell_lookup(state)
    occupied = _occupied_positions(state, exclude_unit_id=actor.id if actor else None)

    if actor:
        normalized_unit_id = actor.id
    else:
        normalized_unit_id = command.unit_id

    if command.action_type in {"MOVE", "CAPTURE", "RECON", "DEFEND"}:
        if not actor:
            reasons.append("No valid friendly actor is available for a maneuver action.")
        if command.action_type in {"MOVE", "CAPTURE", "RECON"} and not target_xy:
            reasons.append("Maneuver actions require a target coordinate or objective.")
        if target_xy:
            target_cell = cells.get(target_xy)
            if target_cell and target_cell.terrain == "water":
                reasons.append("Target cell is water and cannot be occupied.")
            blocker = occupied.get(target_xy)
            if blocker and blocker.faction == "FRIENDLY":
                reasons.append(f"Target cell is occupied by friendly unit '{blocker.id}'.")

    if command.action_type == "ATTACK":
        if not actor:
            reasons.append("Attack action requires an alive friendly actor.")
        defender: Optional[BattlefieldUnit] = None
        if command.target and command.target.unit_id:
            defender = next((u for u in state.units if u.id == command.target.unit_id and u.faction == "ENEMY" and u.alive), None)
            if not defender:
                reasons.append(f"Target enemy unit '{command.target.unit_id}' is not available.")
        elif actor:
            defender = _closest_enemy(state, actor)

        if actor and defender:
            dist = _distance((actor.x, actor.y), (defender.x, defender.y))
            if dist > actor.range:
                reasons.append(f"Target '{defender.id}' is out of range (distance {dist:.1f}, range {actor.range}).")
            if not _has_line_of_sight(state, actor, defender):
                reasons.append(f"No line-of-sight from '{actor.id}' to '{defender.id}'.")

            resolved_target["unit_id"] = defender.id
            if "x" not in resolved_target:
                resolved_target["x"] = defender.x
                resolved_target["y"] = defender.y
        elif actor:
            reasons.append("No valid enemy target found for attack action.")

    is_valid = len(reasons) == 0
    return {
        "is_valid": is_valid,
        "reasons": reasons,
        "normalized_command": {
            "action_type": command.action_type,
            "unit_id": normalized_unit_id,
            "target": resolved_target,
            "raw_input": command.raw_input,
        },
    }


def _combat(state: BattlefieldState, attacker: BattlefieldUnit, defender: BattlefieldUnit, rng: random.Random) -> Optional[Dict[str, Any]]:
    if not attacker.alive or not defender.alive:
        return None
    dist = _distance((attacker.x, attacker.y), (defender.x, defender.y))
    if dist > attacker.range:
        return None
    if not _has_line_of_sight(state, attacker, defender):
        return {
            "attacker_id": attacker.id,
            "defender_id": defender.id,
            "outcome": "blocked_los",
            "distance": round(dist, 2),
            "damage": 0,
        }

    cells = _cell_lookup(state)
    attacker_cell = cells.get((attacker.x, attacker.y))
    defender_cell = cells.get((defender.x, defender.y))
    attack_mod = 1.0
    defense_mod = 1.0 + (TERRAIN_RULES.get(defender_cell.terrain, {}).get("defense", 0.0) if defender_cell else 0.0)
    if attacker_cell and defender_cell and attacker_cell.elevation > defender_cell.elevation:
        attack_mod += 0.15
    if attacker_cell and defender_cell and defender_cell.elevation > attacker_cell.elevation:
        attack_mod -= 0.1

    hit_chance = max(0.1, min(0.95, 0.45 + (attacker.attack - defender.defense) * 0.012 + attack_mod * 0.08 - defense_mod * 0.1))
    hit = rng.random() <= hit_chance
    if not hit:
        return {
            "attacker_id": attacker.id,
            "defender_id": defender.id,
            "outcome": "miss",
            "distance": round(dist, 2),
            "damage": 0,
        }

    damage = int(max(4, attacker.attack * (0.55 + rng.random() * 0.4) / max(0.6, defense_mod)))
    defender.hp = max(0, defender.hp - damage)
    defender.alive = defender.hp > 0
    return {
        "attacker_id": attacker.id,
        "defender_id": defender.id,
        "outcome": "hit" if defender.alive else "kill",
        "distance": round(dist, 2),
        "damage": damage,
    }


def _closest_enemy(state: BattlefieldState, unit: BattlefieldUnit) -> Optional[BattlefieldUnit]:
    enemies = [u for u in state.units if u.faction != unit.faction and u.alive]
    if not enemies:
        return None
    return min(enemies, key=lambda e: _distance((unit.x, unit.y), (e.x, e.y)))


def _objective_capture_tick(state: BattlefieldState) -> List[Dict[str, Any]]:
    updates: List[Dict[str, Any]] = []
    for obj in state.objectives:
        friendly_here = any(u.alive and u.faction == "FRIENDLY" and u.x == obj.x and u.y == obj.y for u in state.units)
        enemy_here = any(u.alive and u.faction == "ENEMY" and u.x == obj.x and u.y == obj.y for u in state.units)

        if friendly_here and not enemy_here:
            obj.progress_friendly += 1
            obj.progress_enemy = max(0, obj.progress_enemy - 1)
        elif enemy_here and not friendly_here:
            obj.progress_enemy += 1
            obj.progress_friendly = max(0, obj.progress_friendly - 1)
        else:
            obj.progress_enemy = max(0, obj.progress_enemy - 1)
            obj.progress_friendly = max(0, obj.progress_friendly - 1)

        prev_controller = obj.controller
        if obj.progress_friendly >= obj.capture_threshold:
            obj.controller = "FRIENDLY"
        elif obj.progress_enemy >= obj.capture_threshold:
            obj.controller = "ENEMY"
        elif obj.progress_friendly == 0 and obj.progress_enemy == 0:
            obj.controller = "NEUTRAL"

        updates.append(
            {
                "objective_id": obj.id,
                "controller": obj.controller,
                "progress_friendly": obj.progress_friendly,
                "progress_enemy": obj.progress_enemy,
                "changed": prev_controller != obj.controller,
            }
        )
    return updates


def _macro_state_from_battlefield(state: BattlefieldState) -> GameState:
    alive_friendly = [u for u in state.units if u.alive and u.faction == "FRIENDLY"]
    alive_enemy = [u for u in state.units if u.alive and u.faction == "ENEMY"]
    max_friendly = max(1, len([u for u in state.units if u.faction == "FRIENDLY"]))
    max_enemy = max(1, len([u for u in state.units if u.faction == "ENEMY"]))

    total_friendly_hp = sum(u.hp for u in alive_friendly)
    total_enemy_hp = sum(u.hp for u in alive_enemy)
    hp_ratio = total_friendly_hp / max(1, total_enemy_hp)
    force_ratio = max(0.0, min(1.0, hp_ratio / 2.0))

    friendly_objectives = sum(1 for o in state.objectives if o.controller == "FRIENDLY")
    enemy_objectives = sum(1 for o in state.objectives if o.controller == "ENEMY")
    obj_delta = (friendly_objectives - enemy_objectives) / max(1, len(state.objectives))

    morale = max(0.0, min(1.0, 0.5 + obj_delta * 0.25 + (len(alive_friendly) / max_friendly - 0.5) * 0.35))
    supply = max(0.0, min(1.0, 0.5 + force_ratio * 0.3))
    risk = max(0.0, min(1.0, 0.6 - force_ratio * 0.35 + (enemy_objectives / max(1, len(state.objectives))) * 0.25))
    mobility = max(0.0, min(1.0, sum(u.mobility for u in alive_friendly) / max(1, len(alive_friendly) * 4)))
    communications = max(0.0, min(1.0, 0.65 + (1 if state.weather == "clear" else -0.2)))
    fires = max(0.0, min(1.0, sum(u.attack for u in alive_friendly) / max(1, len(alive_friendly) * 40)))
    success = max(0.0, min(1.0, 0.45 + force_ratio * 0.25 + obj_delta * 0.2 - risk * 0.2))

    return GameState(
        morale=morale,
        supply=supply,
        operational_risk=risk,
        success_probability=success,
        mobility=mobility,
        communications=communications,
        fires=fires,
        force_ratio=force_ratio,
    )


def _generate_narrative(
    player_command: StructuredCommand,
    updated_state: BattlefieldState,
    artifacts: TickArtifacts,
    max_new_tokens: int,
    temperature: float,
    top_p: float,
) -> str:
    movement_events = [
        {
            "unit_id": m.get("unit_id"),
            "from": m.get("from"),
            "to": m.get("to"),
            "enemy_action": bool(m.get("enemy_action", False)),
        }
        for m in artifacts.movements
    ]
    combat_events = [
        {
            "attacker_id": c.get("attacker_id"),
            "defender_id": c.get("defender_id"),
            "outcome": c.get("outcome"),
            "damage": c.get("damage", 0),
            "enemy_action": bool(c.get("enemy_action", False)),
        }
        for c in artifacts.combat_results
    ]
    objective_changes = [o for o in artifacts.objective_status if o.get("changed")]

    payload = {
        "instruction": (
            "You are a military operations narrator. Produce TWO SECTIONS for one simulation turn. "
            "Section 1 title exactly: STRUCTURED ANALYSIS. Section 2 title exactly: WAR STORY. "
            "Use only supplied events, no invented units, and end with complete sentences."
        ),
        "battlefield_data": json.dumps(
            {
                "format": {
                    "sections": [
                        "STRUCTURED ANALYSIS",
                        "WAR STORY",
                    ],
                    "constraints": [
                        "Between 180 and 280 words total.",
                        "In STRUCTURED ANALYSIS use 4 bullets: Turn Outcome, Objective Control, Risk, Next Action.",
                        "In WAR STORY write a concise chronological narrative of this turn.",
                        "No markdown tables.",
                        "Reference unit IDs and objectives when possible.",
                    ],
                },
                "turn": updated_state.turn,
                "player_command": player_command.dict(),
                "turn_summary": {
                    "movements": movement_events,
                    "combat": combat_events,
                    "objective_changes": objective_changes,
                    "casualties": artifacts.casualties,
                    "enemy_actions": artifacts.enemy_actions,
                },
                "simulation_results": artifacts.simulation_results,
                "state_snapshot": {
                    "friendly_alive": [u.id for u in updated_state.units if u.alive and u.faction == "FRIENDLY"],
                    "enemy_alive": [u.id for u in updated_state.units if u.alive and u.faction == "ENEMY"],
                    "objectives": [
                        {
                            "id": o.id,
                            "controller": o.controller,
                            "progress_friendly": o.progress_friendly,
                            "progress_enemy": o.progress_enemy,
                        }
                        for o in updated_state.objectives
                    ],
                },
            }
        ),
        "max_new_tokens": max(96, min(512, int(max_new_tokens))),
        "temperature": max(0.0, min(2.0, float(temperature))),
        "top_p": max(0.1, min(1.0, float(top_p))),
        "do_sample": False,
    }
    body = json.dumps(payload).encode("utf-8")
    req = Request(AI_SERVER_URL, data=body, method="POST", headers={"Content-Type": "application/json"})
    try:
        with urlopen(req, timeout=AI_NARRATIVE_TIMEOUT_SEC) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            text = str(data.get("response") or "").strip()
            if not text:
                return "Narrative unavailable: AI returned empty output for this turn."

            # If the model output looks clipped, synthesize a deterministic continuation.
            clipped = len(text) < 80 or text[-1] not in ".!?"
            if clipped:
                sim = artifacts.simulation_results
                moved = len(artifacts.movements)
                combats = len(artifacts.combat_results)
                obj_changes = [o for o in artifacts.objective_status if o.get("changed")]
                outcome_line = (
                    f"Turn {updated_state.turn} resolved with {moved} movements, {combats} combat events, "
                    f"and expected success {int(float(sim.get('expected_success', 0.0)) * 100)}%."
                )
                obj_shift_parts = [f"{o.get('objective_id')}->{o.get('controller')}" for o in obj_changes]
                obj_line = (
                    f"Objective control shifts: {', '.join(obj_shift_parts)}"
                    if obj_changes
                    else "Objective control remained contested with no controller change this turn."
                )
                risk_line = (
                    f"Operational risk is {int(float(sim.get('expected_risk_operational', 0.0)) * 100)}%, "
                    f"with uncertainty {int(float(sim.get('uncertainty', 0.0)) * 100)}%."
                )
                next_line = f"Recommended next action: {sim.get('recommended_next_action', 'HOLD')}."
                story = (
                    "Friendly elements executed the commander directive and forced a tactical response from enemy units. "
                    "Contact was exchanged around active approach lanes, with both sides adapting positions to terrain and objective pressure. "
                    "The line remains dynamic as follow-on maneuvers are prepared for the next turn."
                )
                return (
                    "STRUCTURED ANALYSIS\n"
                    f"- Turn Outcome: {outcome_line}\n"
                    f"- Objective Control: {obj_line}\n"
                    f"- Risk: {risk_line}\n"
                    f"- Next Action: {next_line}\n\n"
                    "WAR STORY\n"
                    f"{story}"
                )

            return text
    except URLError:
        return "Narrative unavailable: AI server not reachable during this turn."
    except Exception:
        return "Narrative unavailable: AI generation failed for this turn."


def _simulate_player_phase(state: BattlefieldState, commands: List[StructuredCommand], rng: random.Random) -> TickArtifacts:
    movements: List[Dict[str, Any]] = []
    combat_results: List[Dict[str, Any]] = []
    casualties: List[Dict[str, Any]] = []
    enemy_actions: List[Dict[str, Any]] = []

    for command in commands:
        player = _find_unit(state, command.unit_id, "FRIENDLY")
        if player and command.action_type in {"MOVE", "CAPTURE", "RECON", "DEFEND"}:
            tx = command.target.x if command.target and command.target.x else player.x
            ty = command.target.y if command.target and command.target.y else player.y
            if command.target and command.target.objective_id:
                obj = next((o for o in state.objectives if o.id == command.target.objective_id), None)
                if obj:
                    tx, ty = obj.x, obj.y
            path = _find_path_with_constraints(state, player, (tx, ty))
            old = (player.x, player.y)
            if path:
                player.x, player.y = path[-1]
            movements.append(
                {
                    "unit_id": player.id,
                    "from": {"x": old[0], "y": old[1]},
                    "to": {"x": player.x, "y": player.y},
                    "path": [{"x": px, "y": py} for (px, py) in path],
                    "possible": (old != (player.x, player.y)) or command.action_type == "DEFEND",
                }
            )

        if player and command.action_type == "ATTACK":
            defender: Optional[BattlefieldUnit] = None
            if command.target and command.target.unit_id:
                defender = next((u for u in state.units if u.id == command.target.unit_id and u.faction == "ENEMY" and u.alive), None)
            if not defender:
                defender = _closest_enemy(state, player)
            if defender:
                outcome = _combat(state, player, defender, rng)
                if outcome:
                    combat_results.append(outcome)

    for unit in state.units:
        if not unit.alive:
            casualties.append({"unit_id": unit.id, "faction": unit.faction})

    objective_status = _objective_capture_tick(state)

    macro_state = _macro_state_from_battlefield(state)
    sim = run_monte_carlo(macro_state, n_sims=220, steps=5, seed=state.turn)
    override = strategic_override(macro_state)
    recommended = override or run_mcts(macro_state, iterations=240, seed=state.turn)

    return TickArtifacts(
        movements=movements,
        combat_results=combat_results,
        casualties=casualties,
        objective_status=objective_status,
        enemy_actions=enemy_actions,
        simulation_results={
            "expected_success": round(float(sim.get("expected_success", 0.0)), 3),
            "failure_probability": round(float(sim.get("failure_probability", 0.0)), 3),
            "expected_risk_operational": round(float(sim.get("expected_risk_operational", 0.0)), 3),
            "uncertainty": round(float(sim.get("uncertainty", 0.0)), 3),
            "recommended_next_action": recommended,
        },
    )


def _simulate_enemy_phase(state: BattlefieldState, artifacts: TickArtifacts, rng: random.Random) -> None:
    for enemy in [u for u in state.units if u.faction == "ENEMY" and u.alive]:
        if state.objectives:
            target_obj = min(state.objectives, key=lambda o: _distance((enemy.x, enemy.y), (o.x, o.y)))
        else:
            target_obj = None
        target_enemy = _closest_enemy(state, enemy)

        action_taken = "hold"
        if target_enemy and _distance((enemy.x, enemy.y), (target_enemy.x, target_enemy.y)) <= enemy.range:
            action_taken = "attack"
            out = _combat(state, enemy, target_enemy, rng)
            if out:
                artifacts.combat_results.append({**out, "enemy_action": True})
        else:
            action_taken = "move"
            if target_obj:
                path = _find_path_with_constraints(state, enemy, (target_obj.x, target_obj.y))
            elif target_enemy:
                path = _find_path_with_constraints(state, enemy, (target_enemy.x, target_enemy.y))
            else:
                path = [(enemy.x, enemy.y)]
            old = (enemy.x, enemy.y)
            if path:
                enemy.x, enemy.y = path[-1]
            artifacts.movements.append(
                {
                    "unit_id": enemy.id,
                    "from": {"x": old[0], "y": old[1]},
                    "to": {"x": enemy.x, "y": enemy.y},
                    "path": [{"x": x, "y": y} for (x, y) in path],
                    "possible": old != (enemy.x, enemy.y),
                    "enemy_action": True,
                }
            )

        artifacts.enemy_actions.append(
            {
                "unit_id": enemy.id,
                "action": action_taken,
                "target_objective": target_obj.id if target_obj else None,
            }
        )

    artifacts.objective_status = _objective_capture_tick(state)

    casualties = [{"unit_id": u.id, "faction": u.faction} for u in state.units if not u.alive]
    artifacts.casualties = casualties


def _check_end_conditions(state: BattlefieldState, user_ended: bool) -> Optional[Tuple[str, str]]:
    if user_ended:
        return ("USER_STOPPED", "Simulation ended by user command")

    friendly_alive = any(u.alive and u.faction == "FRIENDLY" for u in state.units)
    enemy_alive = any(u.alive and u.faction == "ENEMY" for u in state.units)
    if not friendly_alive:
        return ("ENEMY", "All friendly units eliminated")
    if not enemy_alive:
        return ("FRIENDLY", "All enemy units eliminated")

    if state.objectives and all(o.controller == "FRIENDLY" for o in state.objectives):
        return ("FRIENDLY", "Friendly forces captured all objectives")
    if state.objectives and all(o.controller == "ENEMY" for o in state.objectives):
        return ("ENEMY", "Enemy forces captured all objectives")

    return None


@app.post("/api/simulate_tick")
def simulate_tick(payload: SimulationTickRequest) -> Dict[str, Any]:
    state = deepcopy(payload.current_state) if payload.current_state else _default_state()
    if state.ended:
        return {
            "updated_battlefield_state": state.dict(),
            "unit_movements": [],
            "combat_results": [],
            "objective_status": [o.dict() for o in state.objectives],
            "enemy_actions": [],
            "casualties": [],
            "simulation_results": {},
            "normalized_command": {"action_type": "HOLD", "raw_input": "already_ended"},
            "ai_narrative_output": "Simulation already terminated.",
            "terminated": True,
            "termination_reason": state.end_reason or "Simulation already ended",
        }

    commands: List[StructuredCommand] = []
    raw_cmd_str = str(payload.command)
    
    if "EXECUTE THE FOLLOWING PLAN:" in raw_cmd_str:
        # 1. Plan Extraction Mode
        # Call AI to get structured JSON actions
        plan_content = raw_cmd_str.split("EXECUTE THE FOLLOWING PLAN:")[1].split(". User Directive:")[0]
        extraction_prompt = (
            f"BATTLEFIELD UNITS: {', '.join([u.id + ' (' + u.label + ')' for u in state.units if u.faction == 'FRIENDLY' and u.alive])}\n"
            f"MISSION PLAN: {plan_content}\n\n"
            "EXTRACT TACTICAL ACTIONS. Format as a JSON list of objects: "
            "[{\"unit_id\": \"...\", \"action_type\": \"MOVE|ATTACK|HOLD\", \"target_x\": 5, \"target_y\": 5, \"target_unit_id\": \"...\"}]. "
            "ONLY RETURN THE JSON LIST. If a unit is not mentioned, it HOLDS position."
        )
        
        try:
            # We reuse the AI server for extraction
            import urllib.request
            log(f"Extracting batch actions from plan for turn {state.turn}...")
            
            # Simple AI server call
            ai_req_payload = {
                "instruction": "You are a tactical data extractor. Convert military plans into JSON actions.",
                "battlefield_data": extraction_prompt,
                "temperature": 0.1,
                "max_new_tokens": 512
            }
            
            use_lm = os.environ.get("USE_LM_STUDIO", "false").lower() in ("true", "1", "yes")
            ip = os.environ.get("LM_STUDIO_IP", "127.0.0.1")
            port = os.environ.get("LM_STUDIO_PORT", "1234")
            
            target_url = f"http://{ip}:{port}/v1/chat/completions" if use_lm else f"{AI_SERVER_URL}"
            # For simplicity in this script, we'll try to use the existing _generate_narrative style or direct call
            # But wait, AI_SERVER_URL is available.
            
            with urllib.request.urlopen(urllib.request.Request(
                AI_SERVER_URL,
                data=json.dumps(ai_req_payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            ), timeout=30) as resp:
                ai_data = json.loads(resp.read().decode("utf-8"))
                raw_json = ai_data.get("response", "[]")
                # Clean up potential markdown formatting
                raw_json = re.sub(r'```json\s*|\s*```', '', raw_json).strip()
                extracted = json.loads(raw_json)
                
                for item in extracted:
                    target = StructuredTarget(
                        x=item.get("target_x"),
                        y=item.get("target_y"),
                        unit_id=item.get("target_unit_id")
                    )
                    commands.append(StructuredCommand(
                        action_type=item.get("action_type", "HOLD"),
                        unit_id=item.get("unit_id"),
                        target=target,
                        raw_input=f"ADVISOR_PLAN: {item.get('unit_id')} -> {item.get('action_type')}"
                    ))
        except Exception as e:
            log(f"BATCH EXTRACTION FAILED: {e}")
            # Fallback to single normalization
            commands.append(_normalize_command(payload.command, state))
    else:
        # 2. Standard Mode (Single Command)
        commands.append(_normalize_command(payload.command, state))

    # Validation and Execution
    valid_commands: List[StructuredCommand] = []
    for cmd in commands:
        val = _validate_command(state, cmd)
        if val["is_valid"]:
            norm = val["normalized_command"]
            valid_commands.append(StructuredCommand(
                action_type=norm["action_type"],
                unit_id=norm.get("unit_id"),
                target=StructuredTarget(**norm.get("target", {})),
                raw_input=norm.get("raw_input", cmd.raw_input),
            ))

    if not valid_commands:
        # If all failed or no command, default to HOLD for everything
        valid_commands.append(StructuredCommand(action_type="HOLD", raw_input="no_valid_commands"))

    rng = _seeded_random_for_state(state.turn)

    artifacts = _simulate_player_phase(state, valid_commands, rng)
    _simulate_enemy_phase(state, artifacts, rng)

    end = _check_end_conditions(state, payload.end_simulation)
    if end:
        state.ended = True
        state.winner = end[0]
        state.end_reason = end[1]
    else:
        state.turn += 1

    with ThreadPoolExecutor(max_workers=1) as exe:
        fut = exe.submit(
            _generate_narrative,
            valid_commands[0] if valid_commands else StructuredCommand(action_type="HOLD"),
            state,
            artifacts,
            payload.max_new_tokens,
            payload.temperature,
            payload.top_p,
        )
        narrative = fut.result()

    return {
        "updated_battlefield_state": state.dict(),
        "unit_movements": artifacts.movements,
        "combat_results": artifacts.combat_results,
        "objective_status": artifacts.objective_status,
        "enemy_actions": artifacts.enemy_actions,
        "casualties": artifacts.casualties,
        "simulation_results": artifacts.simulation_results,
        "normalized_command": (valid_commands[0].dict() if valid_commands else {}),
        "validation": {"is_valid": True, "reasons": []},
        "ai_narrative_output": narrative,
        "terminated": state.ended,
        "termination_reason": state.end_reason,
    }


@app.post("/api/initialize_scenario")
def initialize_scenario(payload: ScenarioInitializeRequest) -> Dict[str, Any]:
    state = _build_state_from_scenario(payload.scenario)
    return {
        "initialized": True,
        "scenario_title": payload.scenario.scenarioTitle,
        "briefing": payload.scenario.briefing,
        "updated_battlefield_state": state.dict(),
    }


@app.get("/api/default_state")
def default_state() -> Dict[str, Any]:
    return _default_state().dict()


@app.get("/")
def root():
    return {"message": "Wargame simulator backend running"}