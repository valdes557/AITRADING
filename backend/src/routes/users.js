const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/preferences
router.get('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ preferences: user.preferences });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/preferences
router.put('/preferences', protect, async (req, res) => {
  try {
    const { markets, tradingStyle, strategies, timeframes, notifications } = req.body;
    const user = await User.findById(req.user._id);

    if (markets) user.preferences.markets = markets;
    if (tradingStyle) user.preferences.tradingStyle = tradingStyle;
    if (strategies) user.preferences.strategies = strategies;
    if (timeframes) user.preferences.timeframes = timeframes;
    if (notifications) {
      if (notifications.telegram !== undefined) user.preferences.notifications.telegram = notifications.telegram;
      if (notifications.email !== undefined) user.preferences.notifications.email = notifications.email;
      if (notifications.whatsapp !== undefined) user.preferences.notifications.whatsapp = notifications.whatsapp;
      if (notifications.webPush !== undefined) user.preferences.notifications.webPush = notifications.webPush;
    }

    await user.save();
    res.json({ preferences: user.preferences, whatsappNumber: user.whatsappNumber });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/telegram
router.put('/telegram', protect, async (req, res) => {
  try {
    const { chatId } = req.body;
    const user = await User.findById(req.user._id);
    user.telegramChatId = chatId;
    user.preferences.notifications.telegram = true;
    await user.save();
    res.json({ message: 'Telegram linked successfully', telegramChatId: chatId });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/whatsapp
router.put('/whatsapp', protect, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Validate format: must start with + and country code
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ message: 'Invalid phone number. Use format: +1234567890' });
    }

    const user = await User.findById(req.user._id);
    user.whatsappNumber = phoneNumber.replace(/\s/g, '');
    user.preferences.notifications.whatsapp = true;
    await user.save();

    res.json({
      message: 'WhatsApp number linked successfully',
      whatsappNumber: user.whatsappNumber,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
