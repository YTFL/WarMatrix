from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

from procedural_generation.generators.urban import UrbanEnvironmentGenerator
from procedural_generation.models.urban import UrbanMapResponse

router = APIRouter()

class GenerateRequest(BaseModel):
    seed: int
    size: str = "Medium"

@router.post("/urban/generate", response_model=UrbanMapResponse)
def generate_urban_map(payload: GenerateRequest):
    """
    Generate a deterministic seed-based procedural urban simulation map.
    """
    if payload.size not in ("Small", "Medium", "Large"):
        raise HTTPException(status_code=400, detail="Invalid size parameter. Must be 'Small', 'Medium', or 'Large'")
    try:
        generator = UrbanEnvironmentGenerator(seed=payload.seed, size=payload.size)
        return generator.generate()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(exc)}")

@router.post("/urban/preview")
def preview_urban_map(payload: GenerateRequest) -> Dict[str, Any]:
    """
    Generate a lightweight preview structure containing sizes, bounds, and layout configurations.
    """
    if payload.size not in ("Small", "Medium", "Large"):
        raise HTTPException(status_code=400, detail="Invalid size parameter")
    try:
        generator = UrbanEnvironmentGenerator(seed=payload.seed, size=payload.size)
        result = generator.generate()
        return {
            "seed": result.seed,
            "size": result.size,
            "grid_size": result.grid_size,
            "city_bounds": result.city_bounds,
            "num_roads": len(result.roads),
            "num_buildings": len(result.buildings),
            "num_infrastructure": len(result.infrastructure),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(exc)}")

@router.get("/urban/{seed}", response_model=UrbanMapResponse)
def get_urban_map_by_seed(seed: int, size: str = "Medium"):
    """
    Get map layout directly by seed value (defaults to Medium size).
    """
    if size not in ("Small", "Medium", "Large"):
        raise HTTPException(status_code=400, detail="Invalid size parameter")
    try:
        generator = UrbanEnvironmentGenerator(seed=seed, size=size)
        return generator.generate()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {str(exc)}")
