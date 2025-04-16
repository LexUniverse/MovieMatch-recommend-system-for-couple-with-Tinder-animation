from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

from model_service import RecommenderService

app = FastAPI(title="Recommendation Microservice")

# Загрузка модели
service = RecommenderService(
    model_path="nmf_model.pkl",
    movies_csv="movies.csv"
)

# Модель входящих данных
class Preference(BaseModel):
    film_id: int
    rating: float

class Recommendation(BaseModel):
    film_id: int
    title: str
    year: int
    predicted_rating: float

@app.post("/recommendations", response_model=List[Recommendation])
async def get_recommendations(user_preferences: List[Preference]):
    return service.recommend([pref.dict() for pref in user_preferences])
