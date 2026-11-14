from pydantic import BaseModel, Field, ConfigDict


class ManualHealthInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    astronaut_id: str = Field(min_length=1, max_length=50)

    heart_rate: float = Field(gt=0, le=250)
    spo2: float = Field(gt=0, le=100)

    systolic_bp: float = Field(gt=0, le=300)
    diastolic_bp: float = Field(gt=0, le=200)

    body_temperature: float = Field(gt=25, lt=45)
    respiration_rate: float = Field(gt=0, le=80)

    hrv_rmssd: float = Field(ge=0, le=300)
