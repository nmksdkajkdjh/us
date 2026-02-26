# 後端部署指南

本專案為前後端分離架構：
- **前端**：Cloudflare Pages（靜態 HTML）→ usdaikuan.com
- **後端**：Node.js + Express + MongoDB → 需單獨部署

## 一、架構與資料流

```
用戶填表 (index.html)  →  POST /api/applications/store  →  MongoDB
                     →  PATCH /api/applications/payment
管理端 (admin.html)   →  GET /api/admin/applications    →  顯示所有申請
                     (需 x-admin-key 標頭)
```

- 表單資料以 `sessionId` 做 upsert，避免重複
- 管理端從 API 拉取資料，持久化存於 MongoDB

---

## 二、環境變數

部署後端時必須設定：

| 變數 | 說明 | 範例 |
|------|------|------|
| `PORT` | 服務埠（多數平台自動設定） | `5000` |
| `MONGODB_URI` | MongoDB 連線字串 | `mongodb+srv://user:pass@cluster.mongodb.net/swiftloan` |
| `ADMIN_KEY` | 管理端 API 密鑰（與 admin 登入密碼一致） | `Admin@123` |

---

## 三、MongoDB 準備

1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 建立免費叢集
2. 建立資料庫使用者與密碼
3. Network Access 加入 `0.0.0.0/0`（允許所有 IP，或僅後端主機 IP）
4. 複製連線字串，格式如：`mongodb+srv://user:pass@cluster.xxx.mongodb.net/?retryWrites=true&w=majority`

---

## 四、部署選項

### 選項 A：Railway（推薦）

1. 登入 [Railway](https://railway.app)，用 GitHub 登入
2. **New Project** → **Deploy from GitHub repo** → 選擇 `nmksdkajkdjh/us`
3. 設定 **Root Directory**：留空（專案在根目錄）
4. **Settings** → **Variables** 新增：
   - `MONGODB_URI` = 你的 MongoDB 連線字串
   - `ADMIN_KEY` = `Admin@123`
5. **Settings** → **Deploy**：
   - **Build Command**：`npm install`
   - **Start Command**：`node server.js`
6. 部署完成後，在 **Settings** → **Networking** 取得公網 URL（如 `https://xxx.up.railway.app`）

### 選項 B：Render

1. 登入 [Render](https://render.com)，連接 GitHub
2. **New** → **Web Service** → 選擇 `nmksdkajkdjh/us`
3. 設定：
   - **Build Command**：`npm install`
   - **Start Command**：`node server.js`
   - **Instance Type**：Free
4. **Environment** 新增：
   - `MONGODB_URI`
   - `ADMIN_KEY` = `Admin@123`
5. 部署後取得 URL（如 `https://us-xxx.onrender.com`）

### 選項 C：Vercel（Serverless）

Vercel 需將 Express 改為 serverless 函數，較複雜。建議使用 Railway 或 Render。

---

## 五、前端配置

後端部署完成後，在專案中建立或修改 `config.local.js`：

```javascript
(function(){
    if (typeof window.APP_CONFIG === 'undefined') return;
    Object.assign(window.APP_CONFIG.api || {}, {
        base: 'https://你的後端URL',  // 如 https://us-xxx.up.railway.app
        storePath: '/api/applications/store'
    });
})();
```

**重要**：若 `config.local.js` 已提交到 Git，請勿寫入真實密鑰。可改為：
- 在 Cloudflare Pages 的 **Settings** → **Environment variables** 設定 `API_BASE`
- 或透過構建腳本在部署時注入（需加構建步驟）

若無構建步驟，直接修改 `config.local.js` 並提交即可。

---

## 六、CORS 與域名

後端已啟用 `cors()`，允許跨域請求。若需限制來源：

```javascript
app.use(cors({ origin: ['https://usdaikuan.com', 'https://www.usdaikuan.com'] }));
```

---

## 七、驗證部署

1. 健康檢查：`GET https://你的後端URL/api/health` 應回傳 `{"status":"OK"}`
2. 前端填表並提交，檢查 MongoDB Atlas 的 `swiftloan_db.applications` 是否有新文件
3. 開啟 admin.html，登入後應能看到來自 API 的申請列表

---

## 八、API 端點一覽

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/health` | 健康檢查 |
| POST | `/api/applications/store` | 儲存/更新申請（upsert by sessionId） |
| PATCH | `/api/applications/payment` | 更新收款方式 |
| GET | `/api/admin/applications` | 取得所有申請（需 x-admin-key） |
| DELETE | `/api/admin/applications` | 刪除所有申請（需 x-admin-key） |
