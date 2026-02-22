const express = require('express');
const Signal = require('../models/Signal');
const Journal = require('../models/Journal');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const totalSignals = await Signal.countDocuments();
    const activeSignals = await Signal.countDocuments({ status: 'active' });
    const wonSignals = await Signal.find({ status: 'won' });
    const lostSignals = await Signal.find({ status: 'lost' });
    const closed = wonSignals.length + lostSignals.length;

    const winRate = closed > 0 ? ((wonSignals.length / closed) * 100) : 0;

    const allClosed = [...wonSignals, ...lostSignals];
    const avgRR = allClosed.length
      ? allClosed.reduce((sum, s) => sum + (s.riskReward || 0), 0) / allClosed.length
      : 0;

    const totalPnl = allClosed.reduce((sum, s) => sum + (s.result || 0), 0);

    const results = allClosed.map((s) => s.result || 0).sort((a, b) => a - b);
    const bestTrade = results.length ? results[results.length - 1] : 0;
    const worstTrade = results.length ? results[0] : 0;

    // Compute simple drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let equity = 0;
    for (const r of allClosed.sort((a, b) => a.createdAt - b.createdAt)) {
      equity += r.result || 0;
      if (equity > peak) peak = equity;
      const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // Equity curve (last 30 closed signals)
    const recentClosed = allClosed
      .sort((a, b) => new Date(a.closedAt || a.createdAt) - new Date(b.closedAt || b.createdAt))
      .slice(-30);

    let cumulative = 10000;
    const equityCurve = recentClosed.map((s) => {
      cumulative += (s.result || 0) * 100;
      return {
        date: (s.closedAt || s.createdAt).toISOString().split('T')[0],
        value: Math.round(cumulative * 100) / 100,
      };
    });

    // Recent signals
    const recentSignals = await Signal.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalSignals,
      activeSignals,
      winRate: Math.round(winRate * 10) / 10,
      avgRR: Math.round(avgRR * 100) / 100,
      totalPnl: Math.round(totalPnl * 100) / 100,
      drawdown: -Math.round(maxDrawdown * 10) / 10,
      bestTrade: Math.round(bestTrade * 100) / 100,
      worstTrade: Math.round(worstTrade * 100) / 100,
      equityCurve,
      recentSignals,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/daily-analysis
router.get('/daily-analysis', protect, async (req, res) => {
  try {
    // This will be populated by the Python signal engine
    const analysis = {
      date: new Date().toISOString().split('T')[0],
      marketSummary:
        'Markets showing mixed signals today. BTC consolidating near 67,500 with potential breakout above 68,000. EUR/USD testing key support at 1.0850.',
      bias: 'Cautiously Bullish',
      opportunities: [
        'BTC/USDT: Watching for breakout above 68,000 resistance',
        'EUR/USD: Potential bounce from 1.0850 support zone',
        'ETH/USDT: Consolidation pattern forming, wait for confirmation',
      ],
      keyLevels: [
        { asset: 'BTC/USDT', support: 66800, resistance: 68200 },
        { asset: 'EUR/USD', support: 1.085, resistance: 1.0895 },
        { asset: 'ETH/USDT', support: 3380, resistance: 3520 },
      ],
    };

    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/equity-curve
router.get('/equity-curve', protect, async (req, res) => {
  try {
    const entries = await Journal.find({ userId: req.user._id })
      .sort({ createdAt: 1 })
      .select('pnl createdAt');

    let cumulative = 10000;
    const curve = entries.map((e) => {
      cumulative += e.pnl || 0;
      return {
        date: e.createdAt.toISOString().split('T')[0],
        value: Math.round(cumulative * 100) / 100,
      };
    });

    res.json({ equityCurve: curve });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
