import os
import sys

# 获取应用根目录的绝对路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.join(BASE_DIR, "app")
STATIC_DIR = os.path.join(APP_DIR, "static")
VIDEOS_DIR = os.path.join(STATIC_DIR, "videos")
UPLOADS_DIR = os.path.join(VIDEOS_DIR, "uploads")
OUTPUT_DIR = os.path.join(VIDEOS_DIR, "output")

def check_directory(path, description):
    print(f"\n检查{description}目录: {path}")
    
    # 检查目录是否存在
    if not os.path.exists(path):
        print(f"  - 目录不存在，尝试创建...")
        try:
            os.makedirs(path, exist_ok=True)
            print(f"  - 成功创建目录")
        except Exception as e:
            print(f"  - 创建目录失败: {str(e)}")
            return False
    else:
        print(f"  - 目录已存在")

    # 检查是否是目录
    if not os.path.isdir(path):
        print(f"  - 错误: {path} 不是一个目录")
        return False
    
    # 检查读写权限
    try:
        # 尝试写入测试文件
        test_file = os.path.join(path, "test_write.tmp")
        with open(test_file, 'w') as f:
            f.write("test")
        os.remove(test_file)
        print(f"  - 写入权限: 正常")
    except Exception as e:
        print(f"  - 写入权限问题: {str(e)}")
        return False
    
    # 列出目录内容
    files = os.listdir(path)
    if files:
        print(f"  - 目录内容 ({len(files)} 个文件):")
        for file in files[:5]:  # 只显示前5个文件
            full_path = os.path.join(path, file)
            size = os.path.getsize(full_path) if os.path.isfile(full_path) else "-"
            print(f"    * {file} ({size} 字节)")
        if len(files) > 5:
            print(f"    * ... 以及其他 {len(files)-5} 个文件")
    else:
        print(f"  - 目录为空")
    
    return True

def main():
    print("===== 视频处理应用目录结构检查 =====")
    
    directories = [
        (BASE_DIR, "应用根"),
        (APP_DIR, "app"),
        (STATIC_DIR, "static"),
        (VIDEOS_DIR, "videos"),
        (UPLOADS_DIR, "uploads"),
        (OUTPUT_DIR, "output")
    ]
    
    all_good = True
    for path, desc in directories:
        if not check_directory(path, desc):
            all_good = False
    
    print("\n===== 检查结论 =====")
    if all_good:
        print("所有目录正常，应用应该能够正常处理视频文件。")
    else:
        print("检测到问题，请修复上述问题后再运行应用。")
    
    print("\n路由路径信息:")
    print(f"上传端点: POST /api/videos/upload")
    print(f"裁剪端点: POST /api/videos/crop")
    print(f"下载端点: GET /api/videos/download/{{filename}}")
    
    # 建议使用的绝对路径
    print("\n建议在代码中使用以下路径:")
    print(f"BASE_DIR = {BASE_DIR}")
    print(f"UPLOAD_DIR = {UPLOADS_DIR}")
    print(f"OUTPUT_DIR = {OUTPUT_DIR}")

if __name__ == "__main__":
    main() 