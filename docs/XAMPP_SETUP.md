# XAMPP MySQL Setup Guide for Student Complaint Hub

## 🎯 Complete Step-by-Step Setup with XAMPP

This guide will help you set up the Student Complaint Hub using XAMPP's MySQL server.

---

## Part 1: Install XAMPP

### Step 1: Download XAMPP
1. Go to: **https://www.apachefriends.org/download.html**
2. Download **XAMPP for Windows** (latest version)
3. Choose the version with PHP 8.x and MySQL 8.x
4. File size: ~150MB

### Step 2: Install XAMPP
1. **Run the installer** as Administrator
2. **Select Components**: 
   - ✅ Apache (optional, not needed for this project)
   - ✅ MySQL (REQUIRED)
   - ✅ phpMyAdmin (recommended for database management)
   - ✅ FileZilla (optional)
   - ✅ Mercury (optional)
   - ✅ Tomcat (optional)
3. **Choose Installation Directory**: 
   - Default: `C:\xampp`
   - You can change it if needed
4. Click **Next** → **Next** → **Install**
5. Wait for installation to complete

### Step 3: Start MySQL in XAMPP
1. Open **XAMPP Control Panel** (from Start Menu or Desktop)
2. Find **MySQL** in the list
3. Click **Start** button next to MySQL
4. Status should change to green "Running"
5. ✅ **MySQL is now running on port 3306**

**Note**: If MySQL doesn't start:
- Check if port 3306 is already in use
- Click "Config" → "my.ini" and check port settings
- Try stopping other MySQL services first

---

## Part 2: Configure MySQL (Optional but Recommended)

### Option A: Set MySQL Root Password (Recommended for Security)

1. Open **XAMPP Control Panel**
2. Click **Shell** button (opens command prompt)
3. Type:
```cmd
mysql -u root
```

4. If you get an error, try:
```cmd
mysql -u root -p
```
(Leave password empty and press Enter)

5. Once connected, set a password:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_password_here';
FLUSH PRIVILEGES;
EXIT;
```

**Example** (using password `root`):
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
FLUSH PRIVILEGES;
EXIT;
```

### Option B: Use Root Without Password (Quick Setup)

XAMPP MySQL comes with `root` user and **no password** by default. You can use this for development, but it's not recommended for production.

---

## Part 3: Create Database and User

### Method 1: Using phpMyAdmin (Easiest)

1. In **XAMPP Control Panel**, click **Admin** button next to MySQL
   - OR open browser: **http://localhost/phpmyadmin**

