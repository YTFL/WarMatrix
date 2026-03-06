from fastapi import APIRouter
from engine.monte_carlo import monte_carlo_rollout
from engine.transition import apply_action

router = APIRouter()


@router.post("/simulate")
def simulate_turn(payload: dict):

    state = payload["state"]
    action = payload["action"]

    new_state = apply_action(state, action)

    mc_result = monte_carlo_rollout(new_state)

    new_state["success"] = mc_result["expected_success"]
    new_state["risk"] = mc_result["expected_risk"]

    return {
        "state": new_state,
        "analysis_input": new_state
    }