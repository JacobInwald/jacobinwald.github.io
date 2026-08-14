#!/usr/bin/env python3
"""
Development Server Runner Script.
Launches Uvicorn dev server for the FastAPI Python web app with auto-reload enabled.
"""

import uvicorn

if __name__ == "__main__":
    print("🌐 Starting FastAPI development server at http://127.0.0.1:8000 ...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
