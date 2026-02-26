## 🏗️ SwiftLoan USA - 系统架构文档

### 项目概述

SwiftLoan USA 是一个完整的美国网络贷款申请平台，包括用户前端应用、管理员控制台和 RESTful API 后端。

---

## 📊 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    用户浏览器                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐      ┌──────────────────────┐     │
│  │   index.html         │      │   admin.html         │     │
│  │  (用户H5应用)         │      │  (管理后台)          │     │
│  │                      │      │                      │     │
│  │ - 多步表单流程       │      │ - 应用统计仪表板   │     │
│  │ - 表单验证          │      │ - 数据查看          │     │
│  │ - 照片上传          │      │ - 文件预览          │     │
│  │ - API 调用          │      │ - API 调用          │     │
│  └──────────────────────┘      └──────────────────────┘     │
│           │                             │                   │
│           └─────────────┬───────────────┘                   │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                   HTTP/HTTPS
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                         ▼                                    │
│          ╔════════════════════════╗                         │
│          ║    Express API Server  ║                         │
│          ║   (Node.js, Port 5000) ║                         │
│          ╚════════════════════════╝                         │
│                         │                                    │
│          ┌──────────────┼──────────────┐                    │
│          │              │              │                    │
│    ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐              │
│    │ Router    │ │ Validator │ │ Business  │              │
│    │ Endpoints │ │ Middleware│ │ Logic     │              │
│    └─────────────┘ └─────────────┘ └─────────────┘         │
│                         │                                    │
│              ┌──────────▼──────────┐                        │
│              │  API Key Auth       │                        │
│              │  (ADMIN_KEY)        │                        │
│              └─────────┬───────────┘                        │
│                        │                                    │
└────────────────────────┼────────────────────────────────────┘
                         │
                    MongoDB
                         │
        ┌────────────────▼────────────────┐
        │   MongoDB Database              │
        │                                 │
        │ collections:                    │
        │  - applications                 │
        │  - audit_logs                   │
        │  - admins (可选)                │
        └─────────────────────────────────┘
```

---

## 🔄 数据流向详解

### 场景 1: 用户提交申请

```
用户填表 (index.html)
    ↓
点击提交按钮
    ↓
JavaScript 验证表单
    ↓
收集图片数据 (base64编码)
    ↓
发送 POST /api/applications 请求
    ↓
服务器接收数据
    ↓
验证 SSN, 年龄, 格式
    ↓
计算最高额度 (income bracket)
    ↓
计算批准额度 (70%-100%)
    ↓
生成信用分数 (模拟)
    ↓
保存到 MongoDB
    ↓
生成 applicationId
    ↓
返回 JSON 响应
    ↓
前端显示批准/拒绝消息
```

### 场景 2: 管理员查看申请

```
访问 admin.html
    ↓
输入密码登录
    ↓
客户端请求 GET /api/admin/applications
    ↓
请求头: x-admin-key
    ↓
服务器验证 API Key
    ↓
从 MongoDB 查询所有申请
    ↓
计算统计数据 (总数、批准、拒绝等)
    ↓
返回 JSON 数据
    ↓
前端渲染表格和仪表板
    ↓
用户可点击查看详情
    ↓
前端发送 GET /api/admin/applications/:id
    ↓
服务器返回完整申请详情
    ↓
前端显示 modal 窗口
```

---

## 📋 API 详细规范

### 1. 应用提交端点
```
POST /api/applications

请求头:
  Content-Type: application/json

请求体验证:
  - firstName (string, 必需)
  - lastName (string, 必需)
  - ssn (string, 必需, 格式: XXX-XX-XXXX)
  - email (string, 必需, 有效邮箱)
  - dob (string, 必需, ISO日期格式)
  - annualIncome (string, 必需, 可转换为数字)
  - [其他30+字段]

业务逻辑:
  1. 验证所有必需字段
  2. 验证 SSN 格式
  3. 计算年龄 (当前日期 - DOB)
  4. 检查年龄 >= 18
  5. 计算最高额度:
     if income < 30000: max = 8000
     if income < 50000: max = 15000
     if income < 80000: max = 25000
     if income < 120000: max = 35000
     else: max = 50000
  6. 验证申请额度 <= 最高额度
  7. 决策逻辑:
     approvalChance = random(0-1)
     if approvalChance > 0.15: status = "Approved"  (85% chance)
     else: status = "Denied"
  8. 计算批准额度 (仅如果批准):
     approvalAmount = random(max*0.7, max) within request
  9. 生成信用分数:
     if Approved: 680-760
     if Denied: 500-600
  10. 插入 MongoDB
  11. 返回 201 + applicationId

返回成功 (201):
{
  "success": true,
  "applicationId": "507f1f77bcf86cd799439011",
  "status": "Approved",
  "approvedAmount": 24500,
  "message": "Congratulations!..."
}

