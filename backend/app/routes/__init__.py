from .auth import router as auth_router
from .complaints import router as complaints_router
from .users import router as users_router
from .dashboard import router as dashboard_router
from .admin import router as admin_router
from .comments import router as comments_router
from .polls import router as polls_router

__all__ = [
    "auth_router",
    "complaints_router",
    "users_router",
    "dashboard_router",
    "admin_router",
    "comments_router",
    "polls_router"
]
