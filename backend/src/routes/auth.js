const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const TrialRecord = require('../models/TrialRecord');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper: get real client IP behind proxies
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.connection.remoteAddress || req.ip;
}

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('deviceFingerprint').trim().notEmpty().withMessage('Device fingerprint is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, email, password, deviceFingerprint } = req.body;
      const clientIP = getClientIP(req);

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // --- Trial abuse prevention ---
      // Check if this IP or device fingerprint was already used for a trial
      const existingTrialByIP = await TrialRecord.findOne({ ipAddress: clientIP });
      const existingTrialByDevice = await TrialRecord.findOne({ deviceFingerprint });

      const trialAbused = existingTrialByIP || existingTrialByDevice;

      let plan = 'basic';
      let planExpiresAt = null;

      if (trialAbused) {
        // This IP or device already used a trial — no trial, account created without plan
        plan = 'expired';
        planExpiresAt = new Date(); // already expired
      } else {
        // New IP + new device = grant 3-day Basic trial
        plan = 'basic';
        planExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      }

      const user = await User.create({
        name,
        email,
        password,
        plan,
        planExpiresAt,
      });

      // Record the trial (even if denied, record IP+fingerprint for tracking)
      await TrialRecord.create({
        email,
        ipAddress: clientIP,
        deviceFingerprint,
        userId: user._id,
      });

      const token = user.generateToken();

      res.status(201).json({
        token,
        trialGranted: !trialAbused,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          planExpiresAt: user.planExpiresAt,
          preferences: user.preferences,
          role: user.role,
          telegramChatId: user.telegramChatId,
          whatsappNumber: user.whatsappNumber,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: 'Account has been suspended' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = user.generateToken();

      res.json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          planExpiresAt: user.planExpiresAt,
          preferences: user.preferences,
          role: user.role,
          telegramChatId: user.telegramChatId,
          whatsappNumber: user.whatsappNumber,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        preferences: user.preferences,
        role: user.role,
        telegramChatId: user.telegramChatId,
        whatsappNumber: user.whatsappNumber,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        preferences: user.preferences,
        role: user.role,
        telegramChatId: user.telegramChatId,
        whatsappNumber: user.whatsappNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 min
    await user.save();

    // TODO: Send email with reset link
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
