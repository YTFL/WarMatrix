def apply_action(state, action):

    if action == "RECON":

        state["success"] += 0.03
        state["risk"] -= 0.02

    elif action == "ARTILLERY":

        state["fires"] -= 0.1
        state["supply"] -= 0.05
        state["risk"] += 0.04

    elif action == "ADVANCE":

        state["mobility"] -= 0.05
        state["risk"] += 0.08
        state["success"] += 0.06

    return state