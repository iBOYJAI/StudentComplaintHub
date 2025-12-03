# Project Structure

## 📁 Directory Organization

```
StudentComplaintHub/
├── backend/                 # Python FastAPI Backend
│   ├── app/
│   │   ├── models/          # Database models
│   │   │   ├── models.py
│   │   │   └── extended_models.py
│   │   ├── routes/          # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── complaints.py
│   │   │   ├── users.py
│   │   │   ├── comments.py
│   │   │   ├── polls.py
│   │   │   ├── dashboard.py
│   │   │   └── admin.py
│   │   ├── utils/           # Utilities
│   │   │   ├── auth.py
│   │   │   ├── audit.py
│   │   │   └── files.py
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # Database setup
│   │   └── schemas.py       # Pydantic schemas
│   ├── main.py              # Application entry point
│   ├── init_db.py           # SQLite initialization
│   ├── init_db_mysql.py     # MySQL initialization
│   ├── auto_detect_db.py    # Auto-database detection
│   ├── migrate_voting_privacy.py  # Migration script
│   └── requirements.txt     # Python dependencies
│
├── frontend/                # HTML/CSS/JavaScript Frontend
│   ├── index.html           # Main HTML file
│   ├── styles.css           # Stylesheet
│   ├── app.js               # Application logic
│   ├── offline-db.js        # IndexedDB offline storage
│   ├── service-worker.js    # Service worker for PWA
│   └── manifest.json        # PWA manifest
│
├── docs/                    # Documentation
│   ├── README.md            # Main documentation
│   ├── QUICKSTART.md        # Quick start guide
│   ├── XAMPP_SETUP.md       # XAMPP setup guide
│   ├── MYSQL_SETUP.md       # MySQL setup guide
│   ├── MYSQL_PRODUCTION_SETUP.md  # Production MySQL setup
│   ├── OFFLINE_SETUP.md     # Offline mode guide
│   └── ADMIN_MANUAL.md      # Admin manual
│
├── attachments/             # File uploads (empty, created at runtime)
├── backups/                 # Database backups (empty, created at runtime)
├── database/                # SQLite database files (empty, created at runtime)
├── logs/                    # Application logs (empty, created at runtime)
│
├── start_offline.bat        # Windows startup script
├── start_offline.sh         # Linux/Mac startup script
├── .gitignore              # Git ignore rules
├── .gitattributes          # Git attributes
├── README.md               # Main README
├── IMPLEMENTATION_STATUS.md # Feature implementation status
└── PROJECT_STRUCTURE.md    # This file
```

## 📝 File Descriptions

### Backend Files

- **main.py**: FastAPI application entry point, starts the server
- **init_db.py**: Initializes SQLite database with tables and seed data
- **init_db_mysql.py**: Initializes MySQL database with tables and seed data
- **auto_detect_db.py**: Automatically detects and configures MySQL/XAMPP
- **migrate_voting_privacy.py**: Database migration script for voting/privacy features
- **requirements.txt**: Python package dependencies

### Frontend Files

- **index.html**: Main HTML structure and UI components
- **styles.css**: All CSS styling and responsive design
- **app.js**: Main JavaScript application logic (2700+ lines)
- **offline-db.js**: IndexedDB wrapper for offline data storage
- **service-worker.js**: Service worker for PWA and offline caching
- **manifest.json**: Progressive Web App manifest

### Documentation

- **README.md**: Main project documentation and quick start guide
- **IMPLEMENTATION_STATUS.md**: Complete feature implementation status
- **PROJECT_STRUCTURE.md**: This file - project structure documentation
- **docs/QUICKSTART.md**: Quick start guide
- **docs/XAMPP_SETUP.md**: XAMPP MySQL setup instructions
- **docs/MYSQL_SETUP.md**: Standard MySQL setup instructions
- **docs/MYSQL_PRODUCTION_SETUP.md**: Production MySQL deployment guide
- **docs/OFFLINE_SETUP.md**: Offline mode setup guide
- **docs/ADMIN_MANUAL.md**: System administration manual

### Runtime Directories

- **attachments/**: Stores uploaded file attachments (created at runtime)
- **backups/**: Stores database backup files (created at runtime)
- **database/**: Stores SQLite database files (created at runtime)
- **logs/**: Stores application log files (created at runtime)

## 🧹 Cleanup Rules

### Files to Ignore (in .gitignore)

- `__pycache__/` - Python bytecode cache
- `*.pyc`, `*.pyo` - Compiled Python files
- `*.db`, `*.sqlite` - Database files
- `*.log` - Log files
- `.DS_Store`, `Thumbs.db` - OS files
- `venv/`, `env/` - Virtual environments
- `node_modules/` - Node.js modules (if any)

### Empty Directories

Empty directories are preserved with `.gitkeep` files:
- `attachments/.gitkeep`
- `backups/.gitkeep`
- `database/.gitkeep`
- `logs/.gitkeep`

## 🔧 Maintenance

### Regular Cleanup

1. **Remove Python cache**: Run cleanup script or manually delete `__pycache__` folders
2. **Clear logs**: Archive old log files periodically
3. **Backup database**: Regular backups to `backups/` directory
4. **Clean attachments**: Remove old/unused attachments periodically

### Before Committing

1. Remove all `__pycache__` folders
2. Remove temporary files (`*.tmp`, `*.bak`)
3. Ensure `.gitignore` is up to date
4. Test that application still works

## 📦 Distribution

When distributing the application:
1. Remove all `__pycache__` folders
2. Remove `.git` folder (if present)
3. Remove temporary files
4. Keep all source files and documentation
5. Include startup scripts (`start_offline.bat`, `start_offline.sh`)

