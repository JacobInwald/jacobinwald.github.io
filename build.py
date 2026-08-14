#!/usr/bin/env python3
"""
Static Site Generator (SSG) Build Script.
Renders FastAPI routes to static HTML/XML files in `dist/` for GitHub Pages publishing.
"""

import shutil
import sys

from fastapi.testclient import TestClient

from app.config import DIST_DIR, STATIC_DIR
from app.main import app
from app.utils import load_posts


def build_site() -> None:
    print("🚀 Starting build process...")

    # 1. Clean and recreate dist/ directory
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    client = TestClient(app)

    # 2. Define routes to render
    routes = [
        ("/", DIST_DIR / "index.html"),
        ("/projects", DIST_DIR / "projects" / "index.html"),
        ("/blog", DIST_DIR / "blog" / "index.html"),
        ("/experience", DIST_DIR / "experience" / "index.html"),
        ("/contact", DIST_DIR / "contact" / "index.html"),
        ("/sitemap.xml", DIST_DIR / "sitemap.xml"),
        ("/rss.xml", DIST_DIR / "rss.xml"),
    ]

    # Add dynamic blog post routes
    posts = load_posts()
    for post in posts:
        slug = post["slug"]
        routes.append((f"/blog/{slug}", DIST_DIR / "blog" / slug / "index.html"))

    # Render 404 page
    res = client.get("/non-existent-page")
    out_404 = DIST_DIR / "404.html"
    out_404.write_bytes(res.content)
    print("  [200] /404 -> 404.html")

    # 3. Render all routes
    for route, dest_path in routes:
        response = client.get(route)
        if response.status_code != 200:
            print(f"❌ Failed to render route {route}: Status {response.status_code}")
            sys.exit(1)

        dest_path.parent.mkdir(parents=True, exist_ok=True)
        dest_path.write_bytes(response.content)
        print(f"  [{response.status_code}] {route} -> {dest_path.relative_to(DIST_DIR)}")

    # 4. Copy static assets to dist/static
    dist_static = DIST_DIR / "static"
    if STATIC_DIR.exists():
        shutil.copytree(STATIC_DIR, dist_static)
        print(f"  [assets] Copied {STATIC_DIR} -> {dist_static}")

    # 5. Create .nojekyll for GitHub Pages
    nojekyll = DIST_DIR / ".nojekyll"
    nojekyll.touch()
    print("  [config] Created .nojekyll file for GitHub Pages")

    print("\n✅ Build completed successfully! Static output available in `dist/`.")


if __name__ == "__main__":
    build_site()