返回失败 (400/500):
{
  "error": "错误描述",
  "details": "可选的详细信息"
}
```

### 2. 获取所有申请 (管理员)
```
GET /api/admin/applications

认证:
  Headers: x-admin-key = process.env.ADMIN_KEY

响应 (200):
{
  "total": 42,
  "approved": 35,
  "denied": 7,
  "totalApprovedAmount": 487500,
  "applications": [
    {
      "_id": "...",
      "firstName": "John",
      "status": "Approved",
      "approvedAmount": 24500,
      ...
    },
    ...
  ]
}

错误:
  401: Unauthorized (无效API Key)
  500: Server error
```

### 3. 获取单个申请
```
GET /api/admin/applications/:id

认证:
  Headers: x-admin-key = process.env.ADMIN_KEY

响应 (200):
{完整申请对象}

错误:
  401: Unauthorized
  404: Not Found
  500: Server error
```

### 4. 信用检查端点
```
POST /api/credit-check

请求体:
{
  "ssn": "123-45-6789",
  "firstName": "John",
  "lastName": "Doe"
}

响应 (200):
{
  "success": true,
  "applicantName": "John Doe",
  "creditScore": 725,
  "hardinquiries": 2,
  "delinquencies": 0,
  "creditHistory": "Checked (soft inquiry)",
  "timestamp": "2024-01-15T10:30:00Z"
}

注: 此端点模拟信用检查
```

---

## 💾 MongoDB 数据模型

### Collection: applications

```javascript
{
  _id: ObjectId("..."),
  
  // 个人信息
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  ssn: "123-45-6789",  // 敏感 - 应加密
  dob: "1990-01-15",
  phone: "(555) 123-4567",
  
  // 地址
  state: "CA",
  street: "123 Main St",
  city: "Los Angeles",
  zip: "90001",
  
  // 文件
  dlNumber: "DL123456",
  dlFrontBase64: "data:image/jpeg;base64,...",
  dlBackBase64: "data:image/jpeg;base64,...",
  incomeProofBase64: "data:application/pdf;base64,...",
  
  // 工作信息
  employmentStatus: "Full-time",
  employer: "Tech Corp",
  jobTitle: "Software Engineer",
  annualIncome: 95000,
  
  // 银行信息
  bankName: "Chase",
  routing: "121000248",  // 敏感 - 应加密
  account: "123456789",  // 敏感 - 应加密
  accountType: "Checking",
  
  // 贷款信息
  loanPurpose: "Debt",
  requestedAmount: 20000,
  maxEligible: 35000,
  
  // 审批结果
  status: "Approved",  // "Approved", "Denied", "Pending"
  approvedAmount: 24500,
  creditScore: 743,
  
  // 元数据
  timestamp: ISODate("2024-01-15T10:30:00Z"),
  
  // 可选字段
  notes: "Optional admin notes",
  updateAt: ISODate("2024-01-15T11:00:00Z")
}
```

### 索引建议

```javascript
// 在 MongoDB 中运行:
db.applications.createIndex({ email: 1 })           // 快速查询邮箱
db.applications.createIndex({ status: 1 })          // 按状态过滤
db.applications.createIndex({ timestamp: -1 })      // 最新优先排序
db.applications.createIndex({ ssn: 1 })            // 检查重复申请
db.applications.createIndex({ 
  firstName: "text", 
  lastName: "text" 
})                                                  // 全文搜索

// 复合索引
db.applications.createIndex({ 
  status: 1, 
  timestamp: -1 
})                                                  // 常见查询
```

---

## 🔐 安全架构

### 认证层
```
用户请求
    ↓
应用层认证:
  - API 密钥验证 (x-admin-key header)
  - 用户密码验证 (前端)
    ↓
授权层:
  - 检查用户角色 (admin vs user)
  - 验证资源所有权
    ↓
数据验证:
  - 输入清理
  - 类型检查
  - 格式验证
    ↓
业务逻辑执行
```

### 敏感数据处理
```
前端:
  - 不存储 SSN 在 sessionStorage
  - 用 base64 编码图片数据
  - 不在 URL 参数中传递敏感信息

后端:
  - HTTPS 仅
  - 数据加密在 MongoDB 中 (使用 MongoDB Encryption at Rest)
  - API Key 在 .env 中, 不在代码中
  - 敏感字段在返回前截断
```

---

## 📝 开发流程

### 本地开发
```bash
# 1. 配置环境
npm install
copy .env.example .env

# 2. 启动 MongoDB (本地或 Atlas)
mongod
# 或在 .env 中配置 MongoDB Atlas

# 3. 初始化数据库
node init-db.js

# 4. 启动后端 (hot-reload)
npm run dev

# 5. 在另一个终端启动前端服务器
python -m http.server 8000

