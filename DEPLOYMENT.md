# 🚀 SwiftLoan USA - 完整部署指南

## 📋 项目结构

```
d:\procket\money\
├── index.html          ← 用户H5应用 (前端)
├── admin.html          ← 管理后台 (前端)
├── server.js           ← Node.js API服务器 (后端)
├── package.json        ← 项目依赖配置
├── .env.example        ← 环境变量模板
├── README.md           ← 本文件
└── database/           ← MongoDB数据库 (可选)
```

---

## 🌟 核心架构

### 前端 (Frontend)
- **index.html**: 用户申请表单
  - 4步骤表单流程（个人信息 → 文件上传 → 工作信息 → 审查）
  - 实时表单验证（SSN, Phone, Email, Age）
  - 驾照照片捕获（前后镜头）
  - 收入证明上传
  - 银行账户信息
  - 智能信用检查模拟
  - 批准/拒绝结果展示

- **admin.html**: 管理员控制台
  - 登录认证（密码: admin123）
  - 仪表板统计（总申请数、批准数、拒绝数、总额度）
  - 申请数据表格（可搜索、可排序）
  - 详细申请模态窗（含文件预览）
  - 数据导出功能

### 后端 (Backend)
- **server.js**: Express API 服务器
  - RESTful API端点
  - MongoDB 数据持久化
  - 收入级别智能批准逻辑
  - 信用检查模拟
  - 管理员认证

---

## 📥 前置要求

