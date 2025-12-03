import os
import pymysql
from pathlib import Path

def detect_mysql():
    """Auto-detect MySQL/XAMPP installation and return connection string"""
    
    # Try XAMPP locations
    xampp_paths = [
        'C:/xampp/mysql/bin/mysql.exe',
        'C:/xampp/mysql/bin/mysqld.exe',
        '/opt/lampp/bin/mysql',
        '/Applications/XAMPP/xamppfiles/bin/mysql'
    ]
    
    xampp_found = any(os.path.exists(path) for path in xampp_paths)
    
    # Test MySQL connections
    test_configs = [
        # XAMPP default
        {'host': 'localhost', 'port': 3306, 'user': 'root', 'password': ''},
        # Standard MySQL
        {'host': 'localhost', 'port': 3306, 'user': 'root', 'password': 'root'},
        {'host': '127.0.0.1', 'port': 3306, 'user': 'root', 'password': ''},
    ]
    
    for config in test_configs:
        try:
            connection = pymysql.connect(
                host=config['host'],
                port=config['port'],
                user=config['user'],
                password=config['password'],
                connect_timeout=3
            )
            
            # Try to create database
            try:
                with connection.cursor() as cursor:
                    cursor.execute("CREATE DATABASE IF NOT EXISTS student_complaints CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
                    connection.commit()
                    print(f"✓ MySQL detected at {config['host']}:{config['port']}")
                    print(f"✓ Database 'student_complaints' created/verified")
            except Exception as e:
                print(f"Warning: Could not create database: {e}")
            
            connection.close()
            
            # Return SQLAlchemy connection string
            password_part = f":{config['password']}" if config['password'] else ""
            return f"mysql+pymysql://{config['user']}{password_part}@{config['host']}:{config['port']}/student_complaints?charset=utf8mb4"
            
        except Exception as e:
            continue
    
    # Fallback to SQLite
    print("⚠ MySQL not detected, using SQLite")
    db_path = Path(__file__).resolve().parent.parent.parent.parent / 'database' / 'complaints.db'
    db_path.parent.mkdir(exist_ok=True)
    return f"sqlite:///{db_path}"


def get_database_uri():
    """Get database URI with auto-detection"""
    # Check environment variable first
    if os.environ.get('DATABASE_URL'):
        return os.environ.get('DATABASE_URL')
    
    # Auto-detect
    return detect_mysql()
