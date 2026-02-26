/**
 * 本地/部署覆蓋配置 - 可覆蓋 config.js 中的值
 * 部署時修改此檔案並填入實際值，切勿提交敏感資料到 Git
 */
(function(){
    if (typeof window.APP_CONFIG === 'undefined') return;
    // 範例覆蓋：Object.assign(window.APP_CONFIG.api || {}, { base: 'https://api.yourdomain.com', googleMapsKey: 'YOUR_KEY' });
    // 範例覆蓋：Object.assign(window.APP_CONFIG.loan || {}, { maxAmount: 500000 });
})();
