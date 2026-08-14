---
title: Welcome to My New Python-Powered Website
date: 2026-08-14
summary: An overview of why and how I built my personal website as a modern Python web application with FastAPI, Jinja2, uv, and GitHub Actions.
tags: [Python, FastAPI, Architecture, Web Development]
read_time: 3 min read
---

Welcome to my updated personal website! I decided to rebuild my site from scratch as a clean, high-performance **Python Web Application**.

## Why Python & FastAPI?

While many personal portfolios use static JavaScript frameworks, I wanted a developer platform that represents my core passion: **Python engineering**.

Here are the key pillars of this architecture:

1. **FastAPI & Uvicorn Backend**: Provides ultra-fast API endpoints, server-rendered Jinja2 templates, and type safety.
2. **`uv` Package Management**: Next-generation Python package management by Astral that provides lighting-fast environment setups and deterministic builds.
3. **Static Generation & Dual Runtime**: The app can run live as a dynamic web application or build into static HTML/CSS/JS artifacts via a custom Python builder script for GitHub Pages.
4. **Automated CI/CD**: Seamless GitHub Actions workflows that automatically test, lint, build, and deploy the application upon pushing to `main`.

```python
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates

app = FastAPI(title="Jacob Inwald Website")
templates = Jinja2Templates(directory="app/templates")

@app.get("/")
async def homepage(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
```

## What's Next?

I'll be sharing articles here covering Python engineering, web architecture, DevOps automation, and system performance optimizations.

Thank you for visiting! Feel free to check out the [Projects](/projects) showcase or connect on [GitHub](https://github.com/JacobInwald).
