const express = require('express');
const Journal = require('../models/Journal');
const Signal = require('../models/Signal');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/journal
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const entries = await Journal.find({ userId: req.user._id })
      .populate('signalId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Journal.countDocuments({ userId: req.user._id });

    res.json({
      entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get journal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/journal
router.post('/', protect, async (req, res) => {
  try {
    const { signalId, action, entryPrice, exitPrice, pnl, pnlPercent, notes, tags, emotion } = req.body;

    const signal = await Signal.findById(signalId);
    if (!signal) {
      return res.status(404).json({ message: 'Signal not found' });
    }

    const entry = await Journal.create({
      userId: req.user._id,
      signalId,
      action: action || 'followed',
      entryPrice,
      exitPrice,
      pnl,
      pnlPercent,
      notes,
      tags,
      emotion,
    });

    const populated = await Journal.findById(entry._id).populate('signalId');
    res.status(201).json({ entry: populated });
  } catch (error) {
    console.error('Create journal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/journal/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const entry = await Journal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    const { action, entryPrice, exitPrice, pnl, pnlPercent, notes, tags, emotion, closedAt } = req.body;

    if (action) entry.action = action;
    if (entryPrice !== undefined) entry.entryPrice = entryPrice;
    if (exitPrice !== undefined) entry.exitPrice = exitPrice;
    if (pnl !== undefined) entry.pnl = pnl;
    if (pnlPercent !== undefined) entry.pnlPercent = pnlPercent;
    if (notes !== undefined) entry.notes = notes;
    if (tags) entry.tags = tags;
    if (emotion) entry.emotion = emotion;
    if (closedAt) entry.closedAt = closedAt;

    await entry.save();

    const populated = await Journal.findById(entry._id).populate('signalId');
    res.json({ entry: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/journal/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const entries = await Journal.find({ userId: req.user._id, pnl: { $exists: true } });

    const wins = entries.filter((e) => e.pnl > 0);
    const losses = entries.filter((e) => e.pnl <= 0);
    const totalPnl = entries.reduce((sum, e) => sum + (e.pnl || 0), 0);
    const winRate = entries.length > 0 ? (wins.length / entries.length) * 100 : 0;
    const avgWin = wins.length ? wins.reduce((s, e) => s + e.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((s, e) => s + e.pnl, 0) / losses.length : 0;

    res.json({
      totalTrades: entries.length,
      wins: wins.length,
      losses: losses.length,
      winRate: Math.round(winRate * 10) / 10,
      totalPnl: Math.round(totalPnl * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      profitFactor: Math.abs(avgLoss) > 0 ? Math.round((avgWin / Math.abs(avgLoss)) * 100) / 100 : 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
