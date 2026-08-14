from app.config import DIST_DIR
from build import build_site


def test_build_script(tmp_path):
    build_site()
    assert DIST_DIR.exists()
    assert (DIST_DIR / "index.html").exists()
    assert (DIST_DIR / "projects" / "index.html").exists()
    assert (DIST_DIR / "blog" / "index.html").exists()
    assert (DIST_DIR / "experience" / "index.html").exists()
    assert (DIST_DIR / "contact" / "index.html").exists()
    assert (DIST_DIR / "404.html").exists()
    assert (DIST_DIR / "sitemap.xml").exists()
    assert (DIST_DIR / "rss.xml").exists()
    assert (DIST_DIR / ".nojekyll").exists()
    assert (DIST_DIR / "static" / "css" / "main.css").exists()
