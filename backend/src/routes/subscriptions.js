const express = require('express');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const PlanConfig = require('../models/PlanConfig');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Fallback prices if DB is empty
const DEFAULT_PLANS = {
  basic: { price: 19, name: 'Basic', duration: 30 },
  pro: { price: 49, name: 'Pro', duration: 30 },
  vip: { price: 99, name: 'VIP', duration: 30 },
};

// GET /api/subscriptions/plans — public, reads dynamic prices from DB
router.get('/plans', async (req, res) => {
  try {
    const plans = await PlanConfig.find({ isActive: true }).sort({ price: 1 });

    if (plans.length > 0) {
      return res.json({
        plans: plans.map((p) => ({
          id: p.planId,
          name: p.name,
          price: p.price,
          features: p.features,
          signalsPerDay: p.signalsPerDay,
          highlighted: p.highlighted,
        })),
      });
    }

    // Fallback to hardcoded if DB empty
    res.json({
      plans: [
        { id: 'free', name: 'Free', price: 0, features: ['2 signals per day', 'Basic dashboard', 'Email notifications'], signalsPerDay: 2 },
        { id: 'basic', name: 'Basic', price: 19, features: ['Unlimited signals', 'Full dashboard & stats', 'Signal history', 'Trading journal'], signalsPerDay: 'unlimited' },
        { id: 'pro', name: 'Pro', price: 49, features: ['Everything in Basic', 'AI trade explanations', 'WhatsApp & Telegram alerts', 'Advanced analytics', 'Priority support'], signalsPerDay: 'unlimited', highlighted: true },
        { id: 'vip', name: 'VIP', price: 99, features: ['Everything in Pro', 'Premium signals', 'Daily AI market analysis', 'Custom strategies', '1-on-1 support'], signalsPerDay: 'unlimited' },
      ],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/subscriptions/current
router.get('/current', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: 'active',
    }).sort({ createdAt: -1 });

    res.json({
      subscription,
      plan: req.user.plan,
      planExpiresAt: req.user.planExpiresAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/subscriptions
router.post('/', protect, async (req, res) => {
  try {
    const { plan, paymentMethod, txHash } = req.body;

    // Get plan price from DB or fallback
    let planInfo;
    const dbPlan = await PlanConfig.findOne({ planId: plan, isActive: true });
    if (dbPlan) {
      planInfo = { price: dbPlan.price, name: dbPlan.name, duration: dbPlan.duration || 30 };
    } else if (DEFAULT_PLANS[plan]) {
      planInfo = DEFAULT_PLANS[plan];
    } else {
      return res.status(400).json({ message: 'Invalid plan' });
    }
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planInfo.duration);

    const subscription = await Subscription.create({
      userId: req.user._id,
      plan,
      paymentMethod,
      amount: planInfo.price,
      txHash,
      startDate: new Date(),
      endDate,
      status: txHash ? 'active' : 'pending',
    });

    // Update user plan if payment confirmed
    if (txHash) {
      const user = await User.findById(req.user._id);
      user.plan = plan;
      user.planExpiresAt = endDate;
      await user.save();
      subscription.confirmedAt = new Date();
      await subscription.save();
    }

    res.status(201).json({
      subscription,
      message: txHash
        ? 'Subscription activated successfully'
        : 'Subscription created, awaiting payment confirmation',
      paymentInfo: !txHash
        ? {
            usdt_trc20: {
              address: process.env.USDT_TRC20_ADDRESS || 'YOUR_TRC20_ADDRESS',
              amount: planInfo.price,
              currency: 'USDT',
            },
          }
        : undefined,
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/subscriptions/cancel
router.post('/cancel', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: 'active',
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    // Plan stays active until expiry
    res.json({
      message: 'Subscription cancelled. Your plan remains active until ' + subscription.endDate.toLocaleDateString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
