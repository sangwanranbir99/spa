const mongoose = require('mongoose');

const massageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    time: {
        type: [String],
        required: true
    },
    price: {
        type: [Number],
        required: true
    },
    discountedPrice: {
        type: [Number],
        required: true
    },
    branches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    }],
    status: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.models.Massage || mongoose.model('Massage', massageSchema);
