#!/usr/bin/env python3
"""
启动脚本
检查依赖并启动服务器
"""

import os
import sys
import time
import webbrowser
import subprocess
from pathlib import Path

def print_banner():
    """打印欢迎信息"""
    print("=" * 70)
    print("            眼动追踪认知评估系统")
    print("=" * 70)
    print()

def check_python_version():
    """检查 Python 版本"""
    version = sys.version_info
    print(f"✓ Python 版本: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 6):
        print("✗ 错误: 需要 Python 3.6 或更高版本")
        sys.exit(1)

def check_dependencies():
    """检查依赖包"""
    print("\n检查依赖包...")
    
    required_packages = {
        'flask': 'Flask',
        'flask_cors': 'Flask-CORS',
        'numpy': 'numpy',
        'matplotlib': 'matplotlib'
    }
    
    missing_packages = []
    
    for module_name, package_name in required_packages.items():
        try:
            __import__(module_name)
            print(f"  ✓ {package_name}")
        except ImportError:
            print(f"  ✗ {package_name} (未安装)")
            missing_packages.append(package_name)
    
    if missing_packages:
        print(f"\n缺少依赖包: {', '.join(missing_packages)}")
        print("\n请运行以下命令安装依赖:")
        print("  pip install -r requirements.txt")
        print("\n或者手动安装:")
        print(f"  pip install {' '.join(missing_packages)}")
        
        response = input("\n是否现在自动安装? (y/n): ")
        if response.lower() == 'y':
            install_dependencies()
        else:
            sys.exit(1)

def install_dependencies():
    """安装依赖"""
    print("\n正在安装依赖包...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✓ 依赖安装完成")
    except subprocess.CalledProcessError:
        print("✗ 依赖安装失败，请手动安装")
        sys.exit(1)

def check_webgazer():
    """检查 WebGazer.js 是否存在"""
    webgazer_path = Path('./webgazer.js')
    if not webgazer_path.exists():
        print(f"\n⚠ 警告: WebGazer.js 文件不存在")
        print(f"  期望位置: {webgazer_path.absolute()}")
        print("  系统仍可启动，但眼动追踪可能无法工作")
    else:
        print("\n✓ WebGazer.js 已就绪")

def start_server():
    """启动 Flask 服务器"""
    print("\n" + "=" * 70)
    print("启动服务器...")
    print("=" * 70)
    
    # 切换到 backend 目录
    os.chdir('backend')
    
    # 延迟打开浏览器
    def open_browser():
        time.sleep(2)
        print("\n🌐 自动打开浏览器...")
        webbrowser.open('https://localhost:5000')
    
    import threading
    threading.Thread(target=open_browser, daemon=True).start()
    
    # 启动 Flask
    print("\n📡 服务器启动中...\n")
    try:
        from backend.api import app
        app.run(host='0.0.0.0', port=5000, debug=False, ssl_context='adhoc')
    except KeyboardInterrupt:
        print("\n\n服务器已停止")
    except Exception as e:
        print(f"\n✗ 启动失败: {e}")
        sys.exit(1)

def main():
    """主函数"""
    print_banner()
    
    # 检查环境
    check_python_version()
    check_dependencies()
    check_webgazer()
    
    print("\n✓ 所有检查通过，准备启动服务器...")
    time.sleep(1)
    
    # 启动服务器
    start_server()

if __name__ == '__main__':
    main()

