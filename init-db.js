// ============================================
// Database Initialization Script
// Run: node init-db.js
// ============================================

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'swiftloan_db';

async function initializeDatabase() {
    let client;

    try {
        console.log('🔌 正在连接到MongoDB...');
        client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
        await client.connect();

        const db = client.db(DB_NAME);
        console.log('✓ 已连接到数据库:', DB_NAME);

        // Create collections
        console.log('\n📦 正在创建Collections...');

        // Applications collection
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        if (!collectionNames.includes('applications')) {
            await db.createCollection('applications', {
                validator: {
                    $jsonSchema: {
                        bsonType: 'object',
                        required: ['firstName', 'lastName', 'ssn', 'email', 'annualIncome'],
                        properties: {
                            firstName: { bsonType: 'string' },
                            lastName: { bsonType: 'string' },
                            ssn: { bsonType: 'string', pattern: '^[0-9]{3}-[0-9]{2}-[0-9]{4}$' },
                            email: { bsonType: 'string' },
                            annualIncome: { bsonType: 'int' },
                            status: { bsonType: 'string', enum: ['Approved', 'Denied', 'Pending'] },
                            timestamp: { bsonType: 'date' }
                        }
                    }
                }
            });
            console.log('✓ 已创建 applications collection');

            // Create indexes for faster queries
            await db.collection('applications').createIndex({ email: 1 });
            await db.collection('applications').createIndex({ status: 1 });
            await db.collection('applications').createIndex({ timestamp: -1 });
            console.log('✓ 已创建索引');
        } else {
            console.log('⚠ applications collection 已存在');
        }

        // Audit logs collection
        if (!collectionNames.includes('audit_logs')) {
            await db.createCollection('audit_logs');
            await db.collection('audit_logs').createIndex({ timestamp: -1 });
            console.log('✓ 已创建 audit_logs collection');
        }

        // Admin users collection (optional)
        if (!collectionNames.includes('admins')) {
            await db.createCollection('admins');
            // 可选: 添加默认管理员
            // await db.collection('admins').insertOne({
            //     username: 'admin',
            //     email: 'admin@swiftloan.com',
            //     password: 'hashed_password_here',
            //     role: 'super_admin',
            //     createdAt: new Date()
            // });
            console.log('✓ 已创建 admins collection');
        }

        // 统计信息
        console.log('\n📊 数据库统计:');
        const appCount = await db.collection('applications').countDocuments();
        console.log(`  - 申请总数: ${appCount}`);
        const approvedCount = await db.collection('applications').countDocuments({ status: 'Approved' });
        console.log(`  - 批准数: ${approvedCount}`);

        // 显示示例数据
        console.log('\n📋 示例申请数据格式:');
        console.log(`
{
  "_id": ObjectId("..."),
  "firstName": "John",
  "lastName": "Doe",
  "ssn": "123-45-6789",
  "email": "john@example.com",
  "dob": "1990-01-15",
  "phone": "(555) 123-4567",
  "state": "CA",
  "street": "123 Main St",
  "city": "Los Angeles",
  "zip": "90001",
  "annualIncome": 95000,
  "requestedAmount": 20000,
  "maxEligible": 35000,
  "status": "Approved",
  "approvedAmount": 24500,
  "creditScore": 743,
  "timestamp": ISODate("2024-01-15T10:30:00Z")
}
        `);

        console.log('\n✅ 数据库初始化完成!');
        console.log('💡 提示: 运行 "npm start" 启动服务器');

    } catch (error) {
        console.error('❌ 初始化失败:', error.message);
        process.exit(1);

    } finally {
        if (client) {
            await client.close();
        }
    }
}

// Run initialization
initializeDatabase();
