# Student Complaint & Resolution Hub

**Version 1.1.0** — Updated for 2025!  
*A robust, fully offline desktop system for managing complaints in educational institutions.*

Centralizes complaint submissions, tracking, and resolution—now with streamlined setup and flexible database support for easy deployment.

---

## 🌟 Features (2025 Edition)

### Core Functionality
- 📝 **Complaint Submission** — File complaints by category, location, priority; option for anonymity
- 🤖 **Smart Routing** — Rules auto-assign complaints to the right staff
- 🔄 **Workflow Tracking** — Status flows: New → Acknowledged → In Progress → Resolved → Closed
- 🕓 **SLA Monitoring** — SLA timers and overdue escalations
- 🧾 **Full Timeline & Audit** — Every action logged, audit-proof
- 🧑‍🤝‍🧑 **Role-Based Access** — Student, Staff, Principal, Admin—granular controls
- 📊 **Dashboards** — Instant metrics, KPIs
- 🔍 **Search & Filters** — Filter by category, status, user, date, text
- 🔑 **Multi-factor Login** — Password or PIN (offline PIN supported)
- 🛡️ **Security Enhancements** — Strong password & session management

### Technical Highlights
- 📴 **Truly Offline** — 100% local, no internet dependencies
- ⚙️ **Auto DB Detection** — SQLite by default; XAMPP-MySQL, or Standard MySQL supported
- 💡 **One-Click Setup** — SQLite zero-config or easy XAMPP steps
- 🛠️ **Modern UI** — Improved accessibility and look
- 🔔 **Alerts** — In-app & tray notifications
- 📱 **Responsive Design** — Desktop & tablet ready
- 🚀 **Fast Start** — Minimal boot time
- 🧩 **Easy Extensibility** — Modular backend/frontend architecture

---

## ⚙️ System Requirements

- **OS:** Windows 10/11, macOS 10.14+, Linux
- **Python:** 3.8 or newer (tested up to 3.12+)
- **RAM:** 2GB+ (4GB recommended)
- **Disk:** 500MB+ free
- **Browser:** Chrome, Edge, Firefox, Safari

---

## 🚦 Quick Start

### 1. One-Click (Offline/Default)

**Windows:**  
```batch
start_offline.bat
```
**Linux/Mac:**  
```bash
chmod +x start_offline.sh
./start_offline.sh
```
- Detects and configures DB (SQLite/XAMPP-MySQL)
- Initializes DB and launches server automatically

---

### 2. Manual Advanced Setup

#### a. Backend Requirements

```bash
cd backend
pip install -r requirements.txt
```

#### b. Database Choice

- **A. SQLite (default)**
  ```bash
  python init_db.py
  ```
- **B. XAMPP MySQL:**
  1. Install XAMPP: https://www.apachefriends.org/
  2. Start MySQL in XAMPP Control Panel
  3. Create DB `student_complaints` (phpMyAdmin)
  4. Edit `backend/app/config.py`:
     ```python
     USE_MYSQL = True
     MYSQL_USER = "root"
     MYSQL_PASSWORD = ""  # Default
     ```
  5. Run: `python init_db_mysql.py`
  6. [See guide](docs/XAMPP_SETUP.md)

- **C. Standard MySQL**
  1. Download: https://dev.mysql.com/downloads/
  2. [See guide](docs/MYSQL_SETUP.md)

> *First DB init sets up default roles, demo users, categories, and locations.*

#### c. Start the Server

```bash
python main.py
```

---

## 🌐 Accessing The App

- Go to: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Or: Run `frontend/server.py` to serve only static files

---

## 🔑 Default Login Credentials

| Role         | Username    | Password        | Notes            |
|--------------|-------------|----------------|------------------|
| Admin        | `admin`     | `admin123`     | Super Admin      |
| Principal    | `principal` | `principal123` | Head/Principal   |
| Staff        | `staff1`    | `staff123`     | Any staff user   |
| Student      | `student1`  | `student123`   | Any student user |

