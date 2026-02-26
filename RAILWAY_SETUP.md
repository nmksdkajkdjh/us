# Railway 部署修復

## 問題：`npm ci` 報錯 "Cannot read property 'express' of undefined"

## 解決方式：設定環境變數

在 Railway 專案中新增以下**環境變數**（Variables）：

| 變數名 | 值 |
|--------|-----|
| `RAILPACK_INSTALL_CMD` | `npm install` |
| `MONGODB_URI` | `mongodb+srv://usdtama_db_user:你的密碼@cluster0.cyetwwb.mongodb.net/?retryWrites=true&w=majority` |
| `ADMIN_KEY` | `Admin@123` |

### 操作步驟

1. 進入 Railway 專案 → **Variables**
2. 點 **+ New Variable**
3. 新增 `RAILPACK_INSTALL_CMD`，值為 `npm install`
4. 新增 `MONGODB_URI`，值為你的 MongoDB 連線字串（將「你的密碼」替換為實際密碼）
5. 新增 `ADMIN_KEY`，值為 `Admin@123`
6. 回到 **Deployments** → 點右上角 **Redeploy** 重新部署

設定 `RAILPACK_INSTALL_CMD` 後，Railway 會改用 `npm install` 取代 `npm ci`，可避免 lock 檔不同步造成的錯誤。
