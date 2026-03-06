from pydantic import BaseModel


class GameState(BaseModel):

    morale: float
    supply: float
    risk: float
    success: float

    mobility: float
    comms: float
    fires: float

    force_ratio: float