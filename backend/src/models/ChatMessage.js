const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'signal', 'image'],
      default: 'text',
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    // If type === 'signal', store the signal reference
    signalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Signal',
    },
    // For deleted/moderated messages
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ createdAt: -1 });
chatMessageSchema.index({ sender: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
