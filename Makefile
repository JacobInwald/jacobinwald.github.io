.PHONY: help install dev build test lint format mypy verify clean docker-build docker-run

help:
	@echo "Available commands:"
	@echo "  make install      - Sync environment dependencies using uv"
	@echo "  make dev          - Run local FastAPI dev server with auto-reload"
	@echo "  make build        - Compile Python web app into static site in dist/"
	@echo "  make test         - Run test suite with pytest"
	@echo "  make lint         - Check code formatting & linting with ruff"
	@echo "  make format       - Format and auto-fix code using ruff"
	@echo "  make mypy         - Run static type checking with mypy"
	@echo "  make verify       - Run full verification pipeline (lint, mypy, test, build)"
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
	uv run ruff format --check .

format:
	uv run ruff check --fix .
	uv run ruff format .

mypy:
	-uv run mypy app build.py run.py

verify: lint mypy test build

clean:
	rm -rf dist/ .pytest_cache .coverage htmlcov .mypy_cache __pycache__ app/__pycache__ tests/__pycache__

docker-build:
	docker build -t jacobinwald-site .

docker-run:
	docker run -p 8000:8000 jacobinwald-site