# 6. 打开浏览器
# http://localhost:8000/index.html
```

### 添加新端点的步骤
```javascript
// 1. 在 server.js 中定义路由
app.post('/api/new-endpoint', async (req, res) => {
    try {
        // 2. 验证请求
        // 3. 业务逻辑
        // 4. 数据库操作
        // 5. 返回响应
        res.json({ success: true, data: [...] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. 测试端点 (Postman 或 cURL)
// 7. 更新文档
// 8. 提交代码审查
```

---

## 🚀 部署架构

### 开发环境
```
Local Computer
  ├─ Node.js + npm
  ├─ MongoDB (本地或 Atlas)
  ├─ Express Server (localhost:5000)
  └─ HTTP Server for static files (localhost:8000)
```

### 生产环境 - 选项 1 (Heroku)
```
GitHub Repository
    ↓
Heroku Dyno (Node.js)
    ├─ Express Server
    └─ MongoDB Atlas (云端数据库)
    
CDN (可选)
    └─ CloudFlare (缓存静态资源)
```

### 生产环境 - 选项 2 (AWS)
```
AWS Route 53 (DNS)
    ↓
CloudFront (CDN)
    ├─ S3 (静态文件: index.html, admin.html)
    └─ API Gateway
        ↓
    EC2 / ECS (Node.js 容器)
        ├─ Express Server
        └─ RDS MongoDB
        
或:
    ├─ ALB (Application Load Balancer)
    ├─ ECS Cluster (多容器)
    └─ RDS MongoDB
```

### 生产环境 - 选项 3 (Docker)
```
docker-compose.yml
    ├─ Web Service (Node.js 容器, Port 5000)
    └─ DB Service (MongoDB 容器, Port 27017)

docker build -t swiftloan-api .
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb://db:27017 \
  swiftloan-api
```

---

## 📊 性能优化

### 数据库优化
```javascript
// 使用投影查询，仅返回需要的字段
db.applications.find(
  { status: "Approved" },
  { firstName: 1, email: 1, approvedAmount: 1 }
)

// 分页查询
db.applications.find()
  .skip(20)
  .limit(10)
  .sort({ timestamp: -1 })
```

### 缓存策略
```javascript
// 在内存中缓存统计数据
const cache = {
  stats: {},
  lastUpdated: 0
};

function getStats() {
  const now = Date.now();
  if (now - cache.lastUpdated > 60000) { // 60秒更新一次
    // 查询数据库
    // 更新缓存
  }
  return cache.stats;
}
```

### 图片优化
```javascript
// 压缩 base64 图片大小
function compressImage(base64, maxSize = 500) {
  // 使用 Canvas 降低分辨率
  // 或使用 Sharp 库压缩
  return compressedBase64;
}
```

---

## 🧪 测试策略

### 单元测试
```javascript
// 测试 calculateMaxLoan 函数
describe('calculateMaxLoan', () => {
  test('income < 30000 returns 8000', () => {
    expect(calculateMaxLoan(25000)).toBe(8000);
  });
  test('income >= 120000 returns 50000', () => {
    expect(calculateMaxLoan(150000)).toBe(50000);
  });
});
```

### 集成测试
```bash
# API 端点集成测试
npm test

# 手动测试流程
1. 提交完整申请
2. 验证数据保存
3. 查询数据库
4. 检查返回值
```

### 负载测试
```bash
# 使用 Apache Bench
ab -n 1000 -c 10 http://localhost:5000/api/health

# 或使用 k6
k6 run load-test.js
```

---

## 📈 监控和日志

### 应用日志
```javascript
// 在 server.js 中添加日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use((error, req, res, next) => {
  console.error('[ERROR]', error);
  res.status(500).json({ error: error.message });
});
```

### 数据库日志
```javascript
// MongoDB Profiler
db.setProfilingLevel(1) // 记录所有操作

// 查看慢查询
db.system.profile.find({ millis: { $gt: 100 } }).pretty()
```

### APM 集成 (可选)
```javascript
// New Relic
const newrelic = require('newrelic');

// DataDog
const dogapi = require('dogapi');
```

---

## 🔄 版本控制

### Git 分支策略
```
main (生产)
  ↑
release/v1.0.0 (发布分支)
  ↑
develop (开发)
  ↑
feature/add-payment-gateway (功能分支)
feature/improve-validation
feature/add-email-notifications
```

### 发布流程
```
1. 在 package.json 中更新版本号
2. 创建发布分支 release/v1.0.1
3. 运行测试和质量检查
4. 合并到 main 分支
5. 标记 git tag: v1.0.1
6. 部署到生产环境
```

---

## 📚 相关资源

| 主题 | 文件 |
|------|------|
| 快速开始 | README.md |
| 部署指南 | DEPLOYMENT.md |
| API 测试 | postman_collection.json |
| 数据库备份 | backup.py |
| 服务器代码 | server.js |

---

**版本**: 1.0 | **更新**: 2024年1月 | **维护**: SwiftLoan Team
