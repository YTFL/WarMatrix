from typing import Optional

from .game_state import GameState


def strategic_override(state: GameState) -> Optional[str]:
    """Simple strategic rule layer that can recommend an override action.

    Rules (example):
    - If operational risk is very high -> DEFEND
    - If morale is very low -> RECON
    - If force_ratio is strong and morale good -> ADVANCE
    - Otherwise return None (no override)
    """
    try:
        r = float(state.operational_risk)
        m = float(state.morale)
        fr = float(state.force_ratio)
    except Exception:
        return None

    if r >= 0.85:
        return "DEFEND"
    if m <= 0.35:
        return "RECON"
    if fr >= 0.85 and m >= 0.6:
        return "ADVANCE"
    return None
