from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict

from engine.game_state import GameState, update_state
from engine.transition import apply_action
from engine.monte_carlo import run_monte_carlo
from engine.mcts import run_mcts
from engine.strategy import strategic_override

router = APIRouter()


class SimulationRequest(BaseModel):
    action: str
    state: GameState
    n_sims: int = 400
    steps: int = 6
    mcts_iterations: int = 400
    seed: int | None = None


@router.post("/simulate_turn")
def simulate_turn(payload: SimulationRequest) -> Dict[str, Any]:
    action = payload.action
    state: GameState = payload.state

    # Apply player action to the client-provided state
    updated_state = apply_action(state, action)

    # Run Monte Carlo simulation from the updated client state
    sim = run_monte_carlo(updated_state, n_sims=payload.n_sims, steps=payload.steps, seed=payload.seed)

    # Strategic rule layer may override MCTS
    override = strategic_override(updated_state)
    if override:
        best_action = override
    else:
        best_action = run_mcts(updated_state, iterations=payload.mcts_iterations, seed=payload.seed)

    # Update selected fields with simulation outputs
    # prefer failure_probability and operational risk both returned
    updated_state.success_probability = sim.get("expected_success", updated_state.success_probability)
    # map operational risk if present
    if "expected_risk_operational" in sim:
        updated_state.operational_risk = sim["expected_risk_operational"]
    elif "expected_risk" in sim:
        updated_state.operational_risk = sim["expected_risk"]

    # Optionally persist this updated state on the server
    try:
        update_state(updated_state)
    except Exception:
        pass

    # Round numeric outputs for clarity
    state_dict = updated_state.as_dict()
    for k, v in state_dict.items():
        if isinstance(v, float):
            state_dict[k] = round(v, 3)

    sim_out = {}
    if "expected_success" in sim:
        sim_out["expected_success"] = round(sim["expected_success"], 3)
    if "failure_probability" in sim:
        sim_out["failure_probability"] = round(sim["failure_probability"], 3)
    if "expected_risk_operational" in sim:
        sim_out["expected_risk_operational"] = round(sim["expected_risk_operational"], 3)
    if "uncertainty" in sim:
        sim_out["uncertainty"] = round(sim["uncertainty"], 3)

    return {
        "state": state_dict,
        "simulation": sim_out,
        "recommended_next_action": best_action,
    }