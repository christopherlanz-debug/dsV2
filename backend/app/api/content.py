from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import os

from app.core.database import get_db
from app.models.user import User
from app.models.content import Content, ContentItem, ContentType
from app.schemas.content import ContentResponse, ContentUpdate, ContentUploadResponse, ContentItemResponse
from app.api.deps import get_current_active_user, get_current_admin_user
from app.utils.file_handler import (
    save_upload_file,
    get_content_type_from_extension,
    create_thumbnail,
    delete_file,
    delete_multiple_files,
    convert_pdf_to_images,
    get_pdf_page_count,
    sanitize_filename
)
from app.core.config import settings

router = APIRouter()


@router.get("", response_model=List[ContentResponse])
async def list_content(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all content"""
    content = db.query(Content).offset(skip).limit(limit).all()
    return content


@router.post("", response_model=ContentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_content(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(None),
    duration: int = Form(10),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload new content (Images, PDFs, Videos)"""
    
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_ext} not allowed"
        )
    
    # Determine content type
    try:
        content_type = get_content_type_from_extension(file.filename)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Save file
    try:
        file_path, unique_filename, file_size = await save_upload_file(file)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Create database record
    db_content = Content(
        title=title,
        description=description,
        file_path=file_path,
        file_name=unique_filename,
        file_size=file_size,
        content_type=content_type,
        mime_type=file.content_type,
        duration=duration,
        created_by=current_user.id
    )
    
    db.add(db_content)
    db.flush()  # Get the ID
    
    # Handle PDF: Convert to JPEG pages
    if content_type == ContentType.PDF:
        try:
            # Get page count
            page_count = get_pdf_page_count(file_path)
            db_content.pdf_page_count = page_count
            
            if page_count == 0:
                raise ValueError("Cannot read PDF or PDF is empty")
            
            # Convert PDF to images with original filename
            image_paths = convert_pdf_to_images(file_path, db_content.id, file.filename)
            
            # Create ContentItem for each page
            for page_num, (img_path, img_filename) in enumerate(image_paths, 1):
                content_item = ContentItem(
                    content_id=db_content.id,
                    item_number=page_num,
                    file_path=img_path,
                    mime_type="image/jpeg",
                    duration=duration
                )
                db.add(content_item)
            
            # Create thumbnail from first page
            first_page_path = image_paths[0][0]
            base_name = sanitize_filename(file.filename)
            thumbnail_filename = f"{base_name}_thumb.jpg"
            thumbnail_path = os.path.join(settings.UPLOAD_DIR, thumbnail_filename)
            create_thumbnail(first_page_path, thumbnail_path, size=(300, 400))
            db_content.thumbnail_path = thumbnail_path
            
        except Exception as e:
            # Cleanup on error
            delete_file(file_path)
            db.delete(db_content)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to process PDF: {str(e)}"
            )
    
    # Handle Image: Create thumbnail
    elif content_type == ContentType.IMAGE:
        base_name = sanitize_filename(file.filename)
        thumbnail_filename = f"{base_name}_thumb.jpg"
        thumbnail_path = os.path.join(settings.UPLOAD_DIR, thumbnail_filename)
        create_thumbnail(file_path, thumbnail_path)
        db_content.thumbnail_path = thumbnail_path
        
        # Single image = single item
        content_item = ContentItem(
            content_id=db_content.id,
            item_number=1,
            file_path=file_path,
            mime_type=file.content_type,
            duration=duration
        )
        db.add(content_item)
    
    db.commit()
    db.refresh(db_content)
    
    # Reload items
    db.refresh(db_content)
    items_count = len(db_content.items)
    
    return {
        "id": db_content.id,
        "title": db_content.title,
        "file_name": db_content.file_name,
        "content_type": db_content.content_type,
        "pdf_page_count": db_content.pdf_page_count,
        "items_count": items_count,
        "message": f"Content uploaded successfully ({items_count} items)"
    }


@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get content by ID with all items"""
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    return content


@router.get("/{content_id}/items", response_model=List[ContentItemResponse])
async def get_content_items(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all items for a content (e.g., PDF pages)"""
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    items = db.query(ContentItem).filter(ContentItem.content_id == content_id).order_by(ContentItem.item_number).all()
    return items


@router.put("/{content_id}", response_model=ContentResponse)
async def update_content(
    content_id: int,
    content_update: ContentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update content metadata"""
    db_content = db.query(Content).filter(Content.id == content_id).first()
    if not db_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    update_data = content_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_content, field, value)
    
    db.commit()
    db.refresh(db_content)
    
    return db_content


@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete content and all related items"""
    db_content = db.query(Content).filter(Content.id == content_id).first()
    if not db_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    # Get all items to delete their files
    items = db.query(ContentItem).filter(ContentItem.content_id == content_id).all()
    files_to_delete = [item.file_path for item in items]
    
    # Delete main file
    files_to_delete.append(db_content.file_path)
    
    # Delete thumbnail
    if db_content.thumbnail_path:
        files_to_delete.append(db_content.thumbnail_path)
    
    # Delete from database
    db.delete(db_content)
    db.commit()
    
    # Delete files from storage
    delete_multiple_files(files_to_delete)
    
    return None
