const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    text: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    avatar: String,
    isVisible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
