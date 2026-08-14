# Jacob Inwald &mdash; Personal Website & Portfolio

![CI Pipeline](https://github.com/JacobInwald/jacobinwald.github.io/actions/workflows/ci.yml/badge.svg)
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
- 🎨 **Besproke Design System**: Sleek glassmorphism UI, custom dark/light theme switcher, responsive layouts, and Google Fonts (Inter & Fira Code).
- 🏷️ **Dynamic Project Showcase**: Interactive filtering by tech category and live client-side search.
- 📝 **Markdown Blog Engine**: Render Markdown posts with frontmatter metadata, syntax styling, and tag filtering.
- ⏳ **Interactive Career Timeline**: Visual work experience & technical skills matrix.
- 📬 **Contact API Endpoint**: Async contact form handler with client validation.
- 📡 **Automated SEO & RSS**: Built-in dynamic generators for `sitemap.xml` and `rss.xml`.
- 🤖 **Automated CI/CD Pipelines**: GitHub Actions workflows for linting, pytest suites, and GitHub Pages deployment.

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
│       ├── ci.yml          # CI workflow (Ruff linting, Pytest, build validation)
│       └── deploy.yml      # CD workflow (Builds & deploys dist/ to GitHub Pages)
├── build.py                # Python Static Site Generator script
├── run.py                  # Dev server runner script
├── pyproject.toml          # uv package configuration & project metadata
├── Makefile                # Developer workflow commands
├── Dockerfile              # Production container specification
└── docker-compose.yml      # Container orchestration spec
```

---

## 🚀 Quickstart Guide

### Prerequisites

Ensure you have Python 3.11+ and [`uv`](https://github.com/astral-sh/uv) installed:

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 1. Installation

Clone the repository and sync the virtual environment:

```bash
git clone https://github.com/JacobInwald/jacobinwald.github.io.git
cd jacobinwald.github.io

# Create virtualenv and install dependencies
uv sync
```

### 2. Run Local Development Server

Launch the live FastAPI server with auto-reload at `http://127.0.0.1:8000`:

```bash
uv run python run.py
# or using Makefile
make dev
```

### 3. Build Static Site (SSG)

Compile all Python web application routes into static HTML files inside `dist/`:

```bash
uv run python build.py
# or using Makefile
make build
```

### 4. Run Tests & Linter

Execute the test suite and code quality checks:

```bash
# Run pytest with code coverage
uv run pytest

# Check linting with Ruff
uv run ruff check .

# Or run all checks via Makefile
make test
make lint
```

---

## 🛠️ Makefile Shortcuts

For convenience, a `Makefile` is included with standard task targets:

| Command | Action |
| :--- | :--- |
| `make install` | Sync virtual environment dependencies via `uv` |
| `make dev` | Start live development server (`http://127.0.0.1:8000`) |
| `make build` | Run static site generator script (`build.py`) |
| `make test` | Run test suite with pytest and code coverage |
| `make lint` | Check formatting and lint rules with Ruff |
| `make format` | Automatically fix and format code with Ruff |
| `make clean` | Clean up build artifacts and temporary files |
| `make docker-build` | Build Docker container image |

---

## 📝 Managing Content

Updating content on the site is simple and code-free:

1. **Profile & Bio**: Edit `app/data/profile.json` to update skills, social links, and stats.
2. **Projects**: Edit `app/data/projects.json` to add or update showcase projects.
3. **Career Timeline**: Edit `app/data/experience.json` to update work history.
4. **Blog Posts**: Create a `.md` file in `app/data/posts/` with YAML frontmatter:

```markdown
---
title: My New Blog Post
date: 2026-08-14
summary: A brief description of the post.
tags: [Python, Web, Architecture]
read_time: 4 min read
---

## Article Heading

Your markdown content goes here...
```

---

## 🚢 CI/CD Pipelines

- **CI Pipeline (`.github/workflows/ci.yml`)**: Runs on every pull request and push. Installs dependencies using `uv`, executes `ruff check`, runs `pytest`, and validates `python build.py`.
- **Deployment Pipeline (`.github/workflows/deploy.yml`)**: Triggers on push to `main`. Executes `python build.py` to compile the static site and deploys `dist/` directly to GitHub Pages via official GitHub Actions.

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
