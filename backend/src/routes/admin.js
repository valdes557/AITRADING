const express = require('express');
const User = require('../models/User');
const Signal = require('../models/Signal');
const Subscription = require('../models/Subscription');
const PlanConfig = require('../models/PlanConfig');
const Testimonial = require('../models/Testimonial');
const SiteConfig = require('../models/SiteConfig');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const signalsGenerated = await Signal.countDocuments();

    const revenue = await Subscription.aggregate([
      { $match: { status: { $in: ['active', 'expired'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // User growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Plan distribution
    const planDistribution = await User.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]);

    res.json({
      totalUsers,
      activeSubscriptions,
      signalsGenerated,
      revenue: revenue.length ? revenue[0].total : 0,
      userGrowth: userGrowth.map((u) => ({ date: u._id, count: u.count })),
      planDistribution: planDistribution.map((p) => ({ plan: p._id, count: p.count })),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
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

// POST /api/admin/users/:id/ban
router.post('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBanned = true;
    await user.save();
    res.json({ message: 'User banned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/users/:id/unban
router.post('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBanned = false;
    await user.save();
    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('userId', 'name email plan')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ subscriptions });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/signals - Create manual signal
router.post('/signals', async (req, res) => {
  try {
    const signal = await Signal.create({
      ...req.body,
      isManual: true,
      createdBy: req.user._id,
    });
    res.status(201).json({ signal });
  } catch (error) {
    console.error('Create manual signal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/announcements
router.post('/announcements', async (req, res) => {
  try {
    const { title, message } = req.body;
    // TODO: Send to all users via email/telegram
    // For now, just log it
    console.log(`Announcement: ${title} - ${message}`);
    res.json({ message: 'Announcement sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== PLAN MANAGEMENT ==========

// GET /api/admin/plans
router.get('/plans', async (req, res) => {
  try {
    let plans = await PlanConfig.find().sort({ price: 1 });

    // Seed defaults if empty
    if (plans.length === 0) {
      const defaults = [
        { planId: 'free', name: 'Free', price: 0, duration: 0, features: ['2 signals per day', 'Basic dashboard', 'Email notifications'], signalsPerDay: 2 },
        { planId: 'basic', name: 'Basic', price: 19, duration: 30, features: ['Unlimited signals', 'Full dashboard & stats', 'Signal history', 'Trading journal'], signalsPerDay: 'unlimited' },
        { planId: 'pro', name: 'Pro', price: 49, duration: 30, features: ['Everything in Basic', 'AI trade explanations', 'Fast Telegram alerts', 'WhatsApp alerts', 'Advanced analytics', 'Priority support'], signalsPerDay: 'unlimited', highlighted: true },
        { planId: 'vip', name: 'VIP', price: 99, duration: 30, features: ['Everything in Pro', 'Premium signals', 'Daily AI market analysis', 'Custom strategies', '1-on-1 support'], signalsPerDay: 'unlimited' },
      ];
      plans = await PlanConfig.insertMany(defaults);
    }

    res.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/plans/:planId
router.put('/plans/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const { price, name, features, duration, signalsPerDay, highlighted, isActive } = req.body;

    let plan = await PlanConfig.findOne({ planId });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (price !== undefined) plan.price = price;
    if (name !== undefined) plan.name = name;
    if (features !== undefined) plan.features = features;
    if (duration !== undefined) plan.duration = duration;
    if (signalsPerDay !== undefined) plan.signalsPerDay = signalsPerDay;
    if (highlighted !== undefined) plan.highlighted = highlighted;
    if (isActive !== undefined) plan.isActive = isActive;

    await plan.save();
    res.json({ plan, message: 'Plan updated successfully' });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== TESTIMONIALS ==========

// GET /api/admin/testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 });
    res.json({ testimonials });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/testimonials
router.post('/testimonials', async (req, res) => {
  try {
    const { name, role, text, rating, avatar, isVisible, order } = req.body;

    if (!name || !role || !text) {
      return res.status(400).json({ message: 'Name, role and text are required' });
    }

    const testimonial = await Testimonial.create({
      name,
      role,
      text,
      rating: rating || 5,
      avatar,
      isVisible: isVisible !== undefined ? isVisible : true,
      order: order || 0,
      createdBy: req.user._id,
    });

    res.status(201).json({ testimonial, message: 'Testimonial added successfully' });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/testimonials/:id
router.put('/testimonials/:id', async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    const { name, role, text, rating, avatar, isVisible, order } = req.body;
    if (name !== undefined) testimonial.name = name;
    if (role !== undefined) testimonial.role = role;
    if (text !== undefined) testimonial.text = text;
    if (rating !== undefined) testimonial.rating = rating;
    if (avatar !== undefined) testimonial.avatar = avatar;
    if (isVisible !== undefined) testimonial.isVisible = isVisible;
    if (order !== undefined) testimonial.order = order;

    await testimonial.save();
    res.json({ testimonial, message: 'Testimonial updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/testimonials/:id
router.delete('/testimonials/:id', async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== CLIENT PLAN MANAGEMENT ==========

// PUT /api/admin/users/:id/plan - Activate/change a client's plan
router.put('/users/:id/plan', async (req, res) => {
  try {
    const { plan, duration } = req.body;
    const validPlans = ['free', 'basic', 'pro', 'vip'];

    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan. Must be: free, basic, pro, or vip' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.plan = plan;

    if (plan === 'free') {
      user.planExpiresAt = undefined;
    } else {
      const days = duration || 30;
      user.planExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    await user.save();

    // Also create/update a subscription record
    if (plan !== 'free') {
      await Subscription.findOneAndUpdate(
        { userId: user._id, status: 'active' },
        {
          userId: user._id,
          plan,
          status: 'active',
          startDate: new Date(),
          endDate: user.planExpiresAt,
          paymentMethod: 'admin_activated',
          amount: 0,
          currency: 'USD',
        },
        { upsert: true, new: true }
      );
    } else {
      // Deactivate any active subscription
      await Subscription.updateMany(
        { userId: user._id, status: 'active' },
        { status: 'cancelled' }
      );
    }

    res.json({
      message: `User plan updated to ${plan}`,
      user: { _id: user._id, name: user.name, email: user.email, plan: user.plan, planExpiresAt: user.planExpiresAt },
    });
  } catch (error) {
    console.error('Update user plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== SITE CONFIG ==========

// GET /api/admin/site-config
router.get('/site-config', async (req, res) => {
  try {
    const platformName = await SiteConfig.get('platformName', 'AI Trading Signals');
    const logoUrl = await SiteConfig.get('logoUrl', '');
    res.json({ platformName, logoUrl });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/site-config
router.put('/site-config', async (req, res) => {
  try {
    const { platformName, logoUrl } = req.body;
    if (platformName !== undefined) await SiteConfig.set('platformName', platformName);
    if (logoUrl !== undefined) await SiteConfig.set('logoUrl', logoUrl);
    res.json({ message: 'Site configuration updated', platformName, logoUrl });
  } catch (error) {
    console.error('Update site config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
