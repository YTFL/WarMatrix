import numpy as np
import random

from .probability import compute_success_probability
from .enemy_model import enemy_action
from .actions import ACTIONS
from .transition import apply_action, apply_enemy_action


def run_monte_carlo(state, n_sims: int = 400, steps: int = 6, seed: int = None):
    """
    Monte Carlo rollouts with optional deterministic `seed`.

    Returns both mean operational risk and failure probability (1 - expected_success).
    """
    # determinism: seed both python random and numpy random
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)

    successes = []
    risks = []

    for _ in range(n_sims):
        sim_state = state.copy()
        player_turn = True

        for _ in range(steps):
            if player_turn:
                # weighted player action sampling
                action = random.choices(
                    ACTIONS, weights=[0.25, 0.25, 0.35, 0.15]
                )[0]
                sim_state = apply_action(sim_state, action)
            else:
                enemy = enemy_action()
                sim_state = apply_enemy_action(sim_state, enemy)

            sim_state.success_probability = compute_success_probability(sim_state)
            player_turn = not player_turn

        successes.append(sim_state.success_probability)
        risks.append(sim_state.operational_risk)

    successes = np.array(successes)
    risks = np.array(risks)

    expected_success = float(successes.mean())
    expected_risk_operational = float(risks.mean())
    failure_probability = float(max(0.0, min(1.0, 1.0 - expected_success)))
    uncertainty = float(successes.std())

    return {
        "expected_success": expected_success,
        "expected_risk_operational": expected_risk_operational,
        "failure_probability": failure_probability,
        "uncertainty": uncertainty,
    }