import os
import uuid
import ffmpeg
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from typing import Optional
import aiofiles
import shutil
from fastapi.logger import logger

router = APIRouter(
    prefix="/api/videos",
    tags=["videos"],
)

# 使用绝对路径确保正确定位文件
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "videos", "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "static", "videos", "output")

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

@router.post("/upload")
async def upload_video(video: UploadFile = File(...)):
    """Upload a video file"""
    if not video.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Generate a unique filename with the original extension
    filename = f"{uuid.uuid4()}{os.path.splitext(video.filename)[1]}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Save the uploaded file
    async with aiofiles.open(file_path, "wb") as buffer:
        # Read in chunks to handle large files
        while content := await video.read(1024 * 1024):
            await buffer.write(content)
    
    return {
        "filename": filename,
        "url": f"/static/videos/uploads/{filename}"
    }

@router.post("/crop")
async def crop_video(
    filename: str = Form(...),
    x: int = Form(...),
    y: int = Form(...),
    width: int = Form(...),
    height: int = Form(...),
    grayscale: bool = Form(False)
):
    """Crop a video using FFmpeg"""
    input_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(input_path):
        raise HTTPException(status_code=404, detail="Video not found")
    
    # 如果是字符串，需要转换为布尔值
    if isinstance(grayscale, str):
        grayscale = grayscale.lower() == 'true'
    
    # Generate output filename
    prefix = "grayscale_" if grayscale else "cropped_"
    output_filename = f"{prefix}{uuid.uuid4()}{os.path.splitext(filename)[1]}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    try:
        # Prepare ffmpeg command
        stream = ffmpeg.input(input_path)
        
        # Apply crop
        stream = stream.crop(x, y, width, height)
        
        # Apply grayscale if requested
        if grayscale:
            stream = stream.filter('colorchannelmixer', 
                                  r='0.299', g='0.587', b='0.114',
                                  rr='1', gg='1', bb='1')
            # Alternative approach using format filter:
            # stream = stream.filter('format', 'gray')
        
        # Output processed video
        stream = stream.output(output_path)
        
        # Run ffmpeg command
        stream.run(capture_stdout=True, capture_stderr=True, overwrite_output=True)
        
        return {
            "filename": output_filename,
            "url": f"/static/videos/output/{output_filename}"
        }
    except ffmpeg.Error as e:
        # Handle FFmpeg error
        raise HTTPException(
            status_code=500,
            detail=f"FFmpeg error: {e.stderr.decode() if e.stderr else str(e)}"
        )

@router.get("/download/{filename}")
async def download_video(filename: str):
    """Download a cropped video"""
    file_path = os.path.join(OUTPUT_DIR, filename)
    
    # 调试信息
    print(f"尝试下载文件: {file_path}")
    if not os.path.exists(file_path):
        print(f"文件不存在: {file_path}")
        raise HTTPException(status_code=404, detail=f"Video not found at {file_path}")
    else:
        print(f"文件存在，大小: {os.path.getsize(file_path)} 字节")
    
    # 确定视频类型
    content_type = "video/mp4"  # 默认类型
    if filename.lower().endswith(".avi"):
        content_type = "video/x-msvideo"
    elif filename.lower().endswith(".mov"):
        content_type = "video/quicktime"
    elif filename.lower().endswith(".webm"):
        content_type = "video/webm"
    
    # 使用FileResponse以附件形式返回文件
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache"
        }
    ) 