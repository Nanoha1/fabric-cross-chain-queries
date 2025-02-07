const mongoose = require('mongoose');
const { queryChaincode } = require('./fabric-cli');
const Asset = require('./models/Asset');

// 连接 MongoDB 数据库
mongoose.connect('mongodb://localhost:27017/assetdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB for synchronization'))
    .catch(err => console.error('MongoDB connection error:', err));

async function syncAssets() {
    console.log('Starting synchronization with Fabric...');

    // 调用链码，获取所有资产
    queryChaincode('GetAllAssets', [], async (err, result) => {
        if (err) {
            console.error('Failed to fetch assets from Fabric:', err);
            mongoose.connection.close();
            return;
        }

        // 检查 result 是否需要解析
        let assets;
        try {
            assets = typeof result === 'string' ? JSON.parse(result) : result; // 确保 result 是对象
        } catch (error) {
            console.error('Error parsing Fabric response:', error);
            mongoose.connection.close();
            return;
        }

        // 遍历所有资产，并同步到 MongoDB
        for (const asset of assets) {
            try {
                // 新资产数据格式
                const assetData = {
                    service_id: asset.service_id || null,
                    service_type: asset.service_type || null,
                    description: asset.description || null,
                    price: asset.price || null,
                    location: asset.location || null,
                    timestamp: asset.timestamp || null,
                    sensitive_key: asset.sensitive_key || null,
                };

                // 使用 `upsert` 将数据存入 MongoDB
                await Asset.updateOne(
                    { service_id: assetData.service_id }, // 匹配条件：service_id 唯一
                    assetData, // 要保存的数据
                    { upsert: true } // 如果不存在则插入
                );

                console.log(`Synced asset: ${assetData.service_id}`);
            } catch (error) {
                console.error(`Failed to save asset ${asset.service_id}:`, error);
            }
        }

        console.log('Asset synchronization complete.');
        mongoose.connection.close();
    });
}

// 执行同步函数
syncAssets();
