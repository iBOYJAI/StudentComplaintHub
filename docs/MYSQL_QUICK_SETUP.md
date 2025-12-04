# MySQL Quick Setup Guide - Student Complaint Hub

## 🚀 Quick Start

### Database Information
- **Database Name**: `student_complaints`
- **Character Set**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`
- **Port**: `3306`
- **Host**: `localhost`

---

## 📋 For XAMPP Users

### 1. Install XAMPP
- Download from: https://www.apachefriends.org/
- Install MySQL component
- Start MySQL from XAMPP Control Panel

### 2. Create Database

**Using phpMyAdmin:**
1. Open: http://localhost/phpmyadmin
2. Login: `root` / (empty password)
3. Click "New" → Database name: `student_complaints` → Collation: `utf8mb4_unicode_ci` → Create

**Using Command Line:**
```sql
mysql -u root
CREATE DATABASE student_complaints CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. Configure Application

Edit `backend/app/config.py`:
```python
USE_MYSQL = True
MYSQL_HOST = "localhost"
MYSQL_PORT = 3306
MYSQL_USER = "root"
MYSQL_PASSWORD = ""  # Empty for XAMPP default
MYSQL_DATABASE = "student_complaints"
```

### 4. Install Dependencies
```cmd
cd backend
pip install -r requirements.txt
pip install pymysql cryptography
```

### 5. Initialize Database
```cmd
cd backend
python init_db.py
```

### 6. Start Application
```cmd
start_app.bat
```

**Access**: http://127.0.0.1:8000

**Default Login**: `admin` / `admin123`

---

## 📋 For Standard MySQL Users

### 1. Install MySQL
- Download MySQL Installer from: https://dev.mysql.com/downloads/installer/
- Install MySQL Server 8.0
- Set root password during installation

### 2. Create Database and User

```sql
mysql -u root -p
```

```sql
-- Create database
CREATE DATABASE student_complaints 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'complaint_admin'@'localhost' 
IDENTIFIED BY 'ComplaintDB@2024';

-- Grant privileges
GRANT ALL PRIVILEGES ON student_complaints.* 
TO 'complaint_admin'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

### 3. Configure Application

Edit `backend/app/config.py`:
```python
USE_MYSQL = True
MYSQL_HOST = "localhost"
MYSQL_PORT = 3306
MYSQL_USER = "complaint_admin"
MYSQL_PASSWORD = "ComplaintDB@2024"
MYSQL_DATABASE = "student_complaints"
```

### 4. Install Dependencies
```cmd
cd backend
pip install -r requirements.txt
pip install pymysql cryptography
```

### 5. Initialize Database
```cmd
cd backend
python init_db.py
```

### 6. Start Application
```cmd
start_app.bat
```

**Access**: http://127.0.0.1:8000

**Default Login**: `admin` / `admin123`

---

## 📊 Database Schema

The database contains **20 tables**:

1. **users** - User accounts
2. **roles** - User roles
3. **user_roles** - User-role relationships
4. **user_profiles** - Extended user profiles
5. **user_settings** - User preferences
6. **categories** - Complaint categories
7. **locations** - Physical locations
8. **complaints** - Main complaints table
9. **comments** - Comments on complaints
10. **sla_rules** - SLA rules
11. **routing_rules** - Auto-assignment rules
12. **escalations** - Complaint escalations
13. **attachments** - File attachments
14. **audit_logs** - System audit trail
15. **complaint_votes** - User votes
16. **user_follows** - User following
17. **complaint_likes** - Complaint likes
18. **comment_likes** - Comment likes
19. **polls** - Polls
20. **poll_options** - Poll options

**Complete SQL schema**: See `database/schema.sql`

---

## 🔧 Import Schema Manually (Optional)

If you want to import the schema manually:

```cmd
mysql -u root -p student_complaints < database/schema.sql
```

Or using phpMyAdmin:
1. Open phpMyAdmin
2. Select `student_complaints` database
3. Click "Import" tab
4. Choose `database/schema.sql` file
5. Click "Go"

---

## ✅ Verification

### Check Database Connection
```cmd
mysql -u root -p
USE student_complaints;
SHOW TABLES;
```

Should show 20 tables.

### Check Application
1. Start application: `start_app.bat`
2. Open: http://127.0.0.1:8000
3. Login with: `admin` / `admin123`

---

## 🐛 Troubleshooting

### MySQL Won't Start
- Check if port 3306 is in use
- Stop other MySQL services: `net stop MySQL80`
- Check XAMPP Control Panel logs

### Can't Connect to Database
- Verify MySQL is running
- Check username/password in config
- Verify database exists: `SHOW DATABASES;`

### Tables Not Created
- Run initialization: `python init_db.py`
- Check application logs for errors
- Verify database connection settings

---

## 📚 More Information

- **Complete XAMPP Setup**: `docs/XAMPP_SETUP_COMPLETE.md`
- **Standard MySQL Setup**: `docs/MYSQL_SETUP.md`
- **Production Setup**: `docs/MYSQL_PRODUCTION_SETUP.md`
- **Database Schema**: `database/schema.sql`

---

**Default Credentials** (Change after first login!):
- Admin: `admin` / `admin123`
- Student: `john_student` / `student123`
- Staff: `sarah_staff` / `staff123`

