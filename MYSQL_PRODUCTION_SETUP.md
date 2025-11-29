# MySQL Production Setup - Complete Guide

## 🎯 Complete Step-by-Step Setup for Non-Stop Production Mode

Follow these steps to set up the Student Complaint Hub with MySQL for 24/7 operation.

---

## Part 1: MySQL Installation

### Step 1: Download MySQL
1. Go to: **https://dev.mysql.com/downloads/installer/**
2. Download: **mysql-installer-community-8.0.xx.msi** (400MB file)
3. Run installer as **Administrator**

### Step 2: Install MySQL Components
1. Setup Type: **Custom**
2. Select these products:
   - ✅ MySQL Server 8.0.xx
   - ✅ MySQL Workbench 8.0.xx
   - ✅ MySQL Shell (optional)
3. Click **Execute** to install

### Step 3: Configure MySQL Server
**Type and Networking:**
- Config Type: **Development Computer**
- Port: **3306**
- ✅ Check "Open Windows Firewall port"

**Authentication:**
- Select: **Use Strong Password Encryption (Recommended)**

**Root Password:**
- Set strong password: `ComplaintHub@2024`
- ⚠️ **REMEMBER THIS PASSWORD!**

**Windows Service:**
- Service Name: **MySQL80**
- ✅ **Start MySQL Server at System Startup**
- Run as: **Standard System Account**

4. Click **Execute** → **Finish**

### Step 4: Verify MySQL Installation
```cmd
mysql --version
```
Should show: `mysql  Ver 8.0.xx`

---

## Part 2: Database Setup

### Option A: Using Command Line (Recommended)

1. **Open Command Prompt and login to MySQL:**
```cmd
mysql -u root -p
```
Enter your root password

2. **Create database and user:**
```sql
-- Create database
CREATE DATABASE student_complaints 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create dedicated user
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

### Option B: Using MySQL Workbench (GUI)

1. Open **MySQL Workbench**
2. Click **Local instance MySQL80**
3. Enter root password
4. Click **"Create Schema"** icon (cylinder with +)
5. Name: `student_complaints`
6. Charset: `utf8mb4`
7. Collation: `utf8mb4_unicode_ci`
8. Click **Apply**

---

## Part 3: Application Configuration

### Step 1: Run Configuration Wizard
```cmd
cd C:\Users\jaiga\Desktop\StudentComplaintHub
configure_mysql.bat
```

This wizard will:
- ✅ Enable MySQL in configuration
- ✅ Set MySQL connection details
- ✅ Test connection
- ✅ Verify setup

**OR**

### Step 2: Manual Configuration

Edit `backend\app\config.py`:

```python
# Change this line
USE_MYSQL: bool = True  # Change from False to True

# Update MySQL credentials
MYSQL_HOST: str = "localhost"
MYSQL_PORT: int = 3306
MYSQL_USER: str = "complaint_admin"
MYSQL_PASSWORD: str = "ComplaintDB@2024"
MYSQL_DATABASE: str = "student_complaints"
```

---

## Part 4: Install Dependencies

```cmd
cd backend
pip install -r requirements.txt
pip install pymysql
```

---

## Part 5: Initialize Database

```cmd
python init_db_mysql.py
```

This creates:
- ✅ All database tables
- ✅ Admin user (admin/admin123)
- ✅ Sample users
- ✅ Categories and locations
- ✅ SLA rules
- ✅ Sample complaints

---

## Part 6: Test the Application

### Start Normally
```cmd
cd..
start_mysql.bat
```

Open browser: **http://127.0.0.1:8000**

**Default Login:**
- Admin: `admin` / `admin123`
- Student: `john_student` / `student123`
- Staff: `sarah_staff` / `staff123`

---

## Part 7: Production Deployment (24/7 Non-Stop Mode)

### Option 1: Windows Service (Recommended)

**Prerequisites:**
1. Download NSSM: https://nssm.cc/download
2. Extract `nssm.exe` to `C:\Windows\System32\`

**Install Service:**
```cmd
REM Run as Administrator
install_service.bat
```

**Manage Service:**
```cmd
REM Start service
net start StudentComplaintHub

REM Stop service
net stop StudentComplaintHub

REM Check status
sc query StudentComplaintHub

REM Remove service (if needed)
nssm remove StudentComplaintHub confirm
```

### Option 2: Windows Task Scheduler

1. Open **Task Scheduler**
2. Create Basic Task:
   - Name: `Student Complaint Hub`
   - Trigger: **When computer starts**
   - Action: **Start a program**
   - Program: `C:\Users\jaiga\Desktop\StudentComplaintHub\start_mysql.bat`
   - ✅ Run with highest privileges
   - ✅ Run whether user is logged on or not

### Option 3: Startup Folder (Simple)

1. Press `Win + R`
2. Type: `shell:startup`
3. Create shortcut to `start_mysql.bat` here

---

## Part 8: Production Best Practices

### 1. Change Default Passwords
```sql
-- Login to MySQL
mysql -u root -p

