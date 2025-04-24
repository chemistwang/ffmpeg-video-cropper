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
        # 使用FFmpeg命令行参数，而不是ffmpeg-python的高级API
        # 这样更清晰地控制命令行选项
        ffmpeg_cmd = (
            ffmpeg
            .input(input_path)
            .crop(x, y, width, height)
        )
        
        # 如果需要灰度处理，使用格式化滤镜
        if grayscale:
            # 使用format滤镜而不是colorchannelmixer
            ffmpeg_cmd = ffmpeg_cmd.filter('format', 'gray')
            
        # 输出
        ffmpeg_cmd = ffmpeg_cmd.output(output_path, **{'c:a': 'copy'})
        
        # 打印完整命令用于调试
        print(" ".join(ffmpeg_cmd.compile()))
        
        # 执行命令
        ffmpeg_cmd.run(capture_stdout=True, capture_stderr=True, overwrite_output=True)
        
        return {
            "filename": output_filename,
            "url": f"/static/videos/output/{output_filename}"
        }
    except ffmpeg.Error as e:
        # 打印详细错误信息
        error_msg = e.stderr.decode() if e.stderr else str(e)
        print(f"FFmpeg错误: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail=f"FFmpeg error: {error_msg}"
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