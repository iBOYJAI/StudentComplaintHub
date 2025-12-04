# XAMPP MySQL Complete Setup Guide for Student Complaint Hub

## 📋 Table of Contents
1. [XAMPP Installation](#xampp-installation)
2. [Database Setup](#database-setup)
3. [Complete Database Schema](#complete-database-schema)
4. [Application Configuration](#application-configuration)
5. [Initialization](#initialization)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 XAMPP Installation

### Step 1: Download XAMPP
1. Visit: **https://www.apachefriends.org/download.html**
2. Download **XAMPP for Windows** (latest version)
3. Choose version with **PHP 8.x** and **MySQL 8.x**
4. File size: ~150MB

### Step 2: Install XAMPP
1. **Run installer as Administrator**
2. **Select Components**:
   - ✅ **MySQL** (REQUIRED)
   - ✅ **phpMyAdmin** (Recommended for database management)
   - ⬜ Apache (optional, not needed for this project)
   - ⬜ Other components (optional)
3. **Installation Directory**: `C:\xampp` (default)
4. Click **Next** → **Next** → **Install**
5. Wait for installation to complete

### Step 3: Start MySQL Service
1. Open **XAMPP Control Panel** (from Start Menu)
2. Find **MySQL** in the list
3. Click **Start** button next to MySQL
4. Status should change to **green "Running"**
5. ✅ **MySQL is now running on port 3306**

**Note**: If MySQL doesn't start:
- Check if port 3306 is already in use
- Click "Config" → "my.ini" and check port settings
- Try stopping other MySQL services first: `net stop MySQL80`

---

## 🗄️ Database Setup

### Database Information
- **Database Name**: `student_complaints`
- **Character Set**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`
- **Port**: `3306`
- **Host**: `localhost`

### Step 1: Create Database Using phpMyAdmin (Easiest Method)

1. **Start Apache** in XAMPP (required for phpMyAdmin)
   - Open XAMPP Control Panel
   - Click **Start** next to Apache

2. **Access phpMyAdmin**:
   - Click **Admin** button next to MySQL in XAMPP Control Panel
   - OR open browser: **http://localhost/phpmyadmin**

3. **Login**:
   - Username: `root`
   - Password: (leave empty for XAMPP default, or use your password)
   - Click **Go**

4. **Create Database**:
   - Click **"New"** in left sidebar
   - Database name: `student_complaints`
   - Collation: `utf8mb4_unicode_ci`
   - Click **Create**

5. **Create User** (Optional but Recommended):
   - Click **"User accounts"** tab at top
   - Click **"Add user account"**
   - Username: `complaint_admin`
   - Host name: `localhost`
   - Password: `ComplaintDB@2024` (or your choice)
   - **Database for user account**: Select `student_complaints`
   - **Global privileges**: Check **"ALL PRIVILEGES"**
   - Click **Go**

### Step 2: Create Database Using Command Line

1. Open **XAMPP Control Panel**
2. Click **Shell** button
3. Type:
```cmd
mysql -u root
```
(Or `mysql -u root -p` if you set a password)

4. Run these commands:
```sql
-- Create database
CREATE DATABASE student_complaints 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create user (optional)
CREATE USER 'complaint_admin'@'localhost' 
IDENTIFIED BY 'ComplaintDB@2024';

-- Grant privileges
GRANT ALL PRIVILEGES ON student_complaints.* 
TO 'complaint_admin'@'localhost';

FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;

EXIT;
```

---

## 📊 Complete Database Schema

### Database: `student_complaints`

The database contains the following tables:

#### 1. **users** - User accounts and authentication
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `username` (VARCHAR(100), UNIQUE, NOT NULL, INDEXED)
- `email` (VARCHAR(255), UNIQUE, NOT NULL, INDEXED)
- `full_name` (VARCHAR(255), NOT NULL)
- `password_hash` (VARCHAR(255), NOT NULL)
- `pin_hash` (VARCHAR(255), NULLABLE)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `is_approved` (BOOLEAN, DEFAULT FALSE)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE)
- `last_login` (DATETIME, NULLABLE)

#### 2. **roles** - User roles
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `name` (VARCHAR(50), UNIQUE, NOT NULL)
- `description` (TEXT, NULLABLE)
- `permissions` (TEXT, NULLABLE) - JSON string
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

#### 3. **user_roles** - Many-to-many relationship table
- `user_id` (INT, FOREIGN KEY → users.id, PRIMARY KEY)
- `role_id` (INT, FOREIGN KEY → roles.id, PRIMARY KEY)

#### 4. **user_profiles** - Extended user profile information
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `user_id` (INT, FOREIGN KEY → users.id, UNIQUE, NOT NULL)
- `bio` (TEXT, NULLABLE)
- `avatar_url` (VARCHAR(500), NULLABLE)
- `cover_url` (VARCHAR(500), NULLABLE)
- `phone` (VARCHAR(20), NULLABLE)
- `department` (VARCHAR(100), NULLABLE)
- `year` (VARCHAR(20), NULLABLE)
- `is_verified` (BOOLEAN, DEFAULT FALSE)
- `theme_preference` (VARCHAR(10), DEFAULT 'light')
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE)

#### 5. **user_settings** - User preferences and settings
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `user_id` (INT, FOREIGN KEY → users.id, UNIQUE, NOT NULL)
- `show_real_name` (BOOLEAN, DEFAULT FALSE)
- `profile_visibility` (VARCHAR(20), DEFAULT 'public')
- `show_email` (BOOLEAN, DEFAULT FALSE)
- `email_notifications` (BOOLEAN, DEFAULT TRUE)
- `push_notifications` (BOOLEAN, DEFAULT TRUE)
- `notify_on_comment` (BOOLEAN, DEFAULT TRUE)
- `notify_on_status_change` (BOOLEAN, DEFAULT TRUE)
- `notify_on_like` (BOOLEAN, DEFAULT TRUE)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE)

#### 6. **categories** - Complaint categories
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `name` (VARCHAR(100), UNIQUE, NOT NULL)
- `description` (TEXT, NULLABLE)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

#### 7. **locations** - Physical locations
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `name` (VARCHAR(100), UNIQUE, NOT NULL)
- `description` (TEXT, NULLABLE)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

#### 8. **complaints** - Main complaints table
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `title` (VARCHAR(500), NOT NULL, INDEXED)
- `description` (TEXT, NOT NULL)
- `status` (VARCHAR(50), DEFAULT 'New', INDEXED)
- `priority` (VARCHAR(20), DEFAULT 'Medium', INDEXED)
- `is_anonymous` (BOOLEAN, DEFAULT FALSE)
- `privacy_mode` (VARCHAR(20), DEFAULT 'public')
- `category_id` (INT, FOREIGN KEY → categories.id, NOT NULL)
- `location_id` (INT, FOREIGN KEY → locations.id, NULLABLE)
- `created_by` (INT, FOREIGN KEY → users.id, NOT NULL)
- `assigned_to` (INT, FOREIGN KEY → users.id, NULLABLE, INDEXED)
- `sla_minutes` (INT, NULLABLE)
- `due_date` (DATETIME, NULLABLE)
- `is_overdue` (BOOLEAN, DEFAULT FALSE, INDEXED)
- `is_escalated` (BOOLEAN, DEFAULT FALSE)
- `escalated_at` (DATETIME, NULLABLE)
- `resolution_notes` (TEXT, NULLABLE)
- `resolved_at` (DATETIME, NULLABLE)
- `resolved_by` (INT, FOREIGN KEY → users.id, NULLABLE)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP, INDEXED)
- `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE)
- `acknowledged_at` (DATETIME, NULLABLE)
- `closed_at` (DATETIME, NULLABLE)
- `is_deleted` (BOOLEAN, DEFAULT FALSE)
- `deleted_at` (DATETIME, NULLABLE)
- `vote_count` (INT, DEFAULT 0)
- `view_count` (INT, DEFAULT 0)

#### 9. **comments** - Comments on complaints
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `complaint_id` (INT, FOREIGN KEY → complaints.id, NOT NULL)
- `author_id` (INT, FOREIGN KEY → users.id, NOT NULL)
- `parent_id` (INT, FOREIGN KEY → comments.id, NULLABLE) - For nested comments
- `content` (TEXT, NOT NULL)
- `is_internal` (BOOLEAN, DEFAULT FALSE)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP, INDEXED)
- `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE)
- `is_deleted` (BOOLEAN, DEFAULT FALSE)
- `like_count` (INT, DEFAULT 0)

#### 10. **sla_rules** - SLA (Service Level Agreement) rules
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `name` (VARCHAR(255), NOT NULL)
- `priority` (VARCHAR(20), NOT NULL)
- `response_time_minutes` (INT, NOT NULL)
- `resolution_time_minutes` (INT, NOT NULL)
- `escalation_time_minutes` (INT, NULLABLE)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

#### 11. **routing_rules** - Auto-assignment rules
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `name` (VARCHAR(255), NOT NULL)
- `category_id` (INT, FOREIGN KEY → categories.id, NULLABLE)
- `location_id` (INT, FOREIGN KEY → locations.id, NULLABLE)
- `priority` (VARCHAR(20), NULLABLE)
- `assign_to_user_id` (INT, FOREIGN KEY → users.id, NULLABLE)
- `assign_to_role_id` (INT, FOREIGN KEY → roles.id, NULLABLE)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `execution_order` (INT, DEFAULT 0)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE)

#### 12. **escalations** - Complaint escalations
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `complaint_id` (INT, FOREIGN KEY → complaints.id, NOT NULL)
- `escalated_by` (INT, FOREIGN KEY → users.id, NOT NULL)
- `escalated_to` (INT, FOREIGN KEY → users.id, NULLABLE)
- `reason` (TEXT, NOT NULL)
- `status` (VARCHAR(50), DEFAULT 'Pending')
- `escalation_level` (INT, DEFAULT 1)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `resolved_at` (DATETIME, NULLABLE)
- `resolution_notes` (TEXT, NULLABLE)

#### 13. **attachments** - File attachments for complaints
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `complaint_id` (INT, FOREIGN KEY → complaints.id, NOT NULL)
- `uploaded_by` (INT, FOREIGN KEY → users.id, NOT NULL)
- `filename` (VARCHAR(500), NOT NULL)
- `original_filename` (VARCHAR(500), NOT NULL)
- `file_path` (VARCHAR(1000), NOT NULL)
- `file_type` (VARCHAR(100), NULLABLE)
- `file_size` (INT, NULLABLE)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `is_deleted` (BOOLEAN, DEFAULT FALSE)

#### 14. **audit_logs** - System audit trail
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `user_id` (INT, FOREIGN KEY → users.id, NULLABLE)
- `action` (VARCHAR(100), NOT NULL, INDEXED)
- `resource_type` (VARCHAR(50), NOT NULL)
- `resource_id` (INT, NULLABLE)
- `details` (TEXT, NULLABLE)
- `ip_address` (VARCHAR(50), NULLABLE)
- `user_agent` (VARCHAR(500), NULLABLE)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP, INDEXED)

#### 15. **complaint_votes** - User votes on complaints
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `complaint_id` (INT, FOREIGN KEY → complaints.id, NOT NULL)
- `user_id` (INT, FOREIGN KEY → users.id, NOT NULL)
- `vote_type` (VARCHAR(10), DEFAULT 'up') - 'up' or 'priority'
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- UNIQUE CONSTRAINT: (`complaint_id`, `user_id`)

#### 16. **user_follows** - User following relationships
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `follower_id` (INT, FOREIGN KEY → users.id, NOT NULL)
- `following_id` (INT, FOREIGN KEY → users.id, NOT NULL)
- `followed_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

#### 17. **complaint_likes** - Likes on complaints
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `complaint_id` (INT, FOREIGN KEY → complaints.id, NOT NULL)
- `user_id` (INT, FOREIGN KEY → users.id, NOT NULL)
- `liked_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

#### 18. **comment_likes** - Likes on comments
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `comment_id` (INT, FOREIGN KEY → comments.id, NOT NULL)
- `user_id` (INT, FOREIGN KEY → users.id, NOT NULL)
- `liked_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

#### 19. **polls** - Polls associated with complaints
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `complaint_id` (INT, FOREIGN KEY → complaints.id, UNIQUE, NULLABLE)
- `question` (VARCHAR(500), NOT NULL)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `expires_at` (DATETIME, NULLABLE)

#### 20. **poll_options** - Poll options
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `poll_id` (INT, FOREIGN KEY → polls.id, NULLABLE)
- `option_text` (VARCHAR(100), NOT NULL)
- `vote_count` (INT, DEFAULT 0)
- `order` (INT, DEFAULT 0)

### Default Roles
The system includes these default roles:
1. **Student** - Student role
2. **Staff** - Staff role
3. **Department Head** - Department Head role
4. **Vice Principal** - Vice Principal role
5. **Principal** - Principal role
6. **Super Admin** - Super Admin role

### Default Categories
1. Facilities - Building and infrastructure issues
2. Academics - Academic related complaints
3. Canteen - Food and canteen services
4. Transport - Transportation issues
5. Library - Library related complaints
6. Sports - Sports and recreation facilities
7. IT Services - Computer lab and network issues
8. Safety - Safety and security concerns
9. Other - Other complaints

### Default Locations
1. Main Building
2. Science Block
3. Library
4. Canteen
5. Sports Complex
6. Playground
7. Computer Lab
8. Auditorium
9. Parking Area
10. Entrance Gate

---

## ⚙️ Application Configuration

### Step 1: Update Configuration File

Edit `backend/app/config.py` or create environment variables:

**Option 1: XAMPP with root user (no password) - Development**
```python
# In backend/app/config.py or environment variables
USE_MYSQL = True
MYSQL_HOST = "localhost"
MYSQL_PORT = 3306
MYSQL_USER = "root"
MYSQL_PASSWORD = ""  # Empty password for XAMPP default
MYSQL_DATABASE = "student_complaints"
```

**Option 2: XAMPP with root user (with password)**
```python
USE_MYSQL = True
MYSQL_HOST = "localhost"
MYSQL_PORT = 3306
MYSQL_USER = "root"
MYSQL_PASSWORD = "your_root_password"  # Your XAMPP MySQL root password
MYSQL_DATABASE = "student_complaints"
```

**Option 3: XAMPP with dedicated user (Recommended)**
```python
USE_MYSQL = True
MYSQL_HOST = "localhost"
MYSQL_PORT = 3306
MYSQL_USER = "complaint_admin"
MYSQL_PASSWORD = "ComplaintDB@2024"
MYSQL_DATABASE = "student_complaints"
```

### Step 2: Install Python Dependencies

```cmd
cd backend
pip install -r requirements.txt
pip install pymysql cryptography
```

**Required packages:**
- `flask`
- `flask-sqlalchemy`
- `flask-migrate`
- `flask-jwt-extended`
- `flask-cors`
- `flask-marshmallow`
- `pymysql` - MySQL driver for Python
- `cryptography` - Required for secure connections
- `werkzeug` - Password hashing

---

## 🚀 Initialization

### Step 1: Initialize Database Schema

The application will automatically create all tables when you run it for the first time, OR you can use the initialization script:

```cmd
cd backend
python init_db.py
```

This will:
- ✅ Create all database tables
- ✅ Set up indexes
- ✅ Create default roles (Student, Staff, Department Head, Vice Principal, Principal, Super Admin)
- ✅ Create admin user (username: `admin`, password: `admin123`)
- ✅ Create sample users:
  - Student: `john_student` / `student123`
  - Staff: `sarah_staff` / `staff123`
- ✅ Populate categories (9 default categories)
- ✅ Populate locations (10 default locations)
- ✅ Create SLA rules (Low, Medium, High, Urgent priorities)
- ✅ Create sample routing rules

### Step 2: Verify Database Creation

**Using phpMyAdmin:**
1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Click `student_complaints` database in left sidebar
3. You should see all 20 tables listed

**Using Command Line:**
```cmd
mysql -u root -p
USE student_complaints;
SHOW TABLES;
```

You should see:
```
+----------------------------+
| Tables_in_student_complaints |
+----------------------------+
| attachments                |
| audit_logs                 |
| categories                 |
| comment_likes              |
| comments                   |
| complaint_likes            |
| complaint_votes            |
| complaints                 |
| escalations                |
| locations                  |
| poll_options               |
| polls                      |
| routing_rules              |
| sla_rules                  |
| user_follows               |
| user_profiles              |
| user_roles                 |
| user_settings              |
| users                      |
| roles                      |
+----------------------------+
```

---

## ✅ Verification

### Step 1: Start MySQL in XAMPP
1. Open **XAMPP Control Panel**
2. Click **Start** next to MySQL
3. Ensure status shows **"Running"** (green)

### Step 2: Start Application

**Option A: Using startup script**
```cmd
start_app.bat
```

**Option B: Manual start**
```cmd
cd backend
python wsgi.py
```

Or:
```cmd
cd backend
python -m flask run --host=127.0.0.1 --port=8000
```

### Step 3: Test Application

1. **Open browser**: http://127.0.0.1:8000
2. **Check API**: http://127.0.0.1:8000/api/docs
3. **Test login** with default credentials:
   - Admin: `admin` / `admin123`
   - Student: `john_student` / `student123`
   - Staff: `sarah_staff` / `staff123`

### Step 4: Verify Database Connection

**Check application logs** - should show:
```
✓ MySQL detected at localhost:3306
✓ Database 'student_complaints' created/verified
```

---

## 🔧 Troubleshooting

### Problem 1: MySQL Won't Start in XAMPP

**Solution**: Port 3306 already in use
```cmd
# Stop other MySQL services
net stop MySQL80
```
Then start MySQL in XAMPP again

**Alternative**: Change XAMPP MySQL port
1. Edit `C:\xampp\mysql\bin\my.ini`
2. Change `port = 3306` to `port = 3307`
3. Update `config.py`: `MYSQL_PORT = 3307`
4. Restart MySQL in XAMPP

### Problem 2: Application Can't Connect to MySQL

**Checklist**:
1. ✅ MySQL is running in XAMPP Control Panel (green status)
2. ✅ Database `student_complaints` exists
3. ✅ Username and password in config are correct
4. ✅ Port matches (default 3306)

**Test Connection**:
```cmd
mysql -u root -p
```
(Or `mysql -u root` if no password)

If this works, MySQL is running correctly.

### Problem 3: Database Not Found Error

**Solution**:
1. Open phpMyAdmin
2. Check if `student_complaints` database exists
3. If not, create it (see Database Setup section)
4. Run `python init_db.py` again

### Problem 4: Access Denied Error

**Solution**:
1. Check username: `root` or `complaint_admin`
2. Check password (or leave empty if default)
3. Verify user has privileges:
```sql
SHOW GRANTS FOR 'complaint_admin'@'localhost';
```

### Problem 5: Tables Not Created

**Solution**:
1. Check application logs for errors
2. Verify database connection in config
3. Manually run initialization:
```cmd
cd backend
python init_db.py
```

---

## 📝 Quick Reference

### XAMPP MySQL Default Settings
- **Host**: `localhost`
- **Port**: `3306`
- **Root Username**: `root`
- **Root Password**: (empty by default)
- **Data Directory**: `C:\xampp\mysql\data\`
- **Config File**: `C:\xampp\mysql\bin\my.ini`

### Database Information
- **Database Name**: `student_complaints`
- **Character Set**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`
- **Total Tables**: 20

### Default Login Credentials
- **Admin**: `admin` / `admin123`
- **Student**: `john_student` / `student123`
- **Staff**: `sarah_staff` / `staff123`

⚠️ **IMPORTANT**: Change default passwords after first login!

### Application URLs
- **Frontend**: http://127.0.0.1:8000
- **API Docs**: http://127.0.0.1:8000/api/docs
- **phpMyAdmin**: http://localhost/phpmyadmin

---

## 📚 Additional Resources

- **XAMPP Official**: https://www.apachefriends.org/
- **phpMyAdmin Docs**: https://www.phpmyadmin.net/docs/
- **MySQL Docs**: https://dev.mysql.com/doc/
- **Project README**: `README.md`
- **Admin Manual**: `docs/ADMIN_MANUAL.md`

---

**🎉 Your Student Complaint Hub is now configured with XAMPP MySQL!**

For standard MySQL setup (non-XAMPP), see: `docs/MYSQL_SETUP.md`

