#!/bin/bash
# ============================================
# SwiftLoan USA - Quick Start Script
# Run: bash setup.sh
# ============================================

echo "╔════════════════════════════════════════╗"
echo "║   SwiftLoan USA - Quick Setup Script   ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "📦 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装。请从 https://nodejs.org 下载安装。"
    exit 1
fi
echo "✓ Node.js $(node --version) 已安装"

# Check npm
echo "📦 检查 npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装。"
    exit 1
fi
echo "✓ npm $(npm --version) 已安装"

# Install dependencies
echo ""
echo "📥 安装依赖包..."
npm install
if [ $? -eq 0 ]; then
    echo "✓ 依赖包安装完成"
else
    echo "❌ 依赖包安装失败"
    exit 1
fi

# Setup .env file
echo ""
echo "⚙️ 配置环境变量..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ 已创建 .env 文件 (请编辑配置数据库连接)"
else
    echo "⚠️ .env 文件已存在 (跳过)"
fi

# Initialize database
echo ""
echo "🗄️ 初始化数据库..."
node init-db.js

# Show next steps
echo ""
echo "╔════════════════════════════════════════╗"
echo "║         ✅ 设置完成!                   ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "📋 后续步骤:"
echo ""
echo "1️⃣  编辑 .env 文件:"
echo "   - MONGODB_URI: 配置数据库连接"
echo "   - PORT: 设置服务器端口 (默认 5000)"
echo "   - ADMIN_KEY: 设置管理员密钥"
echo ""
echo "2️⃣  启动服务器:"
echo "   npm start"
echo ""
echo "3️⃣  在浏览器打开前端应用:"
echo "   - 用户应用: file:///$(pwd)/index.html"
echo "   - 管理后台: file:///$(pwd)/admin.html"
echo ""
echo "4️⃣  测试 API:"
echo "   - 导入 Postman 集合: postman_collection.json"
echo "   - 或查看: DEPLOYMENT.md"
echo ""
echo "💡 更多信息请查看 DEPLOYMENT.md"
echo ""
