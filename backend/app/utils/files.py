import os
import hashlib
import mimetypes
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image
from fastapi import UploadFile, HTTPException
from ..config import settings

def get_file_hash(content: bytes) -> str:
    """Generate SHA256 hash of file content"""
    return hashlib.sha256(content).hexdigest()

def get_safe_filename(filename: str) -> str:
    """Generate safe filename by removing unsafe characters"""
    safe_name = "".join(c for c in filename if c.isalnum() or c in "._- ")
    return safe_name.strip()

def validate_file_extension(filename: str) -> bool:
    """Validate file extension against allowed list"""
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    return ext in settings.ALLOWED_EXTENSIONS

def validate_file_size(size: int) -> bool:
    """Validate file size against maximum allowed"""
    return size <= settings.MAX_UPLOAD_SIZE

def get_mime_type(filename: str) -> str:
    """Get MIME type from filename"""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or "application/octet-stream"

def is_image(mime_type: str) -> bool:
    """Check if file is an image"""
    return mime_type.startswith('image/')

async def save_upload_file(upload_file: UploadFile, subfolder: str = "") -> Tuple[str, str, int, str]:
    """
    Save uploaded file to disk
    Returns: (stored_filename, file_path, file_size, mime_type)
    """
    # Read file content
    content = await upload_file.read()
    file_size = len(content)
    
    # Validate
    if not validate_file_extension(upload_file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    if not validate_file_size(file_size):
        raise HTTPException(status_code=400, detail=f"File size exceeds {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB limit")
    
    # Generate unique filename
    file_hash = get_file_hash(content)
    ext = upload_file.filename.rsplit('.', 1)[-1].lower() if '.' in upload_file.filename else ''
    stored_filename = f"{file_hash}.{ext}"
    
    # Create directory
    save_dir = settings.UPLOAD_DIR / subfolder
    save_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = save_dir / stored_filename
    with open(file_path, 'wb') as f:
        f.write(content)
    
    mime_type = get_mime_type(upload_file.filename)
    
    return stored_filename, str(file_path), file_size, mime_type

def create_thumbnail(image_path: str, thumbnail_path: str, size: Tuple[int, int] = (200, 200)) -> bool:
    """Create thumbnail from image"""
    try:
        with Image.open(image_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Create directory if needed
            Path(thumbnail_path).parent.mkdir(parents=True, exist_ok=True)
            
            img.save(thumbnail_path, 'JPEG', quality=85)
            return True
    except Exception as e:
        print(f"Thumbnail creation failed: {e}")
        return False

def delete_file(file_path: str) -> bool:
    """Delete file from disk"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
    except Exception as e:
        print(f"File deletion failed: {e}")
    return False

def get_file_size_human(size: int) -> str:
    """Convert file size to human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024.0:
            return f"{size:.2f} {unit}"
        size /= 1024.0
    return f"{size:.2f} TB"

async def process_attachment(upload_file: UploadFile, subfolder: str = "complaints") -> dict:
    """
    Process attachment: save, create thumbnail if image
    Returns dict with file info
    """
    stored_filename, file_path, file_size, mime_type = await save_upload_file(upload_file, subfolder)
    
    result = {
        "filename": upload_file.filename,
        "stored_filename": stored_filename,
        "file_path": file_path,
        "file_size": file_size,
        "mime_type": mime_type,
        "thumbnail_path": None
    }
    
    # Create thumbnail for images
    if is_image(mime_type):
        thumbnail_dir = settings.UPLOAD_DIR / subfolder / "thumbnails"
        thumbnail_dir.mkdir(parents=True, exist_ok=True)
        thumbnail_path = str(thumbnail_dir / stored_filename)
        
        if create_thumbnail(file_path, thumbnail_path):
            result["thumbnail_path"] = thumbnail_path
    
    return result