### 开发环境
- **Node.js** v14.0+ ([下载](https://nodejs.org))
- **npm** v6.0+ (随Node.js一起安装)
- **MongoDB** (本地或云端)
  - 本地: [MongoDB Community](https://www.mongodb.com/try/download/community)
  - 云端: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (推荐)

### 推荐浏览器
- Chrome/Edge (最新版)
- Firefox (最新版)
- Safari (iOS 12+)

---

## ⚙️ 安装步骤

### 1️⃣ 克隆/下载项目
```bash
cd d:\procket\money
```

### 2️⃣ 安装依赖
```bash
npm install
```

### 3️⃣ 配置环境变量
```bash
# 复制示例文件
copy .env.example .env

# 编辑 .env 文件，添加配置
```

**最小配置** (.env):
```
MONGODB_URI=mongodb://localhost:27017
PORT=5000
ADMIN_KEY=your_secure_admin_key
```

### 4️⃣ 启动 MongoDB
**本地方式**:
```bash
# Windows
mongod

# macOS/Linux
brew services start mongodb-community
```

**云端方式** (MongoDB Atlas):
- 在 MongoDB Atlas 创建免费集群
- 获取连接字符串
- 在 .env 中配置 MONGODB_URI

### 5️⃣ 启动服务器
```bash
# 生产模式
npm start

# 开发模式 (自动重启)
npm run dev
```

✅ 当看到以下输出时，表示服务器启动成功:
```
╔════════════════════════════════════╗
║    SwiftLoan API Server Running    ║
║    Port: 5000                      ║
║    Database: mongodb://localhost   ║
╚════════════════════════════════════╝
```

---

## 🎯 API 端点文档

### 1. 健康检查
```
GET /api/health
返回: { status: "OK", timestamp: "..." }
```

### 2. 提交贷款申请
```
POST /api/applications
Content-Type: application/json

请求体:
{
  "firstName": "John",
  "lastName": "Doe",
  "ssn": "123-45-6789",
  "email": "john@example.com",
  "dob": "1990-01-15",
  "phone": "(555) 123-4567",
  "state": "CA",
  "street": "123 Main St",
  "city": "Los Angeles",
  "zip": "90001",
  "dlNumber": "DL123456",
  "dlFrontBase64": "data:image/jpeg;base64,...",
  "dlBackBase64": "data:image/jpeg;base64,...",
  "employmentStatus": "Full-time",
  "employer": "Tech Corp",
  "jobTitle": "Software Engineer",
  "annualIncome": "95000",
  "bankName": "Chase",
  "routing": "121000248",
  "account": "123456789",
  "accountType": "Checking",
  "loanPurpose": "Debt",
  "requestedAmount": "15000",
  "incomeProofBase64": "data:application/pdf;base64,..."
}

返回成功 (201):
{
  "success": true,
  "applicationId": "507f1f77bcf86cd799439011",
  "status": "Approved",
  "approvedAmount": 12500,
  "message": "Congratulations! Your loan of $12,500 has been approved."
}

返回失败 (400/500):
{
  "error": "错误描述信息"
}
```

### 3. 获取所有申请 (仅管理员)
```
GET /api/admin/applications
Headers: x-admin-key: your_secure_admin_key

返回:
{
  "total": 42,
  "approved": 35,
  "denied": 7,
  "totalApprovedAmount": 487500,
  "applications": [...]
}
```

### 4. 获取单个申请详情 (仅管理员)
```
GET /api/admin/applications/:id
Headers: x-admin-key: your_secure_admin_key

返回: { 完整申请数据 }
```

### 5. 信用检查 (模拟)
```
POST /api/credit-check
Content-Type: application/json

请求体:
{
  "ssn": "123-45-6789",
  "firstName": "John",
  "lastName": "Doe"
}

返回:
{
  "success": true,
  "applicantName": "John Doe",
  "creditScore": 725,
  "hardinquiries": 2,
  "delinquencies": 0,
  "creditHistory": "Checked (soft inquiry)",
  "timestamp": "..."
}
```

---

## 🧪 测试API

### 使用 cURL
```bash
# 健康检查
curl http://localhost:5000/api/health

# 提交申请 (Windows PowerShell)
$body = @{
    firstName = "Jane"
    lastName = "Smith"
    annualIncome = "75000"
    requestedAmount = "20000"
    ssn = "123-45-6789"
    dob = "1990-01-15"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/applications `
    -Method POST -Body $body -ContentType application/json
```

### 使用 Postman
1. 下载 [Postman](https://www.postman.com/downloads/)
2. 导入此 API 集合: [swiftloan.postman_collection.json](./postman_collection.json)
3. 测试各个端点

---

## 🔗 前后端集成

### 修改 index.html (第2200行左右)

替换此行:
```javascript
// 保存到 localStorage
saveApplication(applicationData);
```

为:
```javascript
// 发送到后端 API
fetch('http://localhost:5000/api/applications', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(applicationData)
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        // 保存本地ID以便追踪
        localStorage.setItem('lastApplicationId', data.applicationId);
        // 显示批准金额
        document.getElementById('approvedAmount').textContent = 
            '$' + data.approvedAmount.toLocaleString();
        showScreen('approved');
    } else {
        alert('错误: ' + data.error);
    }
})
.catch(error => {
    console.error('API错误:', error);
    // 回退到本地存储
    saveApplication(applicationData);
});
```

### 修改 admin.html (第100行左右)

替换此行:
```javascript
const apps = JSON.parse(localStorage.getItem('swiftloanApplications') || '[]');
```

为:
```javascript
async function loadApplications() {
    try {
        const adminKey = prompt('请输入管理员密钥:');
        const response = await fetch('http://localhost:5000/api/admin/applications', {
            headers: {
                'x-admin-key': adminKey
            }
        });
        
        if (!response.ok) {
            throw new Error('认证失败');
        }
        
        const data = await response.json();
        const apps = data.applications;
        
        // ... 更新仪表板统计信息
        document.getElementById('totalApps').textContent = data.total;
        document.getElementById('totalApproved').textContent = data.approved;
        // ... 等等
    } catch (error) {
        console.error('加载失败:', error);
        alert('无法连接到服务器。使用本地数据。');
    }
}
```

---

## 📊 数据库模式

### MongoDB Collection: `applications`

```json
{
  "_id": ObjectId("..."),
  "timestamp": "2024-01-15T10:30:00Z",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "ssn": "123-45-6789",
  "dob": "1990-01-15",
  "phone": "(555) 123-4567",
  "state": "CA",
  "street": "123 Main St",
  "city": "Los Angeles",
  "zip": "90001",
  "dlNumber": "DL123456",
  "dlFrontBase64": "data:image/jpeg;base64,...",
  "dlBackBase64": "data:image/jpeg;base64,...",
  "employmentStatus": "Full-time",
  "employer": "Tech Corp",
  "jobTitle": "Software Engineer",
  "annualIncome": 95000,
  "bankName": "Chase",
  "routing": "121000248",
  "account": "123456789",
  "accountType": "Checking",
  "loanPurpose": "Debt",
  "requestedAmount": 20000,
  "maxEligible": 35000,
  "status": "Approved",
  "approvedAmount": 24500,
  "creditScore": 743,
  "incomeProofBase64": "data:application/pdf;base64,..."
}
```

---

## 🚀 部署到生产环境

### 1. 使用 Heroku
```bash
# 安装 Heroku CLI
npm install -g heroku

# 登录 Heroku
heroku login

# 创建应用
heroku create swiftloan-api

# 设置环境变量
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set ADMIN_KEY=production_secret_key

# 部署
git push heroku main

# 查看日志
heroku logs --tail
```

### 2. 使用 AWS EC2
1. 创建 EC2 实例 (Ubuntu 20.04)
2. SSH 连接并安装 Node.js + MongoDB
3. 克隆项目并运行
4. 使用 PM2 保持进程活跃:
```bash
npm install -g pm2
pm2 start server.js --name "swiftloan"
pm2 startup
```

### 3. 使用 Docker
```bash
# 创建 Dockerfile
docker build -t swiftloan-api .

# 运行容器
docker run -p 5000:5000 --env-file .env swiftloan-api
```

---

## 🔐 安全最佳实践

- [ ] 在 .env 中设置强随机 ADMIN_KEY
- [ ] 使用 HTTPS (生产环境必须)
- [ ] 实施速率限制 (防止暴力破解)
- [ ] 加密 SSN 和银行账户信息
- [ ] 实施 JWT 认证 (提升安全性)
- [ ] 启用 CORS 白名单 (仅允许特定域名)
- [ ] 定期备份 MongoDB 数据
- [ ] 使用环境变量管理所有敏感信息

---

## 📱 测试前端应用

### 本地测试 (无后端)
```bash
# 直接在浏览器打开
file:///d:/procket/money/index.html

# 或使用本地服务器
python -m http.server 8000
# 访问: http://localhost:8000/index.html
```

### 带后端集成测试
```bash
# 终端1: 启动后端
npm start

# 终端2: 启动前端服务器
python -m http.server 8000

# 浏览器: http://localhost:8000/index.html
```

### 测试流程
1. 填写个人信息（验证 SSN, Phone 自动格式化）
2. 拍摄驾照照片（front/back）
3. 输入工作信息和年收入
4. 观察贷款额度自动调整
5. 上传收入证明
6. 输入银行账户信息
7. 审查并提交
8. 观察信用检查模拟过程
9. 查看批准/拒绝结果
10. 访问 admin.html 查看申请

---

## 🐛 故障排除

### 问题: "Cannot connect to MongoDB"
**解决方案**:
```bash
# 确保 MongoDB 运行中
mongod

# 或检查 MongoDB Atlas 连接字符串
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

### 问题: "CORS error"
**解决方案**:
```javascript
// server.js 中添加
app.use(cors({
    origin: ['http://localhost:8000', 'https://yourdomain.com'],
    credentials: true
}));
```

### 问题: "Admin key unauthorized"
**解决方案**:
```bash
# 检查 .env 文件中的 ADMIN_KEY
# 确保 headers 中正确传递 x-admin-key
```

---

## 📈 生产检查清单

- [ ] 后端部署到服务器
- [ ] MongoDB 使用 Atlas 云端数据库
- [ ] 配置 SSL/HTTPS 证书
- [ ] 实施用户认证系统
- [ ] 添加日志和监控
- [ ] 设置数据备份策略
- [ ] 配置 CDN 加速前端
- [ ] 实施支付网关集成
- [ ] 添加电子邮件通知
- [ ] 建立用户支持系统
- [ ] 法律合规检查 (隐私政策等)

---

## 🤝 支持

遇到问题? 检查以下资源:
- [Express.js 文档](https://expressjs.com)
- [MongoDB 文档](https://docs.mongodb.com)
- [Node.js 文档](https://nodejs.org/docs)

---

**SwiftLoan USA** © 2024 | 已准备好集成真实支付网关和身份验证系统