2. **Login**:
   - Username: `root`
   - Password: (leave empty if you didn't set one, or use your password)
   - Click **Go**

3. **Create Database**:
   - Click **"New"** in left sidebar
   - Database name: `student_complaints`
   - Collation: `utf8mb4_unicode_ci`
   - Click **Create**

4. **Create User** (Optional but Recommended):
   - Click **"User accounts"** tab at top
   - Click **"Add user account"**
   - Username: `complaint_admin`
   - Host name: `localhost`
   - Password: `ComplaintDB@2024` (or your choice)
   - **Database for user account**: Select `student_complaints`
   - **Global privileges**: Check **"ALL PRIVILEGES"**
   - Click **Go**

### Method 2: Using Command Line

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

## Part 4: Configure Application for XAMPP

### Step 1: Update Configuration File

Edit `backend/app/config.py`:

**For XAMPP with root user (no password):**
```python
USE_MYSQL: bool = True

# XAMPP MySQL Configuration
MYSQL_HOST: str = "localhost"
MYSQL_PORT: int = 3306
MYSQL_USER: str = "root"
MYSQL_PASSWORD: str = ""  # Empty password for XAMPP default
MYSQL_DATABASE: str = "student_complaints"
```

**For XAMPP with root user (with password):**
```python
USE_MYSQL: bool = True

# XAMPP MySQL Configuration
MYSQL_HOST: str = "localhost"
MYSQL_PORT: int = 3306
MYSQL_USER: str = "root"
MYSQL_PASSWORD: str = "root"  # Your XAMPP MySQL root password
MYSQL_DATABASE: str = "student_complaints"
```

**For XAMPP with dedicated user:**
```python
USE_MYSQL: bool = True

# XAMPP MySQL Configuration
MYSQL_HOST: str = "localhost"
MYSQL_PORT: int = 3306
MYSQL_USER: str = "complaint_admin"
MYSQL_PASSWORD: str = "ComplaintDB@2024"
MYSQL_DATABASE: str = "student_complaints"
```

### Step 2: Install Python Dependencies

```cmd
cd backend
pip install -r requirements.txt
pip install pymysql
```

---

## Part 5: Initialize Database

```cmd
cd backend
python init_db_mysql.py
```

This will:
- ✅ Create all database tables
- ✅ Set up indexes
- ✅ Create default roles
- ✅ Create admin user (admin/admin123)
- ✅ Populate categories and locations
- ✅ Create sample data

---

## Part 6: Start Application

### Start MySQL in XAMPP
1. Open **XAMPP Control Panel**
2. Click **Start** next to MySQL
3. Ensure status shows **"Running"** (green)

### Start Application
```cmd
cd backend
python main.py
```

Or use the startup script:
```cmd
start_mysql.bat
```

### Access Application
Open browser: **http://127.0.0.1:8000**

**Default Login:**
- Admin: `admin` / `admin123`
- Student: `john_student` / `student123`
- Staff: `sarah_staff` / `staff123`

---

## Part 7: XAMPP Control Panel Management

### Starting MySQL
- Open XAMPP Control Panel
- Click **Start** button next to MySQL
- Status should turn green

### Stopping MySQL
- Click **Stop** button next to MySQL
- Status will turn red

### MySQL Service Management
- **Start MySQL on Windows Startup**: 
  - Check **"Svc"** checkbox next to MySQL
  - MySQL will start automatically when Windows boots

### View MySQL Logs
- Click **Logs** button next to MySQL
- View error logs and activity

### Configure MySQL
- Click **Config** button next to MySQL
- Select **"my.ini"** to edit MySQL configuration
- Restart MySQL after changes

---

## Part 8: Using phpMyAdmin

### Access phpMyAdmin
1. Start **Apache** in XAMPP (if not running)
2. Open browser: **http://localhost/phpmyadmin**
3. Login with:
   - Username: `root`
   - Password: (your password or leave empty)

### Manage Database
- **View Tables**: Click `student_complaints` in left sidebar
- **Run Queries**: Click "SQL" tab
- **Export Database**: Click "Export" tab
- **Import Database**: Click "Import" tab
- **Browse Data**: Click any table name

### Common Tasks

**View all tables:**
```sql
USE student_complaints;
SHOW TABLES;
```

**View table structure:**
- Click table name in left sidebar
- Click "Structure" tab

**Run custom query:**
- Click "SQL" tab
- Type your query
- Click "Go"

**Backup database:**
- Click `student_complaints` database
- Click "Export" tab
- Choose "Quick" or "Custom"
- Click "Go" to download SQL file

**Restore database:**
- Click "Import" tab
- Choose SQL file
- Click "Go"

---

## Part 9: XAMPP-Specific Configuration

### MySQL Configuration File Location
- **Path**: `C:\xampp\mysql\bin\my.ini`
- Edit this file to change MySQL settings
- **Restart MySQL** after making changes

### Common XAMPP MySQL Settings

Edit `C:\xampp\mysql\bin\my.ini`:

```ini
[mysqld]
# Port
port = 3306

# Maximum connections
max_connections = 200

# Buffer pool size (adjust based on RAM)
innodb_buffer_pool_size = 256M

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Query cache
query_cache_type = 1
query_cache_size = 64M
```

**Restart MySQL** after changes:
1. Stop MySQL in XAMPP Control Panel
2. Start MySQL again

### MySQL Data Directory
- **Location**: `C:\xampp\mysql\data\`
- Contains all database files
- **Backup this folder** to backup all databases

---

## Part 10: Troubleshooting

### MySQL Won't Start in XAMPP

**Problem**: Port 3306 already in use

**Solution 1**: Stop other MySQL services
```cmd
net stop MySQL80
```
Then start MySQL in XAMPP again

**Solution 2**: Change XAMPP MySQL port
1. Edit `C:\xampp\mysql\bin\my.ini`
2. Change `port = 3306` to `port = 3307`
3. Update `config.py`: `MYSQL_PORT: int = 3307`
4. Restart MySQL in XAMPP

**Problem**: MySQL service error

**Solution**:
1. Check XAMPP Control Panel logs
2. Click **Logs** button next to MySQL
3. Look for error messages
4. Common issues:
   - Port conflict
   - Corrupted data files
   - Permission issues

### Application Can't Connect to XAMPP MySQL

**Checklist**:
1. ✅ MySQL is running in XAMPP Control Panel (green status)
2. ✅ Database `student_complaints` exists
3. ✅ Username and password in `config.py` are correct
4. ✅ Port matches (default 3306)

**Test Connection**:
```cmd
mysql -u root -p
```
(Or `mysql -u root` if no password)

If this works, MySQL is running correctly.

### phpMyAdmin Access Denied

**Problem**: Can't login to phpMyAdmin

**Solution**:
1. Check username: `root`
2. Check password (or leave empty if default)
3. If you changed root password, update phpMyAdmin config:
   - File: `C:\xampp\phpMyAdmin\config.inc.php`
   - Find: `$cfg['Servers'][$i]['password']`
   - Update password value

### Database Not Found Error

**Solution**:
1. Open phpMyAdmin
2. Check if `student_complaints` database exists
3. If not, create it (see Part 3)
4. Run `python init_db_mysql.py` again

---

## Part 11: Backup and Restore

### Backup Using phpMyAdmin
1. Open phpMyAdmin
2. Click `student_complaints` database
3. Click **"Export"** tab
4. Choose **"Quick"** method
5. Format: **SQL**
6. Click **"Go"**
7. Save the `.sql` file

### Backup Using Command Line
```cmd
cd C:\xampp\mysql\bin
mysqldump -u root -p student_complaints > backup.sql
```
(Enter password when prompted, or leave empty if no password)

### Restore Using phpMyAdmin
1. Open phpMyAdmin
2. Click `student_complaints` database
3. Click **"Import"** tab
4. Choose your `.sql` file
5. Click **"Go"**

### Restore Using Command Line
```cmd
cd C:\xampp\mysql\bin
mysql -u root -p student_complaints < backup.sql
```

### Backup Entire MySQL Data Directory
1. Stop MySQL in XAMPP
2. Copy folder: `C:\xampp\mysql\data\`
3. Paste to backup location
4. Start MySQL again

---

## Part 12: Security Best Practices

### For Development (Local)
- ✅ Using root without password is OK for local development
- ✅ Keep XAMPP on localhost only
- ✅ Don't expose XAMPP to internet

### For Production
- ⚠️ **NEVER use root user in production**
- ⚠️ **ALWAYS set strong password for root**
- ⚠️ **Create dedicated user** (complaint_admin)
- ⚠️ **Grant only necessary privileges**
- ⚠️ **Change default admin password** in application
- ⚠️ **Regular backups**

### Change Root Password
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'StrongPassword123!';
FLUSH PRIVILEGES;
```

### Create Production User
```sql
CREATE USER 'complaint_admin'@'localhost' 
IDENTIFIED BY 'StrongPassword123!';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER 
ON student_complaints.* 
TO 'complaint_admin'@'localhost';

FLUSH PRIVILEGES;
```

---

## Part 13: Performance Tips

### Optimize XAMPP MySQL
1. Edit `C:\xampp\mysql\bin\my.ini`
2. Add/update these settings:

```ini
[mysqld]
# Increase buffer pool (adjust based on available RAM)
innodb_buffer_pool_size = 512M

# Increase max connections
max_connections = 200

# Enable query cache
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M

# Optimize for applications
thread_cache_size = 16
table_open_cache = 2000
```

3. Restart MySQL in XAMPP

### Monitor Performance
Use phpMyAdmin:
1. Click **"Status"** tab
2. View:
   - Connections
   - Query statistics
   - Server variables
   - Processes

---

## Quick Reference

### XAMPP Control Panel Commands
- **Start MySQL**: Click "Start" button
- **Stop MySQL**: Click "Stop" button
- **View Logs**: Click "Logs" button
- **Configure**: Click "Config" → "my.ini"
- **Open phpMyAdmin**: Click "Admin" button (or http://localhost/phpmyadmin)
- **Open Shell**: Click "Shell" button

### Default XAMPP MySQL Settings
- **Host**: localhost
- **Port**: 3306
- **Root Username**: root
- **Root Password**: (empty by default)
- **Data Directory**: `C:\xampp\mysql\data\`
- **Config File**: `C:\xampp\mysql\bin\my.ini`

### Application Configuration
```python
USE_MYSQL: bool = True
MYSQL_HOST: str = "localhost"
MYSQL_PORT: int = 3306
MYSQL_USER: str = "root"  # or "complaint_admin"
MYSQL_PASSWORD: str = ""  # or your password
MYSQL_DATABASE: str = "student_complaints"
```

---

## Support

### Common Issues
- **MySQL won't start**: Check port 3306, stop other MySQL services
- **Can't connect**: Verify MySQL is running, check credentials
- **Database not found**: Create database in phpMyAdmin
- **Access denied**: Check username/password

### Useful Links
- XAMPP Official: https://www.apachefriends.org/
- phpMyAdmin Docs: https://www.phpmyadmin.net/docs/
- MySQL Docs: https://dev.mysql.com/doc/

---

**🎉 Your Student Complaint Hub is now configured with XAMPP MySQL!**

For more information:
- `docs/MYSQL_SETUP.md` - Standard MySQL setup
- `docs/ADMIN_MANUAL.md` - System administration
- `README.md` - General documentation

