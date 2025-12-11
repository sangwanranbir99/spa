const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'manager', 'employee'],
        required: true
    },
    status: { type: Boolean, default: true },
    phoneNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    branches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    }]
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
