const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    signalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Signal',
      required: true,
    },
    action: {
      type: String,
      enum: ['followed', 'skipped', 'modified'],
      default: 'followed',
    },
    entryPrice: Number,
    exitPrice: Number,
    pnl: Number,
    pnlPercent: Number,
    notes: {
      type: String,
      maxlength: 1000,
    },
    tags: [String],
    emotion: {
      type: String,
      enum: ['confident', 'neutral', 'fearful', 'greedy', 'disciplined'],
    },
    closedAt: Date,
  },
  { timestamps: true }
);

journalSchema.index({ userId: 1, createdAt: -1 });
journalSchema.index({ signalId: 1 });

module.exports = mongoose.model('Journal', journalSchema);
