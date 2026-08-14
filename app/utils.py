import json
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from typing import Any

import markdown
import yaml

from app.config import (
    DATA_DIR,
    HARDCOVER_API_KEY,
    HARDCOVER_USERNAME,
    POSTS_DIR,
    SITE_DESCRIPTION,
    SITE_TITLE,
    SITE_URL,
)

# Global in-memory cache for Hardcover GraphQL stats
_HARDCOVER_CACHE: dict[str, Any] | None = None
_HARDCOVER_CACHE_TIME: float = 0.0
_CACHE_TTL_SECONDS: float = 600.0  # 10 minutes cache TTL


def load_json(file_path: Path) -> Any:
    if not file_path.exists():
        return [] if "projects" in file_path.name or "experience" in file_path.name else {}
    with open(file_path, encoding="utf-8") as f:
        return json.load(f)


def load_profile() -> dict[str, Any]:
    data = load_json(DATA_DIR / "profile.json")
    return data if isinstance(data, dict) else {}


def load_projects() -> list[dict[str, Any]]:
    data = load_json(DATA_DIR / "projects.json")
    return data if isinstance(data, list) else []


def load_experience() -> list[dict[str, Any]]:
    data = load_json(DATA_DIR / "experience.json")
    return data if isinstance(data, list) else []


def fetch_hardcover_stats() -> dict[str, Any]:
    """Fetch live reading stats from Hardcover.app GraphQL API with 10-minute in-memory caching."""
    global _HARDCOVER_CACHE, _HARDCOVER_CACHE_TIME

    now = time.time()

    # 1. Return cached stats instantly if still valid (< 10 minutes)
    if _HARDCOVER_CACHE is not None and (now - _HARDCOVER_CACHE_TIME) < _CACHE_TTL_SECONDS:
        return _HARDCOVER_CACHE

    token = (HARDCOVER_API_KEY or "").strip()
    if token.lower().startswith("bearer "):
        token = token[7:].strip()

    fallback_stats = {
        "api_configured": bool(token),
        "username": HARDCOVER_USERNAME,
        "status_notice": "Cached library snapshot",
        "books_read_count": 28,
        "pages_read_count": 12450,
        "avg_rating": "4.1",
        "currently_reading": [{"title": "Words Are My Matter", "pages": 316}],
        "recent_reads": [
            {"title": "Piranesi", "pages": 245, "rating": "4.0"},
            {"title": "The Left Hand of Darkness", "pages": 304, "rating": "4.5"},
            {"title": "Jonathan Strange & Mr Norrell", "pages": 1006, "rating": "4.0"},
            {"title": "Brisingr", "pages": 790, "rating": "5.0"},
            {"title": "The Strength of the Few", "pages": 723, "rating": "3.5"},
        ],
    }

    if not token:
        _HARDCOVER_CACHE = fallback_stats
        _HARDCOVER_CACHE_TIME = now
        return fallback_stats

    try:
        url = "https://api.hardcover.app/v1/graphql"
        query = """
        query GetMyReadingData {
          me {
            id
            username
            name
          }
          user_books(order_by: {updated_at: desc}) {
            status_id
            rating
            book {
              title
              pages
            }
          }
        }
        """
        payload = json.dumps({"query": query}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
                "User-Agent": "FastAPI-Hardcover-Client/1.0",
            },
            method="POST",
        )
        # Tight 1.8s timeout so page loading never hangs on slow network
        with urllib.request.urlopen(req, timeout=1.8) as response:
            if response.status == 200:
                res_data = json.loads(response.read().decode("utf-8"))
                me = res_data.get("data", {}).get("me", [{}])
                user_name = HARDCOVER_USERNAME
                if me and isinstance(me, list) and len(me) > 0 and isinstance(me[0], dict):
                    user_name = me[0].get("username", HARDCOVER_USERNAME)

                user_books = res_data.get("data", {}).get("user_books", [])

                if isinstance(user_books, list) and len(user_books) > 0:
                    books_read = [
                        b for b in user_books if isinstance(b, dict) and b.get("status_id") == 3
                    ]
                    currently_reading = [
                        b for b in user_books if isinstance(b, dict) and b.get("status_id") == 2
                    ]

                    pages = 0
                    ratings: list[float] = []
                    for b in books_read:
                        b_book = b.get("book")
                        if isinstance(b_book, dict):
                            pgs = b_book.get("pages")
                            if isinstance(pgs, int):
                                pages += pgs
                        rtg = b.get("rating")
                        if isinstance(rtg, (int, float)):
                            ratings.append(float(rtg))

                    avg_rating = str(round(sum(ratings) / len(ratings), 1)) if ratings else "4.1"

                    formatted_reading: list[dict[str, Any]] = []
                    for item in currently_reading:
                        raw_book = item.get("book") if isinstance(item, dict) else None
                        book_dict = raw_book if isinstance(raw_book, dict) else {}
                        formatted_reading.append(
                            {
                                "title": book_dict.get("title", "Unknown Title"),
                                "pages": book_dict.get("pages", 0),
                            }
                        )

                    formatted_reads: list[dict[str, Any]] = []
                    for item in books_read[:6]:
                        raw_book = item.get("book") if isinstance(item, dict) else None
                        book_dict = raw_book if isinstance(raw_book, dict) else {}
                        rtg_val = item.get("rating") if isinstance(item, dict) else None
                        formatted_reads.append(
                            {
                                "title": book_dict.get("title", "Unknown Title"),
                                "pages": book_dict.get("pages", 0),
                                "rating": str(rtg_val) if rtg_val is not None else "N/A",
                            }
                        )

                    result = {
                        "api_configured": True,
                        "username": user_name or HARDCOVER_USERNAME,
                        "books_read_count": len(books_read),
                        "pages_read_count": pages,
                        "avg_rating": avg_rating,
                        "currently_reading": (
                            formatted_reading or fallback_stats["currently_reading"]
                        ),
                        "recent_reads": (formatted_reads or fallback_stats["recent_reads"]),
                        "status_notice": f"Live synced directly from Hardcover API (@{user_name})",
                    }
                    _HARDCOVER_CACHE = result
                    _HARDCOVER_CACHE_TIME = now
                    return result
    except Exception as err:
        fallback_stats["status_notice"] = f"Using cached snapshot ({err})"

    _HARDCOVER_CACHE = fallback_stats
    _HARDCOVER_CACHE_TIME = now
    return fallback_stats


