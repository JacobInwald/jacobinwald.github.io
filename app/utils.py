import json
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from typing import Any

import markdown
import yaml

from app.config import DATA_DIR, POSTS_DIR, SITE_DESCRIPTION, SITE_TITLE, SITE_URL


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
