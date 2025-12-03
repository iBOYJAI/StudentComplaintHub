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
    admin_router,
    comments_router,
    polls_router
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

# Include routers (API routes must be registered first)
app.include_router(auth_router)
app.include_router(complaints_router)
app.include_router(users_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(comments_router)
app.include_router(polls_router)

# Serve static files (frontend) - mounted last so API routes take precedence
try:
    frontend_dir = settings.BASE_DIR.parent / "frontend"
    if frontend_dir.exists():
        # Mount static files, but exclude /api routes
        app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
except Exception as e:
    print(f"Note: Frontend static files not mounted: {e}")

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"Server: http://{settings.HOST}:{settings.PORT}")
    print(f"API Docs: http://{settings.HOST}:{settings.PORT}/api/docs")
    print()
    
    # Auto-detect and configure database
    try:
        from auto_detect_db import auto_configure_database, auto_initialize_database
        
        print("Auto-configuring database...")
        mysql_configured = auto_configure_database()
        
        if mysql_configured or not settings.USE_MYSQL:
            print()
            try:
                auto_initialize_database()
            except Exception as e:
                print(f"Warning: Auto-initialization failed: {e}")
                print("Initializing basic tables...")
                init_db()
                print("Database tables created")
        else:
            # Fallback to SQLite initialization
            init_db()
            print("Database initialized (SQLite)")
    except ImportError:
        # auto_detect_db not available, use basic init
        print("Auto-detection not available, using basic initialization...")
        init_db()
        print("Database initialized")
    except Exception as e:
        print(f"Warning: Auto-configuration failed: {e}")
        print("Falling back to basic initialization...")
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
