# API 即時資料設定

若管理端 (https://usdaikuan.com/admin) 無法顯示用戶填寫的表單，請依以下步驟設定後端 API 網址。

## 步驟

### 1. 取得 Railway 後端 URL

1. 登入 [Railway](https://railway.app)
2. 進入專案 → 選擇 **us** 服務
3. 點 **Settings** → **Networking**
4. 在 **Public Networking** 區塊，複製 **Domain**（如 `https://us-production-xxxx.up.railway.app`）

### 2. 設定 config.local.js

編輯 `config.local.js`，將 `base` 改為你的 Railway URL：

```javascript
Object.assign(window.APP_CONFIG.api || {}, {
    base: 'https://你的Railway網址'  // 例如 https://us-production-a1b2c3.up.railway.app
});
```

### 3. 提交並部署

```bash
git add config.local.js
git commit -m "設定後端 API 網址"
git push origin main
```

Cloudflare Pages 會自動重新部署，約 1–2 分鐘後生效。

### 4. 驗證

1. 開啟 https://usdaikuan.com 填寫一筆測試表單並提交
2. 開啟 https://usdaikuan.com/admin 登入（密碼 Admin@123）
3. 應能看到剛才的申請資料，且每 3 秒自動刷新
