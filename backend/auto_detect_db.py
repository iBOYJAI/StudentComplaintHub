"""
Auto-detect and configure database connection
Automatically detects MySQL/XAMPP and configures the system
"""
import os
import sys
import subprocess
import socket
from pathlib import Path
from app.config import settings
from app.database import engine, SessionLocal, init_db
from sqlalchemy import text

def check_port(host, port, timeout=2):
    """Check if a port is open"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

def test_mysql_connection(host, port, user, password, database=None):
    """Test MySQL connection"""
    try:
        from sqlalchemy import create_engine
        from urllib.parse import quote_plus
        
        encoded_password = quote_plus(password) if password else ''
        
        # If database is None, test server connection only
        if database:
            test_url = f"mysql+pymysql://{user}:{encoded_password}@{host}:{port}/{database}?charset=utf8mb4"
        else:
            test_url = f"mysql+pymysql://{user}:{encoded_password}@{host}:{port}?charset=utf8mb4"
        
        test_engine = create_engine(test_url, pool_pre_ping=True, connect_args={'connect_timeout': 3})
        
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        return False

def detect_xampp_mysql():
    """Detect XAMPP MySQL installation"""
    xampp_paths = [
        Path("C:/xampp/mysql/bin/mysql.exe"),
        Path("C:/xampp64/mysql/bin/mysql.exe"),
        Path("D:/xampp/mysql/bin/mysql.exe"),
        Path("D:/xampp64/mysql/bin/mysql.exe"),
    ]
    
    for path in xampp_paths:
        if path.exists():
            print(f"  ✓ Found XAMPP MySQL at: {path.parent.parent}")
            return True
    return False

def detect_mysql_service():
    """Check if MySQL service is running"""
    try:
        # Check if port 3306 is open
        if check_port('localhost', 3306):
            print("  ✓ MySQL service detected on port 3306")
            return True
    except:
        pass
    return False

def auto_configure_database():
    """Auto-detect and configure database"""
    print("=" * 60)
    print("Auto-Detecting Database Configuration")
    print("=" * 60)
    print()
    
    # Reload settings to get latest config
    try:
        import importlib
        import app.config
        importlib.reload(app.config)
        from app.config import settings as reloaded_settings
        global settings
        settings = reloaded_settings
    except:
        pass
    
    # Check if MySQL is already configured
    if settings.USE_MYSQL:
        print("MySQL is already configured in config.py")
        print(f"  Host: {settings.MYSQL_HOST}:{settings.MYSQL_PORT}")
        print(f"  User: {settings.MYSQL_USER}")
        print(f"  Database: {settings.MYSQL_DATABASE}")
        print()
        
        # Test connection (without database first, then with)
        print("Testing connection...")
        if test_mysql_connection(
            settings.MYSQL_HOST,
            settings.MYSQL_PORT,
            settings.MYSQL_USER,
            settings.MYSQL_PASSWORD,
            None  # Test server connection
        ):
            print("  ✓ Server connection successful!")
            # Now test with database
            if test_mysql_connection(
                settings.MYSQL_HOST,
                settings.MYSQL_PORT,
                settings.MYSQL_USER,
                settings.MYSQL_PASSWORD,
                settings.MYSQL_DATABASE
            ):
                print("  ✓ Database connection successful!")
                return True
            else:
                print("  ⚠ Database doesn't exist, will be created")
                return True
        else:
            print("  ✗ Connection failed. Trying auto-detection...")
            print()
    
    # Try to detect MySQL/XAMPP
    print("Detecting MySQL/XAMPP...")
    
    mysql_detected = detect_mysql_service()
    xampp_detected = detect_xampp_mysql()
    
    if not mysql_detected and not xampp_detected:
        print("  ✗ MySQL/XAMPP not detected")
        print("  → Will use SQLite (default)")
        print()
        return False
    
    # Try common XAMPP configurations
    if xampp_detected or mysql_detected:
        print("  → Attempting to connect with common configurations...")
        print()
        
        configs = [
            # XAMPP default (no password)
            {
                "host": "localhost",
                "port": 3306,
                "user": "root",
                "password": "",
                "database": "student_complaints",
                "name": "XAMPP (root, no password)"
            },
            # Standard MySQL
            {
                "host": "localhost",
                "port": 3306,
                "user": "complaint_admin",
                "password": "ComplaintDB@2024",
                "database": "student_complaints",
                "name": "Standard MySQL (complaint_admin)"
            },
            # Root with common password
            {
                "host": "localhost",
                "port": 3306,
                "user": "root",
                "password": "root",
                "database": "student_complaints",
                "name": "MySQL (root/root)"
            },
        ]
        
        for config in configs:
            print(f"  Trying: {config['name']}...")
            # First test server connection (without database)
            if test_mysql_connection(
                config["host"],
                config["port"],
                config["user"],
                config["password"],
                None  # Test server connection first
            ):
                print(f"  ✓ Server connection successful!")
                print(f"  → Using: {config['name']}")
                print()
                print("Updating config.py...")
                
                # Update config file
                update_config_file(config)
                
                print("  ✓ Configuration updated!")
                print()
                return True
            else:
                print(f"  ✗ Failed")
        
        print()
        print("  ✗ Could not auto-configure MySQL")
        print("  → Will use SQLite (default)")
        print()
        return False
    
    return False

def update_config_file(config):
    """Update config.py with detected settings"""
    config_path = Path(__file__).parent / "app" / "config.py"
    
    if not config_path.exists():
        print("  ✗ config.py not found!")
        return
    
    try:
        import re
        
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update USE_MYSQL
        content = re.sub(
            r'USE_MYSQL:\s*bool\s*=\s*(True|False)',
            'USE_MYSQL: bool = True',
            content
        )
        
        # Update MySQL settings using regex
        content = re.sub(
            r'MYSQL_HOST:\s*str\s*=\s*"[^"]*"',
            f'MYSQL_HOST: str = "{config["host"]}"',
            content
        )
        
        content = re.sub(
            r'MYSQL_PORT:\s*int\s*=\s*\d+',
            f'MYSQL_PORT: int = {config["port"]}',
            content
        )
        
        content = re.sub(
            r'MYSQL_USER:\s*str\s*=\s*"[^"]*"',
            f'MYSQL_USER: str = "{config["user"]}"',
            content
        )
        
        # Handle password (might be empty)
        if config["password"] == "":
            content = re.sub(
                r'MYSQL_PASSWORD:\s*str\s*=\s*"[^"]*"',
                'MYSQL_PASSWORD: str = ""',
                content
            )
        else:
            content = re.sub(
                r'MYSQL_PASSWORD:\s*str\s*=\s*"[^"]*"',
                f'MYSQL_PASSWORD: str = "{config["password"]}"',
                content
            )
        
        content = re.sub(
            r'MYSQL_DATABASE:\s*str\s*=\s*"[^"]*"',
            f'MYSQL_DATABASE: str = "{config["database"]}"',
            content
        )
        
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Reload settings module
        import importlib
        import app.config
        importlib.reload(app.config)
        from app.config import settings as reloaded_settings
        
        # Update global settings reference
        global settings
        settings = reloaded_settings
            
    except Exception as e:
        print(f"  ✗ Error updating config.py: {e}")
        import traceback
        traceback.print_exc()

def create_database_if_not_exists():
    """Create database if it doesn't exist"""
    if not settings.USE_MYSQL:
        return True
    
    try:
        from sqlalchemy import create_engine
        from urllib.parse import quote_plus
        
        # Connect without database to create it
        encoded_password = quote_plus(settings.MYSQL_PASSWORD) if settings.MYSQL_PASSWORD else ''
        server_url = f"mysql+pymysql://{settings.MYSQL_USER}:{encoded_password}@{settings.MYSQL_HOST}:{settings.MYSQL_PORT}?charset=utf8mb4"
        server_engine = create_engine(server_url, pool_pre_ping=True)
        
        with server_engine.connect() as conn:
            # Check if database exists
            result = conn.execute(text(f"SHOW DATABASES LIKE '{settings.MYSQL_DATABASE}'"))
            if result.fetchone() is None:
                print(f"Creating database '{settings.MYSQL_DATABASE}'...")
                conn.execute(text(f"CREATE DATABASE {settings.MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
                conn.commit()
                print("  ✓ Database created!")
            else:
                print(f"  ✓ Database '{settings.MYSQL_DATABASE}' already exists")
        
        return True
    except Exception as e:
        print(f"  ✗ Error creating database: {e}")
        return False

def auto_initialize_database():
    """Auto-initialize database with tables and seed data"""
    print("=" * 60)
    print("Auto-Initializing Database")
    print("=" * 60)
    print()
    
    # Create database if MySQL
    if settings.USE_MYSQL:
        if not create_database_if_not_exists():
            print("  ✗ Failed to create database")
            return False
    
    # Initialize tables
    print("Creating database tables...")
    try:
        init_db()
        print("  ✓ Tables created")
    except Exception as e:
        print(f"  ✗ Error creating tables: {e}")
        return False
    
    # Check if we need to seed data
    print()
    print("Checking for existing data...")
    db = SessionLocal()
    try:
        from app.models import User, Role, Category
        
        # Check if admin user exists
        admin = db.query(User).filter(User.username == 'admin').first()
        if admin:
            print("  ✓ Database already initialized with seed data")
            return True
        
        # Need to seed data
        print("  → Database is empty, initializing seed data...")
        print()
        
        # Import and run initialization
        if settings.USE_MYSQL:
            from init_db_mysql import main as init_mysql
            init_mysql()
        else:
            from init_db import main as init_sqlite
            init_sqlite()
        
        print()
        print("  ✓ Database initialized successfully!")
        return True
        
    except Exception as e:
        print(f"  ✗ Error during initialization: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def main():
    """Main function"""
    print()
    print("=" * 60)
    print("Student Complaint Hub - Auto Database Configuration")
    print("=" * 60)
    print()
    
    # Step 1: Auto-detect and configure
    mysql_configured = auto_configure_database()
    
    # Step 2: Auto-initialize
    if mysql_configured or not settings.USE_MYSQL:
        print()
        success = auto_initialize_database()
        
        if success:
            print()
            print("=" * 60)
            print("✓ Auto-configuration completed successfully!")
            print("=" * 60)
            print()
            print("You can now start the application:")
            print("  python main.py")
            print()
        else:
            print()
            print("=" * 60)
            print("✗ Auto-configuration encountered errors")
            print("=" * 60)
            print()
            print("Please check the errors above and configure manually.")
            print("See docs/MYSQL_SETUP.md for manual setup instructions.")
            print()
    else:
        print()
        print("Using SQLite (default)")
        print("Run 'python init_db.py' to initialize SQLite database")
        print()

if __name__ == "__main__":
    main()

