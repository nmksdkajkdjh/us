/**
 * 本地/部署覆蓋配置 - 可覆蓋 config.js 中的值
 * 重要：必須設定 api.base 為 Railway 後端 URL，表單資料才能寫入資料庫，管理端才能即時顯示
 * 取得方式：Railway 專案 → us 服務 → Settings → Networking → Public Networking → 複製 Domain
 */
(function(){
    if (typeof window.APP_CONFIG === 'undefined') return;
    Object.assign(window.APP_CONFIG.api || {}, {
        base: 'https://us-production.up.railway.app'  // 必填：替換為你的 Railway 後端 URL（Railway → us → Settings → Networking → Domain）
    });
})();
