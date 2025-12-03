# Student Complaint Hub - Getting Started

## Quick Start

### 🚀 One-Command Launch
Simply double-click `start_app.bat` in the root directory, and both servers will start automatically!

**The application will be available at:**
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000

### 📋 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Student | john_student | student123 |
| Staff | sarah_staff | staff123 |

---

## Manual Setup (If needed)

### Prerequisites
- Python 3.8+ installed
- All dependencies installed (already done via requirements.txt)

### Step 1: Start Backend Server
```bash
cd backend
python wsgi.py
```
Backend will run on: http://localhost:5000

### Step 2: Start Frontend Server
```bash
cd frontend
python -m http.server 8080
```
Frontend will run on: http://localhost:8080

---

## 🎯 Testing Guide

### 1. **Authentication Testing**
- Open http://localhost:8080
- Login with admin credentials
- Test PIN setup and PIN login
- Logout and test student/staff logins

### 2. **Student Workflow**
Login as: `john_student / student123`
- ✅ View student dashboard
- ✅ Create new complaint
- ✅ View my complaints
- ✅ View complaint details and timeline
- ✅ Add comments to complaints
- ✅ Edit profile

### 3. **Staff Workflow**
Login as: `sarah_staff / staff123`
- ✅ View staff dashboard
- ✅ View assigned complaints
- ✅ Process complaints (accept, in progress, resolve)
- ✅ Add staff responses
- ✅ View complaint history

### 4. **Admin Workflow**
Login as: `admin / admin123`
- ✅ View admin dashboard with statistics
- ✅ Manage users (create, edit, delete, approve)
- ✅ Manage categories
- ✅ Manage locations
- ✅ Configure routing rules
- ✅ Configure SLA rules
- ✅ View audit logs
- ✅ Backup and restore database

---

## 🎨 Features to Test

### Navigation
- ✅ Sidebar navigation
- ✅ Top navigation bar
- ✅ Breadcrumbs
- ✅ Page transitions

### UI Components
- ✅ Modal dialogs
- ✅ Toast notifications
- ✅ Data tables with sorting
- ✅ Form validation
- ✅ File uploads
- ✅ Charts and visualizations

### Advanced Features
- ✅ Advanced search with filters
- ✅ Real-time notifications
- ✅ Profile management
- ✅ Password change
- ✅ PIN quick login

---

## 📱 Browser Compatibility
- ✅ Chrome (Recommended)
- ✅ Firefox
- ✅ Edge
- ✅ Safari

---

## 🔧 Troubleshooting

### Backend not starting?
1. Check if Python is installed: `python --version`
2. Ensure all dependencies are installed: `pip install -r backend/requirements.txt`
3. Check if port 5000 is available
4. Check database file exists: `backend/complaint_hub.db`

### Frontend not loading?
1. Check if port 8080 is available
2. Try alternative port: `python -m http.server 3000`
3. Update frontend config if using different port

### CORS errors?
- Ensure `backend/.env` includes your frontend port in CORS_ORIGINS
- Current allowed: `http://localhost:8080, http://localhost:3000`

### Database issues?
Reinitialize database:
```bash
cd backend
python -m flask init-db
```

---

## 🛠️ Development Notes

### Project Structure
```
StudentComplaintHub/
├── backend/              # Flask REST API
│   ├── app/
│   │   ├── models/      # Database models
│   │   ├── routes/      # API endpoints
│   │   └── utils/       # Helper functions
│   ├── wsgi.py          # Application entry point
│   └── complaint_hub.db # SQLite database
│
├── frontend/            # Vanilla JS SPA
│   ├── assets/
│   │   ├── css/        # Stylesheets
│   │   ├── js/         # JavaScript modules
│   │   │   ├── pages/  # Page components
│   │   │   └── components/ # UI components
│   └── index.html      # Entry point
│
└── start_app.bat       # Quick launcher
```

### API Endpoints
All endpoints are prefixed with `/api`:

**Auth**: `/api/auth`
- POST `/login` - Login with credentials
- POST `/pin/login` - Quick PIN login
- POST `/pin/setup` - Setup PIN
- GET `/me` - Get current user

**Complaints**: `/api/complaints`
- GET `/` - List all complaints
- POST `/` - Create complaint
- GET `/:id` - Get complaint details
- PUT `/:id` - Update complaint
- DELETE `/:id` - Delete complaint
- POST `/:id/comments` - Add comment

**Users**: `/api/users`
- GET `/` - List users (admin)
- POST `/` - Create user (admin)
- GET `/:id` - Get user
- PUT `/:id` - Update user
- DELETE `/:id` - Delete user

**Admin**: `/api/admin`
- Categories, Locations, Roles, SLA Rules, Routing Rules
- Audit logs, Backup/Restore

**Dashboard**: `/api/dashboard`
- GET `/stats` - Get statistics
- GET `/charts` - Get chart data

---

## 📊 Database Schema

The application uses SQLite with the following main tables:
- **users** - User accounts
- **roles** - User roles
- **complaints** - Complaint submissions
- **categories** - Complaint categories
- **locations** - Campus locations
- **sla_rules** - Service Level Agreement rules
- **routing_rules** - Auto-assignment rules
- **audit_logs** - System audit trail

---

## 🎉 Next Steps

1. **Test all features** listed above
2. **Create sample data** through the UI
3. **Test error handling** with invalid inputs
4. **Test permissions** by switching between user roles
5. **Check responsiveness** by resizing the browser
6. **Test file uploads** when creating complaints

---

## 📝 Notes

- Database is automatically created on first run
- Sample data is seeded with default users
- All passwords are securely hashed
- JWT tokens are used for authentication
- File uploads are stored in `attachments/` directory

---

**Status**: ✅ FULLY FUNCTIONAL AND READY TO USE

Enjoy your Student Complaint Hub! 🎓
