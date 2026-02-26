# 安全規範

## 禁止硬編碼
- 所有 API 地址、利率、費用、城市列表 → 使用 `config.js` + `config.local.js`
- 敏感值（API Key、密鑰）僅放在 `config.local.js`，並加入 `.gitignore`

## 禁止信息泄露
- SSN、銀行卡、文件上傳僅通過後端 API 傳輸
- 前端不存儲敏感數據
- 禁止 `console.log` 用戶數據（已使用 `safeLog`，僅在 `config.debug=true` 時輸出）

## 防止惡意攻擊
- **XSS**：所有用戶輸入經 DOMPurify 清洗
- **CSRF**：後端需生成 CSRF Token，前端 POST 時帶入
- **文件上傳**：後端限制類型（jpg/png）、大小（<5MB）、掃毒
- **速率限制**：後端對同一 IP 5 分鐘內最多 3 次申請

## 部署建議
- 使用 HTTPS + HSTS
- Cloudflare / AWS WAF 防 DDoS
- 定期依 OWASP Top 10 做滲透測試
