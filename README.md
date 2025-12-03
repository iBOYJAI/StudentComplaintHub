# Student Complaint & Resolution Hub

**Version 1.0.0** - Fully Offline Desktop Application

A comprehensive, self-contained complaint management system designed for educational institutions. Works 100% offline without requiring internet access.

## 🌟 Features

### Core Functionality
- ✅ **Complaint Submission** - Students can submit complaints with categories, locations, priority levels, and anonymity options
- ✅ **Automated Routing** - Admin-configurable rules to automatically assign complaints to staff
- ✅ **Workflow Management** - Complete lifecycle from New → Acknowledged → In Progress → Resolved → Closed
- ✅ **SLA Tracking** - Automatic SLA timers and overdue flagging based on priority
- ✅ **Timeline & Audit Trail** - Immutable history of all complaint activities
- ✅ **Role-Based Access** - Student, Staff, Department Head, Vice Principal, Principal, Super Admin
- ✅ **Dashboard & Analytics** - Real-time statistics and KPI cards
- ✅ **Search & Filters** - Full-text search with advanced filtering
- ✅ **Secure Authentication** - Local password hashing (bcrypt) with JWT sessions and optional PIN unlock

### Technical Features
- 🔒 **100% Offline** - No internet connection required, no external dependencies
- 💾 **Auto Database Detection** - Automatically finds and configures MySQL/XAMPP
- 🎨 **Modern UI** - Clean, professional design with updated color scheme
- 🔔 **System Notifications** - Desktop and web app notifications
- 🔐 **Security** - Password hashing, session management, audit logging
- 📱 **Responsive** - Works on desktop and tablet screens
- ⚡ **Fast** - Optimized for instant loading and smooth performance
- 🚀 **Auto-Initialize** - Database automatically sets up on first run

## 📋 System Requirements

- **Operating System**: Windows 10/11, macOS 10.14+, or Linux
- **Python**: 3.8 or higher
- **RAM**: 2GB minimum (4GB recommended)
- **Disk Space**: 500MB minimum
- **Browser**: Modern browser (Chrome, Firefox, Edge, Safari)

## 🚀 Quick Start (Offline Mode)

### Option 1: Auto-Start (Recommended)
**Windows:**
```batch
start_offline.bat
```

**Linux/Mac:**
```bash
chmod +x start_offline.sh
./start_offline.sh
```

This automatically:
- ✅ Detects MySQL/XAMPP
- ✅ Configures database
- ✅ Initializes database
- ✅ Starts the server

### Option 2: Manual Start

### 1. Install Python Dependencies

```bash
# Navigate to backend directory
cd backend

# Install required packages
pip install -r requirements.txt
```

### 2. Choose Database Option

#### Option A: SQLite (Default - No Setup Required)
```bash
# Run database initialization script
python init_db.py
```

