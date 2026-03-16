const express = require('express');
const ChatMessage = require('../models/ChatMessage');
const Signal = require('../models/Signal');
const { protect, adminOnly, planRequired } = require('../middleware/auth');

const router = express.Router();

// All chat routes require auth + paid plan (basic, pro, vip) OR admin
const subscriberOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  const paidPlans = ['basic', 'pro', 'vip'];
  if (!paidPlans.includes(req.user.plan)) {
    return res.status(403).json({ message: 'Subscription required to access the group chat' });
  }
  if (req.user.plan !== 'free' && !req.user.isPlanActive()) {
    return res.status(403).json({ message: 'Your subscription has expired', expired: true });
  }
  next();
};

router.use(protect, subscriberOrAdmin);

// GET /api/chat/messages - Get paginated messages
router.get('/messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await ChatMessage.find({ isDeleted: false })
      .populate('sender', 'name avatar role plan')
      .populate('signalId', 'asset direction entry stopLoss takeProfit timeframe strategy confidenceScore')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ChatMessage.countDocuments({ isDeleted: false });

    res.json({
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/chat/messages - Send a text message
router.post('/messages', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await ChatMessage.create({
      sender: req.user._id,
      type: 'text',
      content: content.trim(),
    });

    const populated = await ChatMessage.findById(message._id)
      .populate('sender', 'name avatar role plan');

    // Push to SSE clients
    try {
      const { pushToAll } = require('./notifications');
      if (pushToAll) {
        pushToAll({
          type: 'chat_message',
          message: populated,
        });
      }
    } catch {}

    res.status(201).json({ message: populated });
  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/chat/messages/signal - Admin sends a signal in the chat
router.post('/messages/signal', protect, adminOnly, async (req, res) => {
  try {
    const { signalId, content } = req.body;

    if (!signalId) {
      return res.status(400).json({ message: 'Signal ID is required' });
    }

    const signal = await Signal.findById(signalId);
    if (!signal) {
      return res.status(404).json({ message: 'Signal not found' });
    }

    const message = await ChatMessage.create({
      sender: req.user._id,
      type: 'signal',
      content: content || `📊 New Signal: ${signal.direction} ${signal.asset}`,
      signalId: signal._id,
    });

    const populated = await ChatMessage.findById(message._id)
      .populate('sender', 'name avatar role plan')
      .populate('signalId', 'asset direction entry stopLoss takeProfit timeframe strategy confidenceScore riskReward aiExplanation');

    // Push to SSE clients
    try {
      const { pushToAll } = require('./notifications');
      if (pushToAll) {
        pushToAll({
          type: 'chat_message',
          message: populated,
        });
      }
    } catch {}

    res.status(201).json({ message: populated });
  } catch (error) {
    console.error('Send signal in chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/chat/messages/:id - Admin deletes a message
router.delete('/messages/:id', protect, adminOnly, async (req, res) => {
  try {
    const message = await ChatMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.isDeleted = true;
    message.deletedBy = req.user._id;
    await message.save();

    // Push deletion to SSE
    try {
      const { pushToAll } = require('./notifications');
      if (pushToAll) {
        pushToAll({ type: 'chat_delete', messageId: req.params.id });
      }
    } catch {}

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/chat/online - Get count of online subscribers (approximate)
router.get('/online', async (req, res) => {
  try {
    // Count users with paid plans who were active recently
    const User = require('../models/User');
    const paidUsers = await User.countDocuments({
      plan: { $in: ['basic', 'pro', 'vip'] },
      isBanned: false,
    });
    res.json({ totalSubscribers: paidUsers });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
