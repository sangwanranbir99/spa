const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    createdBy: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
