const mongoose = require('mongoose');

const trialRecordSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    deviceFingerprint: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for fast lookups
trialRecordSchema.index({ ipAddress: 1, deviceFingerprint: 1 });

module.exports = mongoose.model('TrialRecord', trialRecordSchema);
