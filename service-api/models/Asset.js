const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    service_id: { type: String, required: true, unique: true }, // 唯一键
    service_type: { type: String, required: true },
    size: { type: String, required: true },
    owner: { type: String, required: true },
    appraisedValue: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    timestamp: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Asset', assetSchema);
