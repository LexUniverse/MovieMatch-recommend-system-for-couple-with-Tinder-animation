.PHONY: all backend frontend roomrt recommend poster

all: backend frontend roomrt recommend poster

backend:
	start cmd /k "cd backend && yarn dev"

frontend:
	start cmd /k "cd frontend && yarn dev"

roomrt:
	start cmd /k "cd roomRTservice && yarn start"

recommend:
	start cmd /k "cd recommend && uvicorn app:app --reload"

poster:
	start cmd /k "cd poster_service && python image_proxy.py"
