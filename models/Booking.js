const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true
    },
    clientContact: {
      type: String,
      required: true
    },
    massage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Massage',
      required: true,
    },
    massageDate: {
      type: Date,
      required: true
    },
    massageTime: {
      type: String,
      required: true
    },
    massageEndTime: {
      type: String,
      required: true
    },
    sessionTime: {
      type: String,
      required: true,
    },
    massageType: {
      type: String,
      required: true
    },
    massagePrice: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    staffDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: String,
      required: true
    },
    // Payment fields
    cash: {
      type: Number,
      default: 0
    },
    card: {
      type: Number,
      default: 0
    },
    upi: {
      type: Number,
      default: 0
    },
    otherPayment: {
      type: Number,
      default: 0
    },
    roomNumber: {
      type: String,
      default: null
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    // Update history tracking
    updateHistory: [
      {
        updatedBy: {
          type: String,
          required: true
        },
        updatedAt: {
          type: Date,
          default: Date.now
        },
        changes: [
          {
            field: String,
            oldValue: mongoose.Schema.Types.Mixed,
            newValue: mongoose.Schema.Types.Mixed
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
