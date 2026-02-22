const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    avatar: String,
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'vip'],
      default: 'free',
    },
    planExpiresAt: Date,
    preferences: {
      markets: {
        type: [String],
        enum: ['crypto', 'forex', 'indices'],
        default: ['crypto'],
      },
      tradingStyle: {
        type: [String],
        enum: ['scalping', 'intraday', 'swing'],
        default: ['intraday'],
      },
      strategies: {
        type: [String],
        enum: ['smart_money', 'order_blocks', 'breakout', 'trend_following'],
        default: ['smart_money'],
      },
      timeframes: {
        type: [String],
        enum: ['M5', 'M15', 'H1', 'H4'],
        default: ['H1'],
      },
      notifications: {
        telegram: { type: Boolean, default: false },
        email: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: false },
        webPush: { type: Boolean, default: false },
      },
    },
    telegramChatId: String,
    whatsappNumber: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isBanned: { type: Boolean, default: false },
    lastLogin: Date,
    signalsToday: { type: Number, default: 0 },
    signalsTodayReset: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT
userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Check if plan is active
userSchema.methods.isPlanActive = function () {
  if (this.plan === 'free') return true;
  return this.planExpiresAt && new Date(this.planExpiresAt) > new Date();
};

// Get daily signal limit
userSchema.methods.getDailySignalLimit = function () {
  const limits = { free: 2, basic: Infinity, pro: Infinity, vip: Infinity };
  return limits[this.plan] || 2;
};

// Check if user can receive signal
userSchema.methods.canReceiveSignal = function () {
  const now = new Date();
  if (!this.signalsTodayReset || this.signalsTodayReset < now.setHours(0, 0, 0, 0)) {
    this.signalsToday = 0;
    this.signalsTodayReset = now;
  }
  return this.signalsToday < this.getDailySignalLimit();
};

module.exports = mongoose.model('User', userSchema);
