const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: String,
      enum: ['basic', 'pro', 'vip'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'pending',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['usdt_trc20', 'binance_pay', 'mobile_money', 'manual'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USDT',
    },
    txHash: String,
    confirmedAt: Date,
    autoRenew: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });

// Check if subscription is active
subscriptionSchema.methods.isActive = function () {
  return this.status === 'active' && new Date(this.endDate) > new Date();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
