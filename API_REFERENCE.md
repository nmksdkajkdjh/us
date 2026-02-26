# SwiftLoan USA v2.0 - API 参考手册

## 快速参考表

| API | 类型 | 速率限制 | 认证 | 成本 |
|-----|------|---------|------|------|
| **Zippopotam.us** | REST | 无 | 无 | 免费 |
| **Nominatim (OSM)** | REST | 1 req/s | 无 | 免费 |
| **Browser Geolocation** | 原生 | - | 用户权限 | 免费 |

---

## 1️⃣ Zippopotam.us API

### 基本信息
- **基础URL**: `https://api.zippopotam.us`
- **文档**: https://www.zippopotam.us/
- **覆盖范围**: 美国全部ZIP码 (41,686+ ZIP codes)

### 端点: 查询ZIP码

```
GET /us/{zipcode}
```

#### 请求示例
```bash
# 查询 Beverly Hills, CA
curl "https://api.zippopotam.us/us/90210"
```

#### 响应格式
```json
{
  "post code": "90210",
  "country": "United States",
  "country abbreviation": "US",
  "places": [
    {
      "place name": "Beverly Hills",
      "longitude": "-118.4065",
      "state": "California",
      "state abbreviation": "CA",
      "latitude": "34.0901"
    }
  ]
}
```

#### JavaScript调用
```javascript
async function lookupZipCode(zip) {
    const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!response.ok) throw new Error('ZIP not found');
    
    const data = await response.json();
    const place = data.places[0];
    
    return {
        city: place['place name'],
        state: place['state abbreviation'],
        lat: parseFloat(place.latitude),
        lon: parseFloat(place.longitude)
    };
}
```

#### 错误处理
```javascript
try {
    const result = await lookupZipCode('90210');
    console.log(`${result.city}, ${result.state}`);
} catch (error) {
    console.error('ZIP lookup failed:', error);
    // 允许用户手动输入
}
```

#### 响应时间
- 成功查询: 200-500ms
- 无效ZIP码: 返回空places数组
- 网络错误: 异常处理

---

## 2️⃣ Nominatim (OpenStreetMap) 反向地理编码

### 基本信息
- **基础URL**: `https://nominatim.openstreetmap.org`
- **文档**: https://nominatim.org/release-docs/
- **覆盖范围**: 全球，美国街道级别精度

### 端点: 反向地理编码

```
GET /reverse?format=json&lat={lat}&lon={lon}
```

#### 请求示例
```bash
# 查询 350 Fifth Avenue, NYC 的坐标
curl "https://nominatim.openstreetmap.org/reverse?format=json&lat=40.7128&lon=-74.0060"
```

#### 响应格式
```json
{
  "place_id": 123456789,
  "licence": "...",
  "osm_type": "way",
  "osm_id": 987654321,
  "lat": "40.71282",
  "lon": "-74.00602",
  "class": "building",
  "type": "commercial",
  "place_rank": 30,
  "importance": 0.75,
  "address": {
    "house_number": "350",
    "road": "Fifth Avenue",
    "neighbourhood": "Midtown",
    "suburb": "Manhattan",
    "city": "New York",
    "county": "New York County",
    "state": "New York",
    "postcode": "10001",
    "country": "United States",
    "country_code": "us"
  },
  "boundingbox": ["40.71262", "40.71302", "-74.00622", "-74.00582"]
}
```

#### JavaScript调用
```javascript
async function reverseGeocode(latitude, longitude) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    const response = await fetch(url);
    const data = await response.json();
    
    const addr = data.address;
    return {
        street: `${addr.house_number || ''} ${addr.road || ''}`.trim(),
        city: addr.city || addr.town || addr.suburb || '',
        state: addr.state || '',
        zip: (addr.postcode || '').substring(0, 5),
        fulladdress: data.display_name
    };
}
```

#### 使用示例
```javascript
// 从GPS坐标获取地址
const { latitude, longitude } = await getCurrentPosition();
const address = await reverseGeocode(latitude, longitude);

console.log(`地址: ${address.street}`);
console.log(`城市: ${address.city}, ${address.state}`);
console.log(`ZIP码: ${address.zip}`);
```

#### 响应时间
- 成功查询: 500-2000ms
- 无结果: 返回空address对象
- 请求限制: 1请求/秒 (官方限制)

---

## 3️⃣ Browser Geolocation API

### 基本信息
- **类型**: 原生浏览器API (无外部请求)
- **兼容性**: 95%+ 现代浏览器
- **权限**: 用户明确授权
- **协议**: HTTPS (生产环境) / localhost (开发)

### 使用方式

```javascript
navigator.geolocation.getCurrentPosition(
    (position) => { /* 成功回调 */ },
    (error) => { /* 错误回调 */ },
    { options }
);
```

#### 参数详解

**Success Callback**
```javascript
(position) => {
    const {
        latitude,      // 纬度 (-90 到 90)
        longitude,     // 经度 (-180 到 180)
        accuracy,      // 精度(米)
        altitude,      // 高度(米)，可能为null
        altitudeAccuracy,
        heading,       // 方向(0-360°)，可能为null
        speed          // 速度(m/s)，可能为null
    } = position.coords;
    
    const timestamp = position.timestamp; // 毫秒
}
```

**Error Callback**
```javascript
(error) => {
    switch(error.code) {
        case 1: // PERMISSION_DENIED
            console.error('用户拒绝了位置请求');
            break;
        case 2: // POSITION_UNAVAILABLE
            console.error('位置信息不可用');
            break;
        case 3: // TIMEOUT
            console.error('请求超时');
            break;
    }
}
```

