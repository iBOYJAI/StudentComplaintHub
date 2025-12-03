# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands and workflows

### Environment setup
- Create and activate a virtual environment (recommended) and install backend dependencies:
  - PowerShell (from repo root):
    - `cd backend`
    - `pip install -r requirements.txt`

### Running the backend (development)
- Default (uses auto DB detection + FastAPI app):
  - From repo root (recommended for offline scripts and paths):
    - `cd backend`
    - `python main.py`
- The app will start at `http://127.0.0.1:8000` with API docs at `http://127.0.0.1:8000/api/docs`.
- The FastAPI app instance is `app` in `backend/main.py`; when needed you can also run via uvicorn directly:
  - `cd backend`
  - `uvicorn main:app --reload --host 127.0.0.1 --port 8000`

### Database initialization and selection
The backend supports both SQLite and MySQL; which one is used is controlled by `USE_MYSQL` in `backend/app/config.py` and by the auto-detection logic.

**SQLite (simplest, no external DB):**
- Ensure `USE_MYSQL` is `False` in `backend/app/config.py` if you want to force SQLite.
- Initialize (or reinitialize) the SQLite DB:
  - `cd backend`
  - `python init_db.py`

**MySQL (XAMPP or standard server):**
- Configure credentials in `backend/app/config.py` (see comments there and docs under `docs/MYSQL_SETUP.md`, `docs/XAMPP_SETUP.md`, and `docs/MYSQL_PRODUCTION_SETUP.md`).
- Initialize schema and seed data for MySQL:
  - `cd backend`
  - `python init_db_mysql.py`

**Auto-detect mode / offline launcher:**
- To let the app detect MySQL/XAMPP and fall back to SQLite automatically:
  - `cd backend`
  - `python auto_detect_db.py`
  - `python main.py`
- Or from repo root, use the offline startup scripts (wrap the above plus additional checks):
  - Windows: `start_offline.bat`
  - Linux/macOS: `./start_offline.sh`

### Testing
- The backend includes `pytest` and `pytest-asyncio` in `backend/requirements.txt`, but there is currently no `tests/` directory. Once tests are added, run them from `backend/`:
  - All tests: `cd backend && pytest`
  - Single test file: `cd backend && pytest path/to/test_file.py`
  - Single test function: `cd backend && pytest path/to/test_file.py -k "test_name"`

### Database maintenance helpers
- Recreate SQLite database (drops existing DB file, as implemented in init script):
  - `cd backend`
  - `python init_db.py`
- Direct SQLite CLI access (when using SQLite and `database/complaints.db` exists):
  - From repo root: `sqlite3 database/complaints.db`

### Packaging (Windows executable)
- To build a single-file Windows executable for distribution (as per README):
  - From `backend/` (ensure PyInstaller is installed):
    - `pip install pyinstaller`
    - `pyinstaller --onefile --add-data "frontend;frontend" --add-data "database;database" main.py`

## High-level architecture

### Overall system
- **Goal:** Offline-first complaint and resolution hub for educational institutions, with role-based access, SLA tracking, dashboards, and an Instagram-like engagement layer.
- **Top-level split:**
  - `backend/` – FastAPI + SQLAlchemy backend, including DB initialization scripts and auto-detection of MySQL/XAMPP vs SQLite.
  - `frontend/` – Vanilla HTML/CSS/JS single-page app with PWA support and IndexedDB-based offline storage.
  - `docs/` – Operational documentation (Quickstart, MySQL/XAMPP setup, offline mode, admin manual, production MySQL), which you should consult before changing DB or deployment behavior.

### Backend architecture (FastAPI + SQLAlchemy)

**Entry point and app wiring (`backend/main.py`):**
- Creates the FastAPI app with custom title/version/docs URLs from `app.config.Settings`.
- Adds permissive CORS for local development.
- Imports and mounts all API routers via `app.routes.__init__`:
  - `auth_router` → `/api/auth` (registration, login, PIN login, current user info).
  - `complaints_router` → `/api/complaints` (full complaint lifecycle, attachments, votes, likes, comments, polls shortcut).
  - `users_router` → `/api/users` (user CRUD, approvals, roles, follows, profiles, settings, bookmarks).
  - `dashboard_router` → `/api/dashboard` (aggregated stats for dashboards).
  - `admin_router` → `/api/admin` (categories, locations, routing rules, SLA rules).
  - `comments_router` → `/api/comments` (standalone comment-like toggle endpoint).
  - `polls_router` → `/api/polls` (poll creation, voting, and retrieval endpoints).
- Mounts `frontend/` as a static HTML app at `/` (after API routes) so that `/api/...` stays reserved for JSON APIs.
- On startup it:
  - Calls `auto_detect_db.auto_configure_database()` and `auto_detect_db.auto_initialize_database()` if present to prefer MySQL/XAMPP when available.
  - Falls back to `app.database.init_db()` using the configured `DATABASE_URL` if auto-detection fails.

