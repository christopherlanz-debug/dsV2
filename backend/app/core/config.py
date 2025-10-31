from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "mysql+pymysql://dsuser:dspassword123@mysql:3306/digital_signage"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # File Upload
    UPLOAD_DIR: str = "/storage/uploads"
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    MAX_PDF_SIZE: int = 50 * 1024 * 1024  # 50MB für PDFs
    ALLOWED_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".gif", ".mp4", ".webm", ".pdf"}
    
    # PDF Processing
    PDF_QUALITY: int = 100  # JPEG quality for UHD screens
    PDF_DPI: int = 300  # DPI for PDF conversion (für UHD)
    MAX_PDF_PAGES: int = 500  # Max pages per PDF
    
    # Application
    PROJECT_NAME: str = "Digital Signage"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
