.PHONY: help install dev build test lint format clean docker-build docker-run

help:
	@echo "Available commands:"
	@echo "  make install      - Sync environment dependencies using uv"
	@echo "  make dev          - Run local FastAPI dev server with auto-reload"
	@echo "  make build        - Compile Python web app into static site in dist/"
	@echo "  make test         - Run test suite with pytest"
	@echo "  make lint         - Check code formatting & linting with ruff"
	@echo "  make format       - Format code using ruff"
	@echo "  make clean        - Remove build artifacts and cache"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run   - Run application in Docker container"

install:
	uv sync

dev:
	uv run python run.py

build:
	uv run python build.py

test:
	uv run pytest --cov=app

lint:
	uv run ruff check .

format:
	uv run ruff check --fix .
	uv run ruff format .

clean:
	rm -rf dist/ .pytest_cache .coverage htmlcov __pycache__ app/__pycache__ tests/__pycache__

docker-build:
	docker build -t jacobinwald-site .

docker-run:
	docker run -p 8000:8000 jacobinwald-site
