const mongoose = require('mongoose');

const planConfigSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      enum: ['free', 'basic', 'pro', 'vip'],
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    duration: { type: Number, default: 30 },
    features: [String],
    signalsPerDay: { type: mongoose.Schema.Types.Mixed, default: 2 },
    highlighted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlanConfig', planConfigSchema);
