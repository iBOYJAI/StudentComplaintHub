# Student Complaint Hub - Quick Start Guide

## Getting Started in 3 Steps

### Step 1: Install Python
1. Download Python from [python.org](https://python.org)
2. Install Python 3.8 or higher
3. Make sure to check "Add Python to PATH" during installation

### Step 2: Setup Application
1. Open Command Prompt or Terminal
2. Navigate to the StudentComplaintHub folder
3. Run setup:
   ```
   cd backend
   pip install -r requirements.txt
   python init_db.py
   ```

### Step 3: Start Application
1. Double-click `start.bat` (Windows) or run:
   ```
   cd backend
   python main.py
   ```
2. Open browser to: http://127.0.0.1:8000

## First Time Login

Use these default credentials:

**Admin Account**
- Username: `admin`
- Password: `admin123`

**Student Account**  
- Username: `john_student`
- Password: `student123`

**Staff Account**
- Username: `sarah_staff`
- Password: `staff123`

## Common Tasks

### Submit a Complaint (Student)
1. Login with student account
2. Click "New Complaint" button (top right)
3. Fill in:
   - Title (brief description)
   - Category (e.g., Facilities, Canteen)
   - Location (where issue occurred)
   - Priority (Low, Medium, High, Urgent)
   - Description (detailed explanation)
4. Check "Submit Anonymously" if desired
5. Click "Submit Complaint"

### View Your Complaints
1. Click "My Complaints" in sidebar
2. Click any complaint to see details
3. View status and timeline

### Handle Complaints (Staff)
1. Login with staff account
2. Click "Complaints" to see all assigned complaints
3. Click a complaint to view details
4. Update status as you work on it
5. Add resolution notes when closing

### Manage System (Admin)
1. Login with admin account
2. Access "Admin" section in sidebar
3. Manage:
   - Categories
   - Locations  
   - Users
   - Roles
   - SLA Rules

## Tips & Tricks

✅ **Search** - Use the search box at top to find complaints quickly
✅ **Filters** - Filter complaints by status, priority, category
✅ **Timeline** - Click any complaint to see full history
✅ **Anonymous** - Students can submit complaints anonymously
✅ **Dashboard** - View statistics and recent activity

## Need Help?

1. Check the main README.md file
2. View API documentation at http://127.0.0.1:8000/api/docs
3. Check logs in `logs/` folder if something goes wrong

## Stopping the Application

Press `Ctrl+C` in the terminal/command prompt where the server is running.

---

**Enjoy using Student Complaint Hub!** 🎉