**Configuration (`backend/app/config.py`):**
- `Settings` (Pydantic BaseSettings) encapsulates:
  - App metadata (name, version, `DEBUG`).
  - Server host + port (`HOST`, `PORT`).
  - Database selection (`USE_MYSQL`) and MySQL connection details (host, port, credentials, DB name).
  - A computed `DATABASE_URL` property that builds either a `mysql+pymysql://...` or `sqlite:///.../database/complaints.db` URL.
  - Security settings: `SECRET_KEY`, JWT algorithm, token lifetimes, PIN lifetime.
  - File storage locations (`UPLOAD_DIR`, `BACKUP_DIR`, `LOG_DIR`) plus max upload size and allowed extensions.
  - SLA defaults (per-priority resolution times) used when no explicit SLA rules exist in the DB.
- Instantiation of `Settings()` at import time ensures upload/backup/log directories exist whenever the app starts.

**Database layer (`backend/app/database.py`, `backend/app/models/*.py`):**
- `database.py`:
  - Creates a SQLAlchemy `engine` pointing at `settings.DATABASE_URL` with `pool_pre_ping` and `pool_recycle` configured.
  - Enables SQLite foreign keys via `PRAGMA` listeners when `USE_MYSQL` is `False`.
  - Provides `SessionLocal` and `get_db()` for FastAPI dependency injection, plus `Base = declarative_base()` and `init_db()`.
- `models/models.py` defines the **core domain schema**:
  - Users, roles, many-to-many `user_roles` association.
  - Master data: `Category`, `Location`.
  - Core `Complaint` entity with status, priority, anonymity/privacy, SLA tracking (due dates, escalation), resolution fields, timestamps, soft-delete flags.
  - `Comment`, `Attachment`, `ComplaintVote` (simple upvotes), `TimelineEvent` (per-complaint history), `RoutingRule` (auto-assignment rules), `SLARule` (priority-specific SLA), `AuditLog`, `SystemConfig`.
- `models/extended_models.py` adds the **engagement and UX layer** on top of the complaint core:
  - `UserProfile` and `UserSettings` for per-user bio, verification, privacy, and notification preferences.
  - "Social" features: `Story` and `StoryView`, `ComplaintView`, `ComplaintShare`, `ComplaintLike`, `CommentLike`.
  - Archival and granular permissions: `ArchivedComplaint`, `Permission`, `RolePermission`, `UserActivity`, `Notification`, `IdentityReveal`, `StatusUpdate`.
  - Network/interest graph: `UserFollow`, `Bookmark`.
  - Polling: `Poll`, `PollOption`, `PollVote` (priority voting on complaints).
- `models/__init__.py` re-exports the combined core + extended models so routes can import from `app.models` without worrying about module boundaries.

**Schemas (`backend/app/schemas.py`):**
- Pydantic models mirror the SQLAlchemy models while shaping API payloads:
  - Users: registration, login, update, token payloads.
  - Roles, categories, locations.
  - Complaints: create/update/filter, plus `ComplaintResponse` that inlines derived presentation fields (category/location names, creator/assignee names, SLA/overdue flags, vote stats).
  - Comments, attachments, timeline events.
  - Routing/SLA rules and dashboard aggregates (`DashboardStats`).
  - Voting-related DTOs (`VoteResponse`, `VoteStats`) and generic pagination (`PaginatedResponse`).

**Utilities (`backend/app/utils/*.py`):
- `auth.py`:
  - Encapsulates password/PIN hashing and verification via `passlib`.
  - Creates and decodes JWT access tokens using `python-jose` and app settings.
  - Defines `get_current_user` FastAPI dependency using `HTTPBearer` auth; enforces `is_active` and `is_approved` flags on every authenticated request.
  - Role helpers (`is_admin`, `is_staff`, `require_roles`) used throughout routes for coarse RBAC.
  - `authenticate_user` and `authenticate_with_pin` centralize login checks.
- `audit.py`:
  - `log_action()` helper to persist structured audit entries (`AuditLog`) for important operations (user logins, complaint changes, admin actions).
  - `get_audit_trail()` for filtered retrieval; this is not wired to a public endpoint yet but is used internally where auditing matters.
- `files.py`:
  - Central file/attachment pipeline: validates extension + size against `Settings`, hashes content for unique filenames, writes to `attachments/` subfolders, and generates optional JPEG thumbnails for image uploads.
  - `process_attachment()` returns normalized metadata consumed by routes when creating `Attachment` records.

### API surface by concern

This section focuses on how business concepts map onto routes + models so you can quickly locate where to make changes.

- **Authentication & sessions**
  - Routes: `app/routes/auth.py`.
  - Key flows: `/api/auth/register`, `/api/auth/login`, `/api/auth/login/pin`, `/api/auth/me`, `/api/auth/pin/setup`, `/api/auth/logout`.
  - All non-auth endpoints depend on `get_current_user` and thus require a valid `Authorization: Bearer <token>` header.

