import random


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
	return max(low, min(high, value))


def monte_carlo_rollout(state: dict, runs: int = 200) -> dict:
	"""Estimate expected success/risk after uncertainty over short horizon."""
	base_success = float(state.get("success", 0.5))
	base_risk = float(state.get("risk", 0.5))

	# Small random perturbations around current values to model tactical uncertainty.
	success_samples = []
	risk_samples = []
	for _ in range(max(1, runs)):
		success_samples.append(_clamp(base_success + random.uniform(-0.08, 0.08)))
		risk_samples.append(_clamp(base_risk + random.uniform(-0.08, 0.08)))

	expected_success = sum(success_samples) / len(success_samples)
	expected_risk = sum(risk_samples) / len(risk_samples)

	return {
		"expected_success": round(expected_success, 4),
		"expected_risk": round(expected_risk, 4),
	}
