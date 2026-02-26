# Cloudflare Pages 部署指南

**域名**: usdaikuan.com

## 一、部署步驟

### 方式 A：Git 連接（推薦）

1. 將專案推送到 GitHub / GitLab
2. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. 選擇倉庫，設定：
   - **Build command**: 留空（靜態站點無需構建）
   - **Build output directory**: `/` 或 `.`
4. 部署完成後，在 **Custom domains** 添加 `usdaikuan.com` 和 `www.usdaikuan.com`

### 方式 B：直接上傳

1. 進入 **Workers & Pages** → **Create** → **Pages** → **Upload assets**
2. 上傳以下檔案/資料夾：
   - `index.html`
   - `admin.html`
   - `config.js`
   - `config.local.js`
   - `assets/`
   - `qr/`（若有）
   - `_headers`
   - `ZIPDatabase.js`（若有）

## 二、自訂域名設定

1. 在 Cloudflare 添加站點 `usdaikuan.com`（若尚未添加）
2. 在 Pages 專案 → **Custom domains** → **Set up a custom domain**
3. 輸入 `usdaikuan.com`，Cloudflare 會自動配置 DNS
4. 建議同時添加 `www.usdaikuan.com` 並設為重定向至主域名

## 三、重要檔案說明

| 檔案 | 說明 |
|------|------|
| `index.html` | 主申請頁 |
| `admin.html` | 管理端（密碼 Admin@123） |
| `config.js` | 預設配置 |
| `config.local.js` | 部署覆蓋（API Key 等） |
| `_headers` | 安全標頭（XSS、點擊劫持防護） |

## 四、後端與資料持久化

- **完整模式**：需另行部署 Node 後端（MongoDB），詳見 [DEPLOY_BACKEND.md](DEPLOY_BACKEND.md)
- **後端部署後**：在 `config.local.js` 設定 `api.base` 為後端 URL，表單資料會寫入 MongoDB，管理端從 API 拉取並持久化顯示
- **純靜態模式**：無後端時，表單資料僅存於 `localStorage`，管理端與申請頁需同源

## 五、注意事項

- **HTTPS**：Cloudflare Pages 預設啟用 HTTPS
