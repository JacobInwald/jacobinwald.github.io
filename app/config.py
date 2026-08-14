import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
APP_DIR = BASE_DIR / "app"
DATA_DIR = APP_DIR / "data"
POSTS_DIR = DATA_DIR / "posts"
STATIC_DIR = APP_DIR / "static"
TEMPLATES_DIR = APP_DIR / "templates"
DIST_DIR = BASE_DIR / "dist"

# Load .env if present
env_file = BASE_DIR / ".env"
if env_file.exists():
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip("'\""))

SITE_TITLE = "Jacob Inwald | Software Engineer"
SITE_DESCRIPTION = "Personal website, technical portfolio, and blog of Jacob Inwald."
SITE_AUTHOR = "Jacob Inwald"
SITE_URL = os.getenv("SITE_URL", "https://jacobinwald.github.io")

HARDCOVER_API_KEY = os.getenv("HARDCOVER_API_KEY", os.getenv("HARDCOVER_TOKEN", ""))
HARDCOVER_USERNAME = os.getenv("HARDCOVER_USERNAME", "JacobInwald")
