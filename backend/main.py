from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import init_db
from app.config import settings
from app.routes import (
    auth_router,
    complaints_router,
    users_router,
    dashboard_router,
    admin_router
)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Offline Student Complaint & Resolution Hub",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware (allow all for local development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(complaints_router)
app.include_router(users_router)
app.include_router(dashboard_router)
app.include_router(admin_router)

# Serve static files (frontend)
try:
    app.mount("/static", StaticFiles(directory=str(settings.BASE_DIR / "frontend" / "build")), name="static")
except:
    pass  # Frontend may not be built yet

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"Server: http://{settings.HOST}:{settings.PORT}")
    print(f"API Docs: http://{settings.HOST}:{settings.PORT}/api/docs")
    init_db()
    print("Database initialized")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/api/docs"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
