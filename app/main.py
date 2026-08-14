from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from app import utils
from app.config import SITE_DESCRIPTION, SITE_URL, STATIC_DIR, TEMPLATES_DIR

app = FastAPI(
    title="Jacob Inwald Personal Website",
    description="Python Web Application powering jacobinwald.github.io",
    version="0.1.0",
)

# Mount static directory
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Templates
templates = Jinja2Templates(directory=TEMPLATES_DIR)


class ContactRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    profile = utils.load_profile()
    projects = utils.load_projects()
    featured_projects = [p for p in projects if p.get("featured")][:3]
    recent_posts = utils.load_posts()[:2]

    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "title": f"{profile.get('name', 'Jacob Inwald')} | Software Engineer",
            "description": SITE_DESCRIPTION,
            "profile": profile,
            "projects": featured_projects,
            "posts": recent_posts,
            "active_page": "home",
            "site_url": SITE_URL,
        },
    )


@app.get("/projects", response_class=HTMLResponse)
@app.get("/projects/", response_class=HTMLResponse)
async def projects_page(request: Request):
    profile = utils.load_profile()
    projects = utils.load_projects()

    categories = sorted(list({p.get("category", "Other") for p in projects}))
    all_tags = sorted(list({tag for p in projects for tag in p.get("tags", [])}))

    return templates.TemplateResponse(
        request=request,
        name="projects.html",
        context={
            "title": "Projects Showcase | Jacob Inwald",
            "description": (
                "Explore software engineering projects, web applications, "
                "and backend systems by Jacob Inwald."
            ),
            "profile": profile,
            "projects": projects,
            "categories": categories,
            "tags": all_tags,
            "active_page": "projects",
            "site_url": SITE_URL,
        },
    )


@app.get("/blog", response_class=HTMLResponse)
@app.get("/blog/", response_class=HTMLResponse)
async def blog_page(request: Request):
    profile = utils.load_profile()
    posts = utils.load_posts()
    all_tags = sorted(list({tag for p in posts for tag in p.get("tags", [])}))

    return templates.TemplateResponse(
        request=request,
        name="blog.html",
        context={
            "title": "Articles & Engineering Insights | Jacob Inwald",
            "description": (
                "Technical writeups, Python guides, and software "
                "engineering architecture posts by Jacob Inwald."
            ),
            "profile": profile,
            "posts": posts,
            "tags": all_tags,
            "active_page": "blog",
            "site_url": SITE_URL,
        },
    )


@app.get("/blog/{slug}", response_class=HTMLResponse)
@app.get("/blog/{slug}/", response_class=HTMLResponse)
async def post_detail(request: Request, slug: str):
    profile = utils.load_profile()
    post = utils.load_post_by_slug(slug)
    if not post:
        raise HTTPException(status_code=404, detail="Article not found")

    hardcover_stats = utils.fetch_hardcover_stats() if slug == "hardcover-reading-stats" else None

    return templates.TemplateResponse(
        request=request,
        name="post.html",
        context={
            "title": f"{post['title']} | Jacob Inwald",
            "description": post.get("summary", SITE_DESCRIPTION),
            "profile": profile,
            "post": post,
            "hardcover_stats": hardcover_stats,
            "active_page": "blog",
            "site_url": SITE_URL,
        },
    )


@app.get("/experience", response_class=HTMLResponse)
@app.get("/experience/", response_class=HTMLResponse)
async def experience_page(request: Request):
    profile = utils.load_profile()
    experience = utils.load_experience()

    return templates.TemplateResponse(
        request=request,
        name="experience.html",
        context={
            "title": "Career & Experience | Jacob Inwald",
            "description": (
                "Professional background, skills, software engineering "
                "experience, and timeline of Jacob Inwald."
            ),
            "profile": profile,
            "experience": experience,
            "active_page": "experience",
            "site_url": SITE_URL,
        },
    )


@app.get("/contact", response_class=HTMLResponse)
@app.get("/contact/", response_class=HTMLResponse)
async def contact_page(request: Request):
    profile = utils.load_profile()

    return templates.TemplateResponse(
        request=request,
        name="contact.html",
        context={
            "title": "Contact | Jacob Inwald",
            "description": (
                "Get in touch with Jacob Inwald for engineering opportunities, "
                "collaborations, or inquiries."
            ),
            "profile": profile,
            "active_page": "contact",
            "site_url": SITE_URL,
        },
    )


# API & Metadata Routes
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": "jacobinwald-site",
        "version": "0.1.0",
        "python": "3.11+",
    }


@app.get("/api/projects")
async def api_projects():
    return utils.load_projects()


@app.get("/api/posts")
async def api_posts():
    return utils.load_posts()


@app.post("/api/contact")
async def api_contact(payload: ContactRequest):
    return {
        "success": True,
        "message": f"Thank you {payload.name}, your message has been received!",
    }


@app.get("/sitemap.xml")
async def sitemap():
    xml_content = utils.generate_sitemap_xml()
    return Response(content=xml_content, media_type="application/xml")


@app.get("/rss.xml")
async def rss_feed():
    xml_content = utils.generate_rss_xml()
    return Response(content=xml_content, media_type="application/xml")


# Custom 404 handler
@app.exception_handler(404)
async def custom_404_handler(request: Request, exc: HTTPException):
    profile = utils.load_profile()
    return templates.TemplateResponse(
        request=request,
        name="404.html",
        context={
            "title": "Page Not Found | Jacob Inwald",
            "profile": profile,
            "active_page": "",
            "site_url": SITE_URL,
        },
        status_code=404,
    )
