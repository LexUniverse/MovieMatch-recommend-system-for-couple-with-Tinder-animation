from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

from model_service import RecommenderService

app = FastAPI(title="Recommendation Microservice")

service = RecommenderService(
    model_path="nmf_model.pkl",
    movies_csv="movies.csv"
)

class Preference(BaseModel):
    film_id: int
    rating: float

class Recommendation(BaseModel):
    film_id: int
    title: str
    year: int
    predicted_rating: float

class CombinedRecommendation(BaseModel):
    film_id: int
    title: str
    sum_rating: float
    avg_rating: float
    min_rating: float
    rating_user1: float
    rating_user2: float

@app.post("/recommendations", response_model=List[Recommendation])
async def get_recommendations(user_preferences: List[Preference]):
    return service.recommend([pref.dict() for pref in user_preferences])

@app.post("/recommendations/two_users", response_model=List[CombinedRecommendation])
async def get_recommendations_two_users(
    user1_preferences: List[Preference],
    user2_preferences: List[Preference]
):
    recs = service.recommend_for_two_users(
        [pref.dict() for pref in user1_preferences],
        [pref.dict() for pref in user2_preferences],
        min_year=2010,
        top_k=20
    )
    # Добавляем год в ответ (если нужно, можно убрать)
    for rec in recs:
        film_id = rec["film_id"]
        rec["year"] = service.id_to_year.get(film_id, None)
    return recs
