from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_home_page():
    response = client.get("/")
    assert response.status_code == 200
    assert "Jacob Inwald" in response.text
    assert "Software Engineer" in response.text


def test_projects_page():
    response = client.get("/projects")
    assert response.status_code == 200
    assert "Projects Showcase" in response.text
    has_title = (
        "Personal Website &amp; Blog Engine" in response.text
        or "Personal Website & Blog Engine" in response.text
    )
    assert has_title


def test_blog_page():
    response = client.get("/blog")
    assert response.status_code == 200
    has_title = (
        "Technical Blog &amp; Articles" in response.text
        or "Technical Blog & Articles" in response.text
    )
    assert has_title
    assert "Welcome to My New Python-Powered Website" in response.text


def test_post_detail_page():
    response = client.get("/blog/welcome-to-my-site")
    assert response.status_code == 200
    assert "Welcome to My New Python-Powered Website" in response.text


def test_experience_page():
    response = client.get("/experience")
    assert response.status_code == 200
    assert "Career &amp; Experience" in response.text or "Career & Experience" in response.text


def test_contact_page():
    response = client.get("/contact")
    assert response.status_code == 200
    assert "Get in Touch" in response.text


def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "jacobinwald-site"


def test_api_contact():
    payload = {
        "name": "Alex",
        "email": "alex@example.com",
        "subject": "Inquiry",
        "message": "Hello Jacob!",
    }
    response = client.post("/api/contact", json=payload)
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_sitemap_xml():
    response = client.get("/sitemap.xml")
    assert response.status_code == 200
    assert "urlset" in response.text


def test_rss_xml():
    response = client.get("/rss.xml")
    assert response.status_code == 200
    assert "<rss" in response.text


def test_404_handler():
    response = client.get("/some-non-existent-route")
    assert response.status_code == 404
    assert "Page Not Found" in response.text
