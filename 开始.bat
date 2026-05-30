@echo off
title Poker App Runner

:: 检查 node_modules 文件夹是否存在
if exist "node_modules\" (
    echo ==========================================
    echo Dependencies found. Skipping install...
    echo ==========================================
    goto RUN_DEV
)

:: 如果不存在，则执行安装
echo ==========================================
echo First run detected. Installing dependencies...
echo ==========================================
call npm install

:: 检查安装是否成功
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] npm install failed. Please check your internet or Node.js installation.
    pause
    exit /b
)

:RUN_DEV
echo.
echo Starting the application...
echo ==========================================
npm run dev

:: 防止窗口意外关闭（虽然 npm run dev 通常会挂起，但加一句保险）
pause