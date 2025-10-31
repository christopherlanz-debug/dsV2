import os
import uuid
from pathlib import Path
from typing import Tuple, List
from fastapi import UploadFile
from PIL import Image
import io
import re

# PDF conversion imports
try:
    from pdf2image import convert_from_path
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

from app.core.config import settings
from app.models.content import ContentType


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to be safe for filesystem"""
    # Remove extension
    name = Path(filename).stem
    
    # Keep only alphanumeric, hyphens, underscores
    name = re.sub(r'[^a-zA-Z0-9._-]', '_', name)
    
    # Remove multiple underscores
    name = re.sub(r'_+', '_', name)
    
    # Limit length to 50 characters (plus extension)
    name = name[:50]
    
    return name


def get_content_type_from_extension(filename: str) -> ContentType:
    """Determine content type from file extension"""
    ext = Path(filename).suffix.lower()
    
    if ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
        return ContentType.IMAGE
    elif ext in ['.mp4', '.webm', '.avi', '.mov', '.mkv']:
        return ContentType.VIDEO
    elif ext in ['.pdf']:
        return ContentType.PDF
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def generate_unique_filename(original_filename: str, use_original: bool = True, suffix: str = "") -> str:
    """Generate unique filename
    
    Args:
        original_filename: Original filename
        use_original: If True, use original filename (sanitized)
        suffix: Additional suffix (e.g., for thumbnails)
    """
    ext = Path(original_filename).suffix
    
    if use_original:
        # Use original filename, sanitized
        base_name = sanitize_filename(original_filename)
        unique_id = str(uuid.uuid4().hex[:8])  # Short UUID
        if suffix:
            return f"{base_name}_{unique_id}{suffix}{ext}"
        return f"{base_name}_{unique_id}{ext}"
    else:
        # Use UUID (old behavior)
        unique_id = uuid.uuid4().hex
        if suffix:
            return f"{unique_id}{suffix}{ext}"
        return f"{unique_id}{ext}"


async def save_upload_file(upload_file: UploadFile) -> Tuple[str, str, int]:
    """
    Save uploaded file to storage
    
    Returns:
        Tuple of (file_path, unique_filename, file_size)
    """
    # Generate unique filename using original name
    unique_filename = generate_unique_filename(upload_file.filename, use_original=True)
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    # Save file
    file_size = 0
    with open(file_path, "wb") as f:
        while chunk := await upload_file.read(8192):
            f.write(chunk)
            file_size += len(chunk)
    
    return file_path, unique_filename, file_size


def convert_pdf_to_images(pdf_path: str, content_id: int, original_filename: str) -> List[Tuple[str, str]]:
    """
    Convert PDF to JPEG images (one per page)
    
    Args:
        pdf_path: Path to PDF file
        content_id: Content ID for naming
        original_filename: Original PDF filename
        
    Returns:
        List of (file_path, filename) tuples
    """
    if not PDF_SUPPORT:
        raise ImportError("pdf2image is not installed")
    
    images = []
    base_name = sanitize_filename(original_filename)
    
    try:
        # Convert PDF pages to images
        page_images = convert_from_path(
            pdf_path,
            dpi=settings.PDF_DPI,
            fmt='jpeg'
        )
        
        if len(page_images) > settings.MAX_PDF_PAGES:
            raise ValueError(f"PDF has {len(page_images)} pages, max is {settings.MAX_PDF_PAGES}")
        
        # Save each page as JPEG
        for page_num, image in enumerate(page_images, 1):
            filename = f"{base_name}_page_{page_num}.jpg"
            file_path = os.path.join(settings.UPLOAD_DIR, filename)
            
            # Save with 100% quality for UHD screens
            image.save(file_path, 'JPEG', quality=settings.PDF_QUALITY, optimize=False)
            
            images.append((file_path, filename))
        
        return images
    
    except Exception as e:
        # Cleanup on error
        for _, filename in images:
            delete_file(os.path.join(settings.UPLOAD_DIR, filename))
        raise ValueError(f"Error converting PDF: {str(e)}")


def get_pdf_page_count(pdf_path: str) -> int:
    """Get number of pages in PDF"""
    if not PDF_SUPPORT:
        return 0
    
    try:
        import PyPDF2
        with open(pdf_path, 'rb') as f:
            pdf_reader = PyPDF2.PdfReader(f)
            return len(pdf_reader.pages)
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return 0


def create_thumbnail(image_path: str, thumbnail_path: str, size: Tuple[int, int] = (300, 200)):
    """Create thumbnail for image"""
    try:
        with Image.open(image_path) as img:
            img.thumbnail(size)
            img.save(thumbnail_path, "JPEG", quality=85)
        return thumbnail_path
    except Exception as e:
        print(f"Error creating thumbnail: {e}")
        return None


def delete_file(file_path: str):
    """Delete file from storage"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
    except Exception as e:
        print(f"Error deleting file: {e}")
    return False


def delete_multiple_files(file_paths: List[str]):
    """Delete multiple files"""
    for file_path in file_paths:
        delete_file(file_path)
