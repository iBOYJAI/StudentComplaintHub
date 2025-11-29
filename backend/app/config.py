import os
from pathlib import Path
from urllib.parse import quote_plus
from pydantic_settings import BaseSettings

# Project root directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    """Application settings"""
    
    # App settings
    APP_NAME: str = "Student Complaint & Resolution Hub"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Server settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # Database Configuration
    # Set USE_MYSQL=True to use MySQL, False to use SQLite
    USE_MYSQL: bool = True
    
    # MySQL Configuration (only used if USE_MYSQL=True)
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "complaint_admin"
    MYSQL_PASSWORD: str = "ComplaintDB@2024"
    MYSQL_DATABASE: str = "student_complaints"
    
    # Database URL - automatically switches based on USE_MYSQL
    @property
    def DATABASE_URL(self) -> str:
        if self.USE_MYSQL:
            # URL-encode password to handle special characters like @
            encoded_password = quote_plus(self.MYSQL_PASSWORD)
            return f"mysql+pymysql://{self.MYSQL_USER}:{encoded_password}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}?charset=utf8mb4"
        else:
            return f"sqlite:///{BASE_DIR}/database/complaints.db"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    PIN_EXPIRE_MINUTES: int = 60
    
    # File storage
    UPLOAD_DIR: Path = BASE_DIR / "attachments"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {
        "jpg", "jpeg", "png", "gif", "pdf", 
        "doc", "docx", "xls", "xlsx", "txt", "mp4", "avi"
    }
    
    # Backup
    BACKUP_DIR: Path = BASE_DIR / "backups"
    BACKUP_PASSWORD: str = "change-this-backup-password"
    
    # Logs
    LOG_DIR: Path = BASE_DIR / "logs"
    
    # SLA defaults (minutes)
    DEFAULT_SLA_LOW: int = 10080  # 7 days
    DEFAULT_SLA_MEDIUM: int = 4320  # 3 days
    DEFAULT_SLA_HIGH: int = 1440  # 1 day
    DEFAULT_SLA_URGENT: int = 240  # 4 hours
    
    class Config:
        case_sensitive = True
        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Ensure directories exist
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        self.LOG_DIR.mkdir(parents=True, exist_ok=True)

settings = Settings()
