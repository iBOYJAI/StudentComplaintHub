# MySQL Setup Guide for Student Complaint Hub

## Step 1: Download and Install MySQL

### Download MySQL
1. Go to: https://dev.mysql.com/downloads/installer/
2. Download **MySQL Installer for Windows** (mysql-installer-community-8.0.xx.msi)
3. Choose the larger file (~400MB) - "Windows (x86, 32-bit), MSI Installer"

### Install MySQL
1. **Run the installer** as Administrator
2. **Choose Setup Type**: Select "Custom"
3. **Select Products**:
   - MySQL Server 8.0.xx (latest)
   - MySQL Workbench 8.0.xx (for database management)
   - MySQL Shell (optional but recommended)
4. Click **Next** and **Execute** to download/install

### Configure MySQL Server
1. **Type and Networking**:
   - Config Type: Development Computer
   - Port: 3306 (default)
   - Check "Open Windows Firewall port for network access"

2. **Authentication Method**:
   - Select: "Use Strong Password Encryption"

3. **Accounts and Roles**:
   - Set **Root Password**: Choose a strong password (e.g., `ComplaintHub@2024`)
   - **IMPORTANT**: Remember this password!
   - Optionally create a dedicated user:
     - Username: `complaint_admin`
     - Password: `ComplaintDB@2024`
     - Role: DB Admin

4. **Windows Service**:
   - Service Name: MySQL80
   - Check "Start MySQL Server at System Startup"
   - Run Windows Service as: Standard System Account

5. Click **Execute** to apply configuration
6. Click **Finish**

### Verify Installation
Open Command Prompt and test:
```cmd
mysql --version
```

Should show: `mysql  Ver 8.0.xx`

## Step 2: Create Database for Application

### Using Command Line
```cmd
mysql -u root -p
```
Enter your root password, then:

```sql
-- Create database
CREATE DATABASE student_complaints CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user (recommended)
CREATE USER 'complaint_admin'@'localhost' IDENTIFIED BY 'ComplaintDB@2024';

-- Grant privileges
GRANT ALL PRIVILEGES ON student_complaints.* TO 'complaint_admin'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;

-- Exit
EXIT;
```

### Using MySQL Workbench (GUI)
1. Open MySQL Workbench
2. Click on "Local instance MySQL80"
3. Enter root password
4. Click "Create Schema" icon (database icon with +)
5. Schema Name: `student_complaints`
6. Charset: `utf8mb4`
7. Collation: `utf8mb4_unicode_ci`
8. Click "Apply"

## Step 3: Configure Application

### Update Configuration File
Edit `backend/app/config.py`:

```python
# MySQL Configuration
MYSQL_HOST = "localhost"
MYSQL_PORT = 3306
MYSQL_USER = "complaint_admin"
MYSQL_PASSWORD = "ComplaintDB@2024"
MYSQL_DATABASE = "student_complaints"

# Database URL
DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"
```

### Install MySQL Driver
```cmd
cd backend
pip install pymysql cryptography
```

## Step 4: Initialize Database

```cmd
cd backend
python init_db_mysql.py
```

This will:
- Create all tables
- Set up indexes
- Create default roles
- Create admin user
- Populate categories and locations
- Create sample data

## Step 5: Start Application

```cmd
python main.py
```

Or use the new startup script:
```cmd
cd..
start_mysql.bat
```

## MySQL Management

### Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to Local instance
3. Navigate to "student_complaints" schema
4. View tables, run queries, manage data

### Common MySQL Commands

**View all tables:**
```sql
USE student_complaints;
SHOW TABLES;
```

**View table structure:**
```sql
DESCRIBE users;
DESCRIBE complaints;
```

**Check data:**
```sql
SELECT * FROM users;
SELECT * FROM complaints;
```

**Backup database:**
```cmd
mysqldump -u complaint_admin -p student_complaints > backup.sql
```

**Restore database:**
```cmd
mysql -u complaint_admin -p student_complaints < backup.sql
```

## Performance Optimization

### Enable Query Caching (add to my.ini)
```ini
[mysqld]
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M
```

### Optimize for Applications
```sql
-- Enable InnoDB optimizations
SET GLOBAL innodb_buffer_pool_size = 256M;
SET GLOBAL max_connections = 200;
```

## Security Best Practices

1. **Never use root user in application**
   - Always use dedicated user (complaint_admin)

2. **Strong passwords**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols

3. **Regular backups**
   - Schedule daily automated backups
   - Store backups securely

4. **Monitor logs**
   - Check MySQL error log regularly
   - Location: MySQL data directory

5. **Update regularly**
   - Keep MySQL updated to latest stable version

## Troubleshooting

### Can't connect to MySQL
- Check MySQL service is running:
  ```cmd
  services.msc
  ```
  Find "MySQL80" and ensure it's "Running"

### Access denied errors
- Verify username and password in config.py
- Check user privileges:
  ```sql
  SHOW GRANTS FOR 'complaint_admin'@'localhost';
  ```

### Port 3306 already in use
- Check if another MySQL instance is running
- Or change port in MySQL config and application config

### MySQL Workbench won't connect
- Ensure MySQL service is running
- Check Windows Firewall settings
- Verify credentials

## MySQL Service Management

### Start MySQL Service
```cmd
net start MySQL80
```

### Stop MySQL Service
```cmd
net stop MySQL80
```

### Restart MySQL Service
```cmd
net stop MySQL80
net start MySQL80
```

### Set to start automatically (if not already)
```cmd
sc config MySQL80 start= auto
```

## Monitoring and Maintenance

### Check Database Size
```sql
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'student_complaints'
GROUP BY table_schema;
```

### View Active Connections
```sql
SHOW PROCESSLIST;
```

### Optimize Tables (run monthly)
```sql
USE student_complaints;
OPTIMIZE TABLE users, complaints, comments, attachments;
```

---

**MySQL is now ready for production use with your Student Complaint Hub!**
