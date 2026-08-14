# Jacob Inwald &mdash; Personal Website & Portfolio

![Multi-Stage Verification](https://github.com/JacobInwald/jacobinwald.github.io/actions/workflows/verification.yml/badge.svg)
![Build Status](https://github.com/JacobInwald/jacobinwald.github.io/actions/workflows/build.yml/badge.svg)
![Deploy Status](https://github.com/JacobInwald/jacobinwald.github.io/actions/workflows/deploy.yml/badge.svg)
![Python Version](https://img.shields.io/badge/python-3.11%2B-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)
![Package Manager](https://img.shields.io/badge/uv-Astral-purple.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A modern, high-performance **Python Web Application** powering [jacobinwald.github.io](https://jacobinwald.github.io). Built with **FastAPI**, **Jinja2**, and **uv**, featuring dual-runtime capability (live web app & static build target for GitHub Pages).

---

## 🌟 Key Features

- ⚡ **Modern Python Stack**: Built using FastAPI, Uvicorn, Jinja2 templates, and Pydantic models.
- 🚀 **`uv` Package Management**: Lightning-fast dependency resolution and deterministic virtual environments.
- 🔄 **Dual Deployment Architecture**:
  - **Dynamic Web Server**: Run as a containerized Python web application (`python run.py`).
  - **Static Site Generator (SSG)**: Render routes to static HTML/CSS/JS artifacts (`python build.py`) for hosting on GitHub Pages.
- 🎨 **Bespoke Design System**: Sleek glassmorphism UI, custom dark/light theme switcher, responsive layouts, and Google Fonts (Inter & Fira Code).
- 🏷️ **Dynamic Project Showcase**: Interactive filtering by tech category and live client-side search.
- 📝 **Markdown Blog Engine**: Render Markdown posts with frontmatter metadata, syntax styling, and tag filtering.
- ⏳ **Interactive Career Timeline**: Visual work experience & technical skills matrix.
- 📬 **Contact API Endpoint**: Async contact form handler with client validation.
- 📡 **Automated SEO & RSS**: Built-in dynamic generators for `sitemap.xml` and `rss.xml`.
- 🤖 **Multi-Stage CI & Manual Pipelines**: Staged GitHub Actions workflows for Ruff linting, MyPy type checking (allow failure), Pytest, static builds, and manual deployment.

---

## 🏗️ Repository Architecture

```text
jacobinwald.github.io/
├── app/
│   ├── config.py           # Paths, site metadata, environment variables
│   ├── main.py             # FastAPI app, API routes, template rendering
│   ├── utils.py            # JSON data loaders, Markdown parser, RSS & Sitemap
│   ├── data/
│   │   ├── profile.json    # Personal bio, skills matrix, social links, stats
│   │   ├── projects.json   # Projects gallery, tags, GitHub & demo links
│   │   ├── experience.json # Career history timeline & education
│   │   └── posts/          # Markdown blog posts with YAML frontmatter
│   ├── static/             # Vanilla CSS, JS scripts, images
│   └── templates/          # Jinja2 HTML layout templates (base, index, etc.)
├── tests/                  # Pytest test suite (route tests & SSG build verification)
├── .github/
│   └── workflows/
│       ├── verification.yml # Staged CI pipeline (Ruff, MyPy, Pytest, Build check)
│       ├── build.yml        # Dedicated static build & artifact pipeline
│       ├── deploy.yml       # Automated deployment to GitHub Pages
│       └── deploy-manual.yml# Manual trigger deployment (workflow_dispatch)
├── build.py                # Python Static Site Generator script
├── run.py                  # Dev server runner script
├── pyproject.toml          # uv package configuration & project metadata
├── Makefile                # Developer workflow commands
├── Dockerfile              # Production container specification
└── docker-compose.yml      # Container orchestration spec
```

---

## 🛠️ Makefile Commands

| Command | Action |
| :--- | :--- |
| `make install` | Sync virtual environment dependencies via `uv` |
| `make dev` | Start live development server (`http://127.0.0.1:8000`) |
| `make build` | Run static site generator script (`build.py`) |
| `make test` | Run test suite with pytest and code coverage |
| `make lint` | Check formatting and lint rules with Ruff |
| `make format` | Automatically fix and format code with Ruff |
| `make mypy` | Run static type checking with MyPy (allows non-zero exit) |
| `make verify` | Run full local verification pipeline (lint, mypy, test, build) |
| `make clean` | Clean up build artifacts and temporary files |
| `make docker-build` | Build Docker container image |

---

## ⚙️ Pipelines & Verification Stages

The repository includes four distinct GitHub Actions workflows:

1. **Multi-Stage Verification Pipeline (`verification.yml`)**:
   - **Stage 1**: Linting & Formatting Check with Ruff (`ruff check .` & `ruff format --check .`).
   - **Stage 2**: Static Type Checking with MyPy (`continue-on-error: true` - failure allowed).
   - **Stage 3**: Automated Unit Testing with Pytest and coverage.
   - **Stage 4**: Build Verification (`python build.py`).
2. **Build Pipeline (`build.yml`)**: Dedicated workflow to compile static site output and upload the `dist/` artifact.
3. **Automated Deploy (`deploy.yml`)**: Triggers on push to `main` to build and publish to GitHub Pages.
4. **Manual Deploy Pipeline (`deploy-manual.yml`)**: Triggers on demand via GitHub's `workflow_dispatch` button, allowing manual target environment selection and deployment to GitHub Pages.


---

## 🐳 Docker Support

To run the Python web app inside Docker:

```bash
# Build container image
docker build -t jacobinwald-site .

# Run container
docker run -p 8000:8000 jacobinwald-site
```

Or using `docker-compose`:

```bash
docker-compose up --build
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
