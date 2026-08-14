import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
APP_DIR = BASE_DIR / "app"
DATA_DIR = APP_DIR / "data"
POSTS_DIR = DATA_DIR / "posts"
STATIC_DIR = APP_DIR / "static"
TEMPLATES_DIR = APP_DIR / "templates"
DIST_DIR = BASE_DIR / "dist"

SITE_TITLE = "Jacob Inwald | Software Engineer"
SITE_DESCRIPTION = "Personal website, technical portfolio, and blog of Jacob Inwald."
SITE_AUTHOR = "Jacob Inwald"
SITE_URL = os.getenv("SITE_URL", "https://jacobinwald.github.io")