-- Change admin password
UPDATE student_complaints.users 
SET password_hash = '$2b$12$NEW_HASH_HERE' 
WHERE username = 'admin';
```

Or use the web interface to change passwords.

### 2. Enable Automatic Backups

Create `backup_mysql.bat`:
```batch
@echo off
set BACKUP_DIR=C:\StudentComplaintBackups
set DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%
set TIME=%time:~0,2%%time:~3,2%

mkdir %BACKUP_DIR% 2>nul

mysqldump -u complaint_admin -pComplaintDB@2024 student_complaints > %BACKUP_DIR%\backup_%DATE%_%TIME%.sql

echo Backup completed: %BACKUP_DIR%\backup_%DATE%_%TIME%.sql
```

**Schedule daily backups:**
1. Task Scheduler
2. Daily at 2 AM
3. Run `backup_mysql.bat`

### 3. Monitor Application

**Check logs:**
```cmd
dir logs\
type logs\service_stdout.log
type logs\service_stderr.log
```

**Check MySQL:**
```sql
-- Show connections
SHOW PROCESSLIST;

-- Check database size
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'student_complaints';
```

### 4. Performance Tuning

Edit MySQL config (`C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`):

```ini
[mysqld]
# Connection pool
max_connections = 200
thread_cache_size = 16

# Buffer pool (adjust based on RAM)
innodb_buffer_pool_size = 512M

# Query cache
query_cache_type = 1
query_cache_size = 64M

# Logging
slow_query_log = 1
slow_query_log_file = "slow-query.log"
long_query_time = 2
```

Restart MySQL after changes:
```cmd
net stop MySQL80
net start MySQL80
```

---

## Part 9: Network Access (Optional)

### Allow LAN Access

1. **Edit config.py:**
```python
HOST: str = "0.0.0.0"  # Listen on all interfaces
```

2. **Get server IP:**
```cmd
ipconfig
```
Look for IPv4 Address (e.g., 192.168.1.100)

3. **Configure Firewall:**
```cmd
netsh advfirewall firewall add rule name="Complaint Hub" dir=in action=allow protocol=TCP localport=8000
```

4. **Access from other computers:**
```
http://192.168.1.100:8000
```

---

## Part 10: Maintenance

### Monthly Tasks

**Optimize tables:**
```sql
USE student_complaints;
OPTIMIZE TABLE users, complaints, comments, attachments, timeline_events;
```

**Check indexes:**
```sql
SHOW INDEX FROM complaints;
SHOW INDEX FROM users;
```

**Clean old audit logs (optional):**
```sql
DELETE FROM audit_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

### Backup Strategy

**3-2-1 Rule:**
- 3 copies of data
- 2 different storage types
- 1 offsite copy

**Automated backup script:**
```batch
@echo off
REM Daily backup
mysqldump -u complaint_admin -pComplaintDB@2024 student_complaints | gzip > backup_%date%.sql.gz

REM Copy to network drive
copy backup_%date%.sql.gz \\NetworkDrive\Backups\

REM Delete backups older than 30 days
forfiles /p C:\StudentComplaintBackups /s /m *.sql* /d -30 /c "cmd /c del @path"
```

---

## Troubleshooting

### MySQL Won't Start
```cmd
REM Check service status
sc query MySQL80

REM Check error log
type "C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err"

REM Restart service
net stop MySQL80
net start MySQL80
```

### Application Can't Connect
1. Verify MySQL is running
2. Check credentials in `config.py`
3. Test connection:
```cmd
mysql -u complaint_admin -p student_complaints
```

### Port Already in Use
```cmd
REM Check what's using port 8000
netstat -ano | findstr :8000

REM Kill process
taskkill /PID <process_id> /F
```

### Database Corruption
```sql
-- Repair tables
REPAIR TABLE complaints;
REPAIR TABLE users;

-- Check tables
CHECK TABLE complaints;
CHECK TABLE users;
```

---

## Security Checklist

- ✅ Changed default admin password
- ✅ Using dedicated MySQL user (not root)
- ✅ Strong MySQL passwords
- ✅ Firewall configured
- ✅ Regular backups enabled
- ✅ Audit logs monitored
- ✅ MySQL updated to latest version
- ✅ SSL/TLS enabled (for production)

---

## Support & Monitoring

### Health Check Endpoint
```
http://127.0.0.1:8000/api/health
```

### API Documentation
```
http://127.0.0.1:8000/api/docs
```

### MySQL Workbench
Use for visual database management, query execution, and monitoring.

---

**🎉 Your Student Complaint Hub is now running 24/7 in production mode with MySQL!**

For support, refer to:
- `docs/MYSQL_SETUP.md` - Detailed MySQL guide
- `docs/ADMIN_MANUAL.md` - System administration
- `README.md` - General documentation
