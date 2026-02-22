const express = require('express');
const Signal = require('../models/Signal');
const { protect, planRequired } = require('../middleware/auth');

const router = express.Router();

// GET /api/signals/active
router.get('/active', protect, async (req, res) => {
  try {
    const user = req.user;
    const query = { status: 'active' };

    // Filter by user preferences
    if (user.preferences.markets.length > 0) {
      query.market = { $in: user.preferences.markets };
    }

    // Free users don't see premium signals
    if (user.plan === 'free') {
      query.isPremium = false;
    }

    const signals = await Signal.find(query)
      .sort({ createdAt: -1 })
      .limit(user.plan === 'free' ? 2 : 50);

    // Hide AI explanation for non-pro users
    const formatted = signals.map((s) => {
      const signal = s.toJSON();
      if (!['pro', 'vip'].includes(user.plan)) {
        signal.aiExplanation = signal.aiExplanation.substring(0, 50) + '... [Upgrade to Pro for full AI analysis]';
      }
      return signal;
    });

    res.json({ signals: formatted });
  } catch (error) {
    console.error('Get active signals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/signals/history
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, market } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (market && market !== 'all') query.market = market;

    const signals = await Signal.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Signal.countDocuments(query);

    res.json({
      signals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/signals/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const total = await Signal.countDocuments();
    const active = await Signal.countDocuments({ status: 'active' });
    const won = await Signal.countDocuments({ status: 'won' });
    const lost = await Signal.countDocuments({ status: 'lost' });
    const closed = won + lost;

    const wonSignals = await Signal.find({ status: 'won' }).select('result');
    const lostSignals = await Signal.find({ status: 'lost' }).select('result');

    const avgWin = wonSignals.length
      ? wonSignals.reduce((sum, s) => sum + (s.result || 0), 0) / wonSignals.length
      : 0;
    const avgLoss = lostSignals.length
      ? lostSignals.reduce((sum, s) => sum + (s.result || 0), 0) / lostSignals.length
      : 0;

    res.json({
      total,
      active,
      won,
      lost,
      winRate: closed > 0 ? ((won / closed) * 100).toFixed(1) : 0,
      avgWin: avgWin.toFixed(2),
      avgLoss: avgLoss.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/signals/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const signal = await Signal.findById(req.params.id);
    if (!signal) {
      return res.status(404).json({ message: 'Signal not found' });
    }

    const result = signal.toJSON();
    if (!['pro', 'vip'].includes(req.user.plan)) {
      result.aiExplanation = result.aiExplanation.substring(0, 50) + '... [Upgrade to Pro]';
    }

    res.json({ signal: result });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
