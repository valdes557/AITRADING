const mongoose = require('mongoose');

const signalSchema = new mongoose.Schema(
  {
    asset: {
      type: String,
      required: true,
      trim: true,
    },
    market: {
      type: String,
      enum: ['crypto', 'forex', 'indices'],
      required: true,
    },
    direction: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    entry: {
      type: Number,
      required: true,
    },
    stopLoss: {
      type: Number,
      required: true,
    },
    takeProfit: {
      type: Number,
      required: true,
    },
    riskReward: {
      type: Number,
      required: true,
    },
    timeframe: {
      type: String,
      enum: ['M5', 'M15', 'H1', 'H4', 'D1'],
      required: true,
    },
    strategy: {
      type: String,
      enum: ['smart_money', 'order_blocks', 'breakout', 'trend_following'],
      required: true,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    aiExplanation: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'won', 'lost', 'expired', 'cancelled'],
      default: 'active',
    },
    result: Number,
    closedAt: Date,
    isPremium: {
      type: Boolean,
      default: false,
    },
    isManual: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    indicators: {
      rsi: Number,
      macd: {
        value: Number,
        signal: Number,
        histogram: Number,
      },
      ema20: Number,
      ema50: Number,
      ema200: Number,
      atr: Number,
      volume: Number,
    },
  },
  { timestamps: true }
);

signalSchema.index({ status: 1, createdAt: -1 });
signalSchema.index({ market: 1, asset: 1 });
signalSchema.index({ strategy: 1 });

// Virtual: formatted strategy name
signalSchema.virtual('strategyName').get(function () {
  const names = {
    smart_money: 'Smart Money',
    order_blocks: 'Order Blocks',
    breakout: 'Breakout',
    trend_following: 'Trend Following',
  };
  return names[this.strategy] || this.strategy;
});

signalSchema.set('toJSON', { virtuals: true });
signalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Signal', signalSchema);
