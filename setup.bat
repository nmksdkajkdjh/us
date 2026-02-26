@echo off
REM ============================================
REM SwiftLoan USA - Quick Start Script (Windows)
REM Run: setup.bat
REM ============================================

setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

echo.
echo ╔════════════════════════════════════════╗
echo ║   SwiftLoan USA - Quick Setup Script   ║
echo ║           For Windows                  ║
echo ╚════════════════════════════════════════╝
echo.

REM Check Node.js
echo 📦 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装。
    echo 请从 https://nodejs.org 下载安装。
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% 已安装

REM Check npm
echo 📦 检查 npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm 未安装。
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm %NPM_VERSION% 已安装

REM Install dependencies
echo.
echo 📥 安装依赖包...
call npm install
if errorlevel 1 (
    echo ❌ 依赖包安装失败
    pause
    exit /b 1
)
echo ✓ 依赖包安装完成

REM Setup .env file
echo.
echo ⚙️ 配置环境变量...
if not exist .env (
    copy .env.example .env >nul
    echo ✓ 已创建 .env 文件 (请编辑配置数据库连接)
) else (
    echo ⚠️ .env 文件已存在 (跳过)
)

REM Setup MongoDB check
echo.
echo 🗄️ 检查 MongoDB...
mongod --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️ MongoDB 未安装 (本地)
    echo 💡 提示: 使用 MongoDB Atlas (云端) 或安装本地 MongoDB
    echo   下载: https://www.mongodb.com/try/download/community
) else (
    echo ✓ MongoDB 已安装
)

echo.
echo ╔════════════════════════════════════════╗
echo ║         ✅ 设置完成!                   ║
echo ╚════════════════════════════════════════╝
echo.
echo 📋 后续步骤:
echo.
echo 1️⃣  编辑 .env 文件:
echo    - MONGODB_URI: 配置数据库连接
echo    - PORT: 设置服务器端口 (默认 5000)
echo    - ADMIN_KEY: 设置管理员密钥
echo.
echo 2️⃣  启动 MongoDB (如使用本地数据库):
echo    mongod
echo.
echo 3️⃣  初始化数据库:
echo    node init-db.js
echo.
echo 4️⃣  启动服务器:
echo    npm start
echo.
echo 5️⃣  在浏览器打开前端应用:
echo    - 用户应用: file:///D:/procket/money/index.html
echo    - 管理后台: file:///D:/procket/money/admin.html
echo.
echo 6️⃣  测试 API:
echo    - 使用 Postman 导入: postman_collection.json
echo    - 或查看详细说明: DEPLOYMENT.md
echo.
echo 💡 更多信息请查看 DEPLOYMENT.md
echo.
pause
