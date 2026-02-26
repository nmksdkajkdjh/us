/**
 * 項目配置 - 禁止硬編碼，所有可配置項集中於此
 * 部署時可覆蓋 window.APP_CONFIG 或使用 config.local.js
 */
(function(global) {
    'use strict';

    const DEFAULT_CONFIG = {
        debug: false,
        api: {
            base: '',
            storePath: '/api/applications/store',
            zipApi: 'https://api.zippopotam.us/us/',
            geoApi: 'https://nominatim.openstreetmap.org/reverse',
            googleMapsKey: ''
        },
        loan: {
            minAmount: 1000,
            maxAmount: 500000,
            defaultAmount: 5000,
            step: 100,
            highRiskThreshold: 50000,
            feeAmount: 99
        },
        validation: {
            maxFileSizeMB: 5,
            allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
        },
        siteUrl: 'https://usdaikuan.com',
        seo: {
            defaultTitle: '美國華人貸款 | 無抵押・房屋抵押・車抵押 H5 3分鐘申請',
            defaultDesc: '美國華人無抵押信用貸款、房屋淨值貸款、車抵押貸款。洛杉磯、紐約、舊金山、波士頓、芝加哥、休斯頓、西雅圖華人專屬。H5 中文申請 當天放款 低利率 零隱藏費用。',
            regions: {
                LA: { name: '洛杉磯', title: '洛杉磯華人無抵押信用貸款 H5 3分鐘申請 當天到Chase卡', desc: '洛杉磯華人無抵押貸款、房屋抵押、車抵押。南加州華人專屬 低至5.99% 當天放款。' },
                NY: { name: '紐約', title: '紐約華人無抵押貸款 中文H5 3分鐘秒批 FICO低也過', desc: '紐約華人無抵押貸款、曼哈頓布魯克林專屬。當天到賬 不影響信用 零隱藏費用。' },
                SF: { name: '舊金山灣區', title: '舊金山灣區華人無抵押信用貸款 H5 矽谷程序員專用', desc: '舊金山灣區華人貸款、房屋淨值、車抵押。高額度 低利率 當天審核 Tesla快速放款。' },
                Boston: { name: '波士頓', title: '波士頓華人無抵押貸款 哈佛MIT留學生專屬 學費周轉', desc: '波士頓華人無抵押貸款、劍橋地區低利率。麻州專屬 當天到賬 學費周轉。' },
                Chicago: { name: '芝加哥', title: '芝加哥華人無抵押貸款 H5申請 3分鐘中文審核 當天放款', desc: '芝加哥華人無抵押貸款、房屋抵押、車抵押。伊利諾伊州華人專屬 低利率 當天放款。' },
                Houston: { name: '休斯頓', title: '休斯頓華人無抵押貸款 H5申請 3分鐘審核 當天放款', desc: '休斯頓華人無抵押貸款、房屋淨值、車抵押。德州華人專屬 FICO低也敢批 零隱藏費用。' },
                Seattle: { name: '西雅圖', title: '西雅圖華人無抵押貸款 H5 3分鐘申請 當天放款', desc: '西雅圖華人無抵押貸款、房屋抵押、車抵押。華州華人專屬 低利率 當天審核。' }
            }
        }
    };

    function deepMerge(target, source) {
        const out = { ...target };
        for (const k in source) {
            if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
                out[k] = deepMerge(target[k] || {}, source[k]);
            } else if (source[k] !== undefined && source[k] !== '') {
                out[k] = source[k];
            }
        }
        return out;
    }
    global.APP_CONFIG = (global.APP_CONFIG && Object.keys(global.APP_CONFIG).length) ? deepMerge(DEFAULT_CONFIG, global.APP_CONFIG) : DEFAULT_CONFIG;
})(typeof window !== 'undefined' ? window : this);
