# to start service:

`uvicorn app:app --reload --host 0.0.0.0 --port 8000`

---

# to test service:
```
curl -X POST http://localhost:8000/recommendations \
-H "Content-Type: application/json" \
-d '[
{"film_id": 3997, "rating": 5},
{"film_id": 58826, "rating": 4},
{"film_id": 110102, "rating": 3}
]'
```