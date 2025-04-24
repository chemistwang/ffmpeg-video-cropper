import uvicorn
import os
import sys

# 检查必要的目录
def check_and_create_dirs():
    # 获取应用根目录的绝对路径
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    APP_DIR = os.path.join(BASE_DIR, "app")
    STATIC_DIR = os.path.join(APP_DIR, "static")
    VIDEOS_DIR = os.path.join(STATIC_DIR, "videos")
    UPLOADS_DIR = os.path.join(VIDEOS_DIR, "uploads")
    OUTPUT_DIR = os.path.join(VIDEOS_DIR, "output")
    
    print("===== 初始化应用 =====")
    print(f"应用根目录: {BASE_DIR}")
    
    # 确保所有必要的目录存在
    for path in [APP_DIR, STATIC_DIR, VIDEOS_DIR, UPLOADS_DIR, OUTPUT_DIR]:
        if not os.path.exists(path):
            print(f"创建目录: {path}")
            os.makedirs(path, exist_ok=True)
        else:
            print(f"目录已存在: {path}")
    
    print("===== 目录初始化完成 =====")

if __name__ == "__main__":
    # 检查并创建必要的目录
    check_and_create_dirs()
    
    print("启动 FastAPI 服务器...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 