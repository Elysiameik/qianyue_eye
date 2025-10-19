@echo off
chcp 65001 >nul
title 眼动追踪认知评估系统

echo ============================================================
echo               眼动追踪认知评估系统
echo ============================================================
echo.

REM 检查 Python 是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python，请先安装 Python 3.6+
    echo.
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [信息] 正在启动系统...
echo.

REM 运行 Python 启动脚本
python run.py

if %errorlevel% neq 0 (
    echo.
    echo [错误] 启动失败
    pause
)