> ⚠️ **You must change all default passwords upon first login (system enforces this).**

---

## 👩‍💼 How To Use

### For Students
1. Login (username/password OR PIN)
2. Submit a complaint
3. Monitor your complaint/timeline dashboard
4. Message staff from dashboard when needed

### For Staff
1. Review assigned complaints
2. Update progress
3. Add comments or upload attachments
4. Resolve/escalate as needed

### For Admins/Principal
1. Manage users and roles
2. Configure complaint categories, SLAs, and routing rules
3. View KPIs/analytics dashboard
4. Manage logs and backups

---

## 📁 Project Layout

```
StudentComplaintHub/
├── backend/           # FastAPI+SQLAlchemy backend
│   ├── app/
│   ├── main.py
│   ├── init_db.py
│   └── requirements.txt 
├── frontend/          # UI (HTML/CSS/JS)
├── database/          # SQLite DB files
├── docs/              # Guides/documentation
├── attachments/       # User uploads
├── backups/           # Backup files
├── logs/              # Log output
└── ...
```
See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for full explanation.

---

## 🔧 Backend Config (`backend/app/config.py`)

- **SQLite (default)**  
  ```python
  USE_MYSQL = False
  ```
- **XAMPP MySQL**  
  ```python
  USE_MYSQL = True
  MYSQL_HOST = "localhost"
  MYSQL_PORT = 3306
  MYSQL_USER = "root"
  MYSQL_PASSWORD = ""  # XAMPP default
  MYSQL_DATABASE = "student_complaints"
  ```
- **Standard MySQL**  
  ```python
  USE_MYSQL = True
  MYSQL_USER = "complaint_admin"
  MYSQL_PASSWORD = "ComplaintDB@2024"
  ```

---

## 🛠️ Development & Debugging

- Start server manually:  
  ```bash
  cd backend
  python main.py
  ```
- Auto reload with `DEBUG=True`
- Swagger API docs: [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)
- Reinitialize DB: `python init_db.py`
- Open SQLite shell: `sqlite3 database/complaints.db`

---

## 🔒 Security Highlights

- Secure (bcrypt) passwords & PINs
- JWT session tokens, ready for offline use
- Roles & permissions enforced everywhere
- All actions go to immutable audit log
- File validation & quarantine of uploads
- Automatic session timeout
- Soft-delete and data restore features

---

## 🐞 Troubleshooting

- Ensure Python ≥3.8: `python --version`
- All dependencies installed: `pip install -r backend/requirements.txt`
- Port 8000 is open
- Delete/re-init DB if data issues
- Check logs in `/logs/`
- New users must be approved by admin

---

## 📚 Documentation

All in `/docs/`:

- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
- [CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md)
- [docs/DIAGRAMS.md](docs/DIAGRAMS.md)
- Quickstart & guides:  
  - `docs/QUICKSTART.md`  
  - `docs/XAMPP_SETUP.md`  
  - `docs/MYSQL_SETUP.md`  
  - `docs/MYSQL_PRODUCTION_SETUP.md`  
  - `docs/OFFLINE_SETUP.md`  
  - `docs/ADMIN_MANUAL.md`

---

## 📞 Getting Help

1. Check log files in `logs/`
2. View API docs: `/api/docs`
3. See all documentation in `/docs/` and `PROJECT_DOCUMENTATION.md`
4. Still stuck? Open an issue or ask your local admin

---

## 📄 License

Provided as-is for educational use only.

---

## 🎯 2025 Roadmap

- [ ] Email notifications (when online)
- [ ] File attachments in comments
- [ ] Advanced reporting/charts
- [ ] Mobile app
- [ ] Multi-language
- [ ] Encrypted backup/restore
- [ ] LAN/local sync for distributed usage

---

**Built with FastAPI, SQLAlchemy, and vanilla JS**  
**Version 1.1.0  | Dec 2025**