**Options参数**
```javascript
{
    enableHighAccuracy: true,  // 使用高精度 (消耗电量)
    timeout: 10000,            // 超时时间(毫秒)
    maximumAge: 0              // 缓存时间(毫秒)
}
```

#### 完整示例
```javascript
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (error) => {
                reject(new Error(`位置错误: ${error.code}`));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

// 使用
try {
    const location = await getCurrentLocation();
    console.log(`当前位置: ${location.lat}, ${location.lon}`);
} catch (error) {
    console.error(error);
}
```

#### 精度说明
| 精度级别 | 误差范围 | 使用场景 |
|---------|---------|--------|
| 高精度 | ±5-20米 | 物流、导航 |
| 中精度 | ±50-100米 | 地区级别 |
| 低精度 | ±1000米+ | 粗略定位 |

---

## 🔄 集成工作流

### 完整流程 (GPS + 反向地理编码 + ZIP查询)

```javascript
async function fullLocationLookup() {
    try {
        // 第1步: 获取GPS坐标
        const location = await getCurrentLocation();
        console.log(`GPS: ${location.lat}, ${location.lon}`);
        
        // 第2步: 反向地理编码获取地址
        const address = await reverseGeocode(location.lat, location.lon);
        console.log(`地址: ${address.street}, ${address.city}, ${address.state}`);
        
        // 第3步: 用ZIP码查询完整信息 (验证)
        if (address.zip) {
            const zipInfo = await lookupZipCode(address.zip);
            console.log(`确认: ${zipInfo.city}, ${zipInfo.state}`);
        }
        
        // 返回完整地址对象
        return {
            street: address.street,
            city: address.city,
            state: address.state,
            zip: address.zip,
            latitude: location.lat,
            longitude: location.lon
        };
        
    } catch (error) {
        console.error('位置查询失败:', error);
        throw error;
    }
}
```

---

## 🛡️ 错误处理最佳实践

### 完整错误处理示例

```javascript
async function robustLocationLookup() {
    const results = {
        method: null,        // 成功使用的方法
        address: null,
        error: null
    };
    
    // 尝试方法 1: GPS + 反向地理编码 (最准确)
    try {
        const location = await getCurrentLocation();
        const address = await reverseGeocode(location.lat, location.lon);
        results.method = 'GPS';
        results.address = address;
        return results;
    } catch (gpsError) {
        console.warn('GPS方法失败:', gpsError);
    }
    
    // 尝试方法 2: 街道建议 (备选)
    try {
        // 用户可以从下拉菜单中选择
        results.method = 'autocomplete';
        return results;
    } catch (autoError) {
        console.warn('自动完成方法失败:', autoError);
    }
    
    // 最后: 手动输入
    results.method = 'manual';
    results.error = '无法自动获取地址，请手动输入';
    return results;
}
```

---

## 📊 性能优化

### 缓存策略

```javascript
// 缓存ZIP查询结果
const zipCache = new Map();

async function cachedLookupZipCode(zip) {
    if (zipCache.has(zip)) {
        console.log('使用缓存:', zip);
        return zipCache.get(zip);
    }
    
    const result = await lookupZipCode(zip);
    zipCache.set(zip, result);
    return result;
}

// 清空缓存
function clearZipCache() {
    zipCache.clear();
}
```

### 请求去重

```javascript
// 防止重复请求
let ongoingZipRequest = null;

async function dedupedLookupZipCode(zip) {
    if (ongoingZipRequest) {
        return ongoingZipRequest;
    }
    
    ongoingZipRequest = lookupZipCode(zip)
        .finally(() => {
            ongoingZipRequest = null;
        });
    
    return ongoingZipRequest;
}
```

---

## 📱 CORS 和浏览器兼容性

### CORS 配置

**Zippopotam.us**: ✅ 支持CORS
```
Access-Control-Allow-Origin: *
```

**Nominatim**: ✅ 支持CORS (受User-Agent限制)
```
// 添加User-Agent头
fetch(url, {
    headers: {
        'User-Agent': 'SwiftLoan/2.0'
    }
})
```

### 浏览器兼容性矩阵

| 特性 | Chrome | Firefox | Safari | Edge | 移动 |
|------|--------|---------|--------|------|------|
| Fetch API | 42+ | 39+ | 10.1+ | 14+ | ✅ |
| Geolocation | 5+ | 3.5+ | 5+ | 12+ | ✅ |
| Promise | 32+ | 29+ | 8+ | 12+ | ✅ |
| async/await | 55+ | 52+ | 10.1+ | 15+ | ✅ |

---

## 🔐 安全最佳实践

### 输入验证

```javascript
// ZIP码验证
function isValidZip(zip) {
    return /^\d{5}$/.test(zip);
}

// 坐标验证
function isValidCoordinates(lat, lon) {
    return (
        typeof lat === 'number' && lat >= -90 && lat <= 90 &&
        typeof lon === 'number' && lon >= -180 && lon <= 180
    );
}

// 使用示例
if (!isValidZip(userInput)) {
    alert('请输入有效的5位ZIP码');
    return;
}
```

### 隐私保护

```javascript
// 不存储敏感位置数据
async function reverseGeocodePrivate(lat, lon) {
    // 只在内存中处理，不保存到localStorage
    const address = await reverseGeocode(lat, lon);
    
    // 立即使用，然后丢弃
    fillFormFields(address);
    
    // 不记录坐标
    console.log('地址已填充');
    return null;
}
```

---

**API参考版本**: 2.0 | **最后更新**: 2026年2月

