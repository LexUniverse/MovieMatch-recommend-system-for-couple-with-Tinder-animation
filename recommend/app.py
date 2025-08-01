from fastapi import FastAPI, Body
from pydantic import BaseModel
from typing import List
from model_service import RecommenderService
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Recommendation Microservice")

service = RecommenderService(
    model_path="model/lightfm_rectools_model.pth",
    movies_csv="data/movies_with_russian_title.csv",
    mappings_dir="model"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # или укажи конкретные домены ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],  # или ["GET", "POST"]
    allow_headers=["*"],
)

class Preference(BaseModel):
    film_id: int
    rating: float

class Recommendation(BaseModel):
    film_id: int
    title_en: str
    title_ru: str
    genres: str
    year: int
    predicted_rating: float

class CombinedRecommendation(BaseModel):
    film_id: int
    title_en: str
    title_ru: str
    genres: str
    year: int
    predicted_rating: float

@app.post("/recommendations", response_model=List[Recommendation])
async def get_recommendations(preferences: List[Preference] = Body(...)):
    return service.recommend([p.dict() for p in preferences])

@app.post("/recommendations/two_users", response_model=List[CombinedRecommendation])
async def get_recommendations_two_users(
    user1: List[Preference], user2: List[Preference]
):
    return service.recommend_for_two_users(
        [p.dict() for p in user1],
        [p.dict() for p in user2]
    )

@app.post("/recommendations/popular", response_model=List[Recommendation])
async def get_random_popular(watched: list[dict] = Body(default=[])):
    return service.get_random_popular(watched=watched)