- **Complaints lifecycle, SLA, and timeline**
  - Routes: `app/routes/complaints.py`.
  - Creation uses `ComplaintCreate` and validates category/location; SLA due date is computed via `calculate_sla_due_date()` using `SLARule` records when present or fallback defaults from `Settings`.
  - Updates handle both owner and staff behavior, with status transitions updating timestamps and timeline events (`TimelineEvent` records created via `create_timeline_event`).
  - Soft delete is implemented via `is_deleted`/`deleted_at`; standard list/detail queries filter out deleted complaints.
  - Escalation endpoint marks complaints as escalated and logs timeline + audit entries.

- **Comments, likes, and votes**
  - Complaint comments live under `/api/complaints/{id}/comments` (both read and create) in `complaints.py`.
  - Comment likes are handled via `/api/comments/{id}/like` (router in `comments.py`) using `CommentLike`.
  - Complaints have two engagement channels:
    - Simple vote counter via `ComplaintVote` + `/api/complaints/{id}/vote` / `.../vote` DELETE for upvote/unvote and stats retrieval.
    - Heart-style likes via `ComplaintLike` + `/api/complaints/{id}/like` toggle.

- **Polls and crowd-based priority**
  - Quick poll creation is exposed both from complaints (`/api/complaints/{id}/poll` in `complaints.py`) and from the dedicated polls router (`/api/polls/complaints/{id}/poll`).
  - `app/routes/polls.py` manages:
    - Poll creation (`Poll`, `PollOption`) with optional expiry.
    - Voting (`PollVote`) with automatic recomputation of per-option percentages.
    - Dynamic adjustment of `Complaint.priority` based on the currently most-voted option.

- **Users, roles, following, profiles, settings**
  - Routes: `app/routes/users.py`.
  - Admin-facing: list users, approve registrations, manage roles.
  - Social/profile layer: follow/unfollow (`UserFollow`), followers/following lists, `UserProfile` updates, and `UserSettings` for privacy/notification preferences.
  - Role definitions live in the DB (`Role` table); helpers like `is_admin` and `is_staff` interpret them in code.

- **Admin configuration and routing**
  - Routes: `app/routes/admin.py`.
  - Categories and locations management is restricted to admins; these feed complaint creation and filtering.
  - `RoutingRule` endpoints capture mapping logic used to auto-assign complaints by category/location/priority to specific users or roles.
  - `SLARule` endpoints define SLA policies per priority, which `complaints.py` consults when computing `due_date`.

- **Dashboard / analytics**
  - Routes: `app/routes/dashboard.py`.
  - Computes aggregate stats for dashboards (total/open/closed/overdue counts, per-user complaint counts, average resolution time, and histograms by status/priority/category) using SQL aggregates.
  - Respects role: students see only their own complaints in aggregates; staff/admin dashboards span the system.

### Frontend and offline architecture (high level)

The frontend is implemented with vanilla HTML/CSS/JS; most of the client logic lives in a large `frontend/app.js` file.

- **Structure (from `PROJECT_STRUCTURE.md`):**
  - `frontend/index.html` – main shell + UI layout.
  - `frontend/styles.css` – visual design and responsiveness.
  - `frontend/app.js` – main JS app (complaint feed, dashboards, admin panel, social features).
  - `frontend/offline-db.js` – IndexedDB wrapper for offline storage of complaints, comments, likes, bookmarks, follows, and queued actions.
  - `frontend/service-worker.js` + `frontend/manifest.json` – PWA layer and offline caching.
- **Offline-first behavior (from README and `docs/OFFLINE_SETUP.md`):**
  - Service worker caches assets and enables running without network.
  - Offline detection and notification system in the frontend; actions are queued in IndexedDB and synchronized when connectivity is restored.
  - Backend supports running entirely on a local machine with SQLite or bundled MySQL/XAMPP; `auto_detect_db.py` plus the `start_offline` scripts glue this together for non-technical users.

### Where to look before making changes

- For **API changes**, start with the corresponding router under `backend/app/routes/` and the DTOs in `backend/app/schemas.py`; update models in `backend/app/models/*.py` as needed and ensure `init_db`/migration scripts are consistent.
- For **business rules around status/SLA/routing**, touch `complaints.py`, `dashboard.py`, `admin.py`, `SLARule`/`RoutingRule` models, and possibly `Settings` SLA defaults.
- For **auth or permissions**, adjust `backend/app/utils/auth.py` and role/permission models in `backend/app/models/*.py` / `extended_models.py`.
- For **file uploads and attachment behavior**, go through `backend/app/utils/files.py`, `Attachment` model, and any routes that call `process_attachment`.
- For **offline or database auto-detection behavior**, coordinate changes between `backend/auto_detect_db.py`, `backend/main.py` startup logic, and `backend/app/config.py`, and review the relevant docs in `docs/`.
