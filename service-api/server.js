const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose'); // 引入 mongoose
const { invokeChaincode } = require('./fabric-cli');
const Asset = require('./models/Asset');
const cors = require('cors'); // 引入 cors

// 启用 CORS 中间件
const app = express();
app.use(bodyParser.json());
app.use(cors());

// 连接 MongoDB 数据库
mongoose.connect('mongodb://localhost:27017/assetdb', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

// 创建资产
// 创建资产
app.post('/assets', (req, res) => {
    const { service_id, service_type, size, owner, appraisedValue, description, location, timestamp } = req.body;

    // 检查必填字段
    if (!service_id || !service_type || !size || !owner || !appraisedValue) {
        return res.status(400).json({ message: 'Missing required fields (service_id, service_type, size, owner, appraisedValue)' });
    }

    // 调用链码，仅传递 5 个参数
    invokeChaincode('CreateAsset', [
        service_id,           // 对应链码的 id
        service_type,         // 对应链码的 color
        size.toString(),      // 对应链码的 size
        owner,                // 对应链码的 owner
        appraisedValue.toString() // 对应链码的 appraisedValue
    ], async (err, result) => {
        if (err) {
            res.status(500).json({ message: 'Failed to create asset', error: err });
        } else {
            try {
                // 同步额外数据到数据库
                const assetData = {
                    service_id,
                    service_type,
                    size,
                    owner,
                    appraisedValue,
                    description, // 额外字段存储
                    location,    // 额外字段存储
                    timestamp    // 额外字段存储
                };
                await Asset.updateOne({ service_id }, assetData, { upsert: true });
                res.status(201).json({ message: 'Asset created successfully', result });
            } catch (dbError) {
                res.status(500).json({ message: 'Failed to save asset to database', error: dbError });
            }
        }
    });
});


// 查询所有资产
app.get('/assets', async (req, res) => {
    try {
        const assets = await Asset.find(); // 从数据库查询所有资产
        res.status(200).json(assets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch assets from database', error });
    }
});

// 查询单个资产（按 service_id）
// app.get('/assets/:service_id', async (req, res) => {
//     const { service_id } = req.params; // 从 URL 中获取 service_id
//     try {
//         const asset = await Asset.findOne({ service_id }); // 按 `service_id` 查询资产
//         if (!asset) {
//             return res.status(404).json({ message: `Asset with service_id "${service_id}" not found` });
//         }
//         res.status(200).json(asset); // 返回资产信息
//     } catch (error) {
//         res.status(500).json({ message: `Failed to fetch asset with service_id "${service_id}" from database`, error });
//     }
// });

// 根据条件查询资产
app.get('/assets/search', async (req, res) => {
    const {
        service_id,
        service_type,
        size,
        owner,
        appraisedValue,
        description,
        location,
        timestamp
    } = req.query;

    // 构建动态查询条件
    const query = {};
    if (service_id) query.service_id = service_id;
    if (service_type) query.service_type = service_type;
    if (size) query.size = size;
    if (owner) query.owner = owner;
    if (appraisedValue) query.appraisedValue = appraisedValue;
    if (description) query.description = { $regex: description, $options: 'i' }; // 支持模糊查询
    if (location) query.location = location;
    if (timestamp) query.timestamp = timestamp;

    try {
        const assets = await Asset.find(query); // 从数据库查询符合条件的资产
        res.status(200).json(assets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to search assets in database', error });
    }
});


// 启动API服务
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`API server is running on http://localhost:${PORT}`);
});