#### Option B: MySQL with XAMPP (Recommended for Development)
1. Install XAMPP from https://www.apachefriends.org/
2. Start MySQL in XAMPP Control Panel
3. Create database `student_complaints` in phpMyAdmin (http://localhost/phpmyadmin)
4. Update `backend/app/config.py`:
   ```python
   USE_MYSQL: bool = True
   MYSQL_USER: str = "root"
   MYSQL_PASSWORD: str = ""  # Empty for XAMPP default
   ```
5. Run: `python init_db_mysql.py`
6. See `docs/XAMPP_SETUP.md` for complete XAMPP setup guide

#### Option C: Standard MySQL Installation
1. Install MySQL from https://dev.mysql.com/downloads/
2. Create database and user (see `docs/MYSQL_SETUP.md`)
3. Update `backend/app/config.py` with MySQL credentials
4. Run: `python init_db_mysql.py`

This creates the database, default roles, categories, locations, and demo users.

### 3. Start the Application

```bash
# Start the backend server
python main.py
```

The application will start at: **http://127.0.0.1:8000**

### 4. Access the Application

Open your web browser and navigate to:
```
http://127.0.0.1:8000
```

Or open the frontend directly:
```
frontend/index.html
```

## 🔑 Default Login Credentials

### Administrator
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Super Admin

### Student Account
- **Username**: `john_student`
- **Password**: `student123`
- **Role**: Student

### Staff Account
- **Username**: `sarah_staff`
- **Password**: `staff123`
- **Role**: Staff

⚠️ **IMPORTANT**: Change these default passwords after first login!

## 📖 User Guide

### For Students

1. **Login** - Use your credentials to access the system
2. **Submit Complaint** - Click "New Complaint" button
3. **Fill Details** - Enter title, description, category, location, and priority
4. **Track Status** - View your complaints in "My Complaints" section
5. **View Timeline** - Click any complaint to see detailed timeline

### For Staff

1. **View Queue** - See all assigned complaints in "Complaints" section
2. **Take Action** - Click complaints to view details
3. **Update Status** - Change complaint status as you progress
4. **Add Comments** - Communicate with students
5. **Resolve** - Mark complaints as resolved with notes

### For Administrators

1. **Dashboard** - View system-wide statistics
2. **User Management** - Approve new registrations, manage roles
3. **Categories & Locations** - Configure complaint categories and locations
4. **SLA Rules** - Set response and resolution times
5. **Routing Rules** - Configure automatic complaint assignment

## 🗂️ Project Structure

```
StudentComplaintHub/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── utils/          # Utilities (auth, files, audit)
│   │   ├── config.py       # Configuration
│   │   ├── database.py     # Database setup
│   │   └── schemas.py      # Pydantic schemas
│   ├── main.py             # Application entry point
│   ├── init_db.py          # Database initialization
│   └── requirements.txt    # Python dependencies
├── frontend/                # HTML/CSS/JS frontend
│   ├── index.html          # Main HTML
│   ├── styles.css          # Styles
│   └── app.js              # Application logic
├── database/                # SQLite database storage
├── attachments/             # File uploads storage
├── backups/                 # Backup files
├── logs/                    # Application logs
└── docs/                    # Documentation

```

## 🔧 Configuration

Edit `backend/app/config.py` to customize:

- Server host and port
- Database type (SQLite or MySQL)
- MySQL connection settings (for XAMPP or standard MySQL)
- File upload limits
- SLA default times
- Security settings

### Database Configuration Examples

**SQLite (Default):**
```python
USE_MYSQL: bool = False
```

**XAMPP MySQL:**
```python
USE_MYSQL: bool = True
MYSQL_HOST: str = "localhost"
MYSQL_PORT: int = 3306
MYSQL_USER: str = "root"
MYSQL_PASSWORD: str = ""  # Empty for XAMPP default
MYSQL_DATABASE: str = "student_complaints"
```

**Standard MySQL:**
```python
USE_MYSQL: bool = True
MYSQL_HOST: str = "localhost"
MYSQL_PORT: int = 3306
MYSQL_USER: str = "complaint_admin"
MYSQL_PASSWORD: str = "ComplaintDB@2024"
MYSQL_DATABASE: str = "student_complaints"
```

## 🛠️ Development

### Run in Development Mode

```bash
cd backend
python main.py
```

Server auto-reloads on code changes when `DEBUG=True`.

### API Documentation

Access interactive API docs at:
- **Swagger UI**: http://127.0.0.1:8000/api/docs
- **ReDoc**: http://127.0.0.1:8000/api/redoc

### Database Management

```bash
# Reinitialize database
python init_db.py

# Manual database access
sqlite3 database/complaints.db
```

## 📊 Database Schema

### Main Tables
- **users** - User accounts and authentication
- **roles** - User roles and permissions
- **complaints** - Complaint records
- **comments** - Complaint comments
- **attachments** - File attachments
- **timeline_events** - Audit trail
- **categories** - Complaint categories
- **locations** - Location options
- **routing_rules** - Auto-assignment rules
- **sla_rules** - SLA time limits
- **audit_logs** - System audit log

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Immutable audit trail
- ✅ Soft delete with recovery
- ✅ Input validation and sanitization
- ✅ File type and size validation
- ✅ Session timeout

## 📦 Packaging & Distribution

### Windows

```bash
# Install PyInstaller
pip install pyinstaller

# Create executable
pyinstaller --onefile --add-data "frontend;frontend" --add-data "database;database" main.py
```

### Portable Version

Simply copy the entire `StudentComplaintHub` folder to a USB drive or network share. Users only need Python installed.

## ⚡ Performance Optimization

- Database indexes on frequently queried fields
- Pagination for large result sets
- Lazy loading of related data
- Client-side caching
- Optimized SQL queries

## 🐛 Troubleshooting

### Application won't start
- Verify Python 3.8+ is installed: `python --version`
- Check all dependencies installed: `pip install -r backend/requirements.txt`
- Ensure port 8000 is not in use

### Database errors
- Delete `database/complaints.db` and run `python init_db.py` again
- Check file permissions on database directory

### Login issues
- Clear browser cache and localStorage
- Verify user is approved (admin must approve new registrations)
- Reset password through admin panel

## 📚 Documentation

### Complete Project Documentation

- **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)** - Complete project documentation including:
  - Abstract & Overview
  - Problem Statement & Solution
  - Complete Features List
  - Database Schema & Tables
  - System Architecture
  - Workflow Diagrams
  - API Endpoints
  - Role-Based Permissions
  - Technology Stack

### Additional Documentation

- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Project structure and organization
- **[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)** - Feature implementation status
- **[CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md)** - Project cleanup summary
- **[docs/DIAGRAMS.md](docs/DIAGRAMS.md)** - Visual system diagrams

### Setup Guides

- `docs/QUICKSTART.md` - Quick start guide
- `docs/XAMPP_SETUP.md` - XAMPP MySQL setup guide
- `docs/MYSQL_SETUP.md` - Standard MySQL setup guide
- `docs/MYSQL_PRODUCTION_SETUP.md` - Production MySQL deployment
- `docs/OFFLINE_SETUP.md` - Offline mode setup guide
- `docs/ADMIN_MANUAL.md` - System administration guide

## 📞 Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review API documentation at `/api/docs`
3. Consult documentation in `docs/` folder
4. Review complete project documentation in `PROJECT_DOCUMENTATION.md`

## 📄 License

This software is provided as-is for educational institutions.

## 🎯 Roadmap

Future enhancements (optional):
- [ ] Email notifications (when online)
- [ ] File attachment support in comments
- [ ] Advanced reporting with charts
- [ ] Mobile app version
- [ ] Multi-language support
- [ ] Backup encryption
- [ ] LAN sync between multiple instances

---

**Built with FastAPI, SQLAlchemy, and vanilla JavaScript**  
**Version 1.0.0 | December 2024**