def parse_post_file(post_path: Path) -> dict[str, Any] | None:
    if not post_path.exists():
        return None

    content = post_path.read_text(encoding="utf-8")
    slug = post_path.stem

    # Split YAML frontmatter if present
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            metadata = yaml.safe_load(parts[1]) or {}
            raw_markdown = parts[2]
        else:
            metadata = {}
            raw_markdown = content
    else:
        metadata = {}
        raw_markdown = content

    html_content = markdown.markdown(
        raw_markdown,
        extensions=["fenced_code", "tables", "toc", "codehilite"],
    )

    date_val = metadata.get("date", "")
    date_str = date_val.strftime("%Y-%m-%d") if isinstance(date_val, datetime) else str(date_val)

    return {
        "slug": slug,
        "title": metadata.get("title", slug.replace("-", " ").title()),
        "date": date_str,
        "summary": metadata.get("summary", ""),
        "tags": metadata.get("tags", []),
        "read_time": metadata.get("read_time", "3 min read"),
        "content_html": html_content,
        "raw_markdown": raw_markdown,
    }


def load_posts() -> list[dict[str, Any]]:
    if not POSTS_DIR.exists():
        return []

    posts = []
    for file_path in POSTS_DIR.glob("*.md"):
        post = parse_post_file(file_path)
        if post:
            posts.append(post)

    # Sort by date descending
    posts.sort(key=lambda x: x.get("date", ""), reverse=True)
    return posts


def load_post_by_slug(slug: str) -> dict[str, Any] | None:
    post_path = POSTS_DIR / f"{slug}.md"
    return parse_post_file(post_path)


def generate_sitemap_xml() -> str:
    urlset = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

    routes = ["/", "/projects", "/blog", "/experience", "/contact"]
    for route in routes:
        url_elem = ET.SubElement(urlset, "url")
        loc = ET.SubElement(url_elem, "loc")
        loc.text = f"{SITE_URL.rstrip('/')}{route}"
        changefreq = ET.SubElement(url_elem, "changefreq")
        changefreq.text = "weekly"
        priority = ET.SubElement(url_elem, "priority")
        priority.text = "1.0" if route == "/" else "0.8"

    for post in load_posts():
        url_elem = ET.SubElement(urlset, "url")
        loc = ET.SubElement(url_elem, "loc")
        loc.text = f"{SITE_URL.rstrip('/')}/blog/{post['slug']}"
        changefreq = ET.SubElement(url_elem, "changefreq")
        changefreq.text = "monthly"
        priority = ET.SubElement(url_elem, "priority")
        priority.text = "0.7"

    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(urlset, encoding="unicode")


def generate_rss_xml() -> str:
    rss = ET.Element("rss", version="2.0")
    channel = ET.SubElement(rss, "channel")

    title = ET.SubElement(channel, "title")
    title.text = SITE_TITLE
    link = ET.SubElement(channel, "link")
    link.text = SITE_URL
    description = ET.SubElement(channel, "description")
    description.text = SITE_DESCRIPTION

    for post in load_posts():
        item = ET.SubElement(channel, "item")
        item_title = ET.SubElement(item, "title")
        item_title.text = post["title"]
        item_link = ET.SubElement(item, "link")
        item_link.text = f"{SITE_URL.rstrip('/')}/blog/{post['slug']}"
        item_desc = ET.SubElement(item, "description")
        item_desc.text = post["summary"]
        item_guid = ET.SubElement(item, "guid")
        item_guid.text = f"{SITE_URL.rstrip('/')}/blog/{post['slug']}"

    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(rss, encoding="unicode")
