const express = require('express');
const { protect } = require('../middleware/auth');
const Signal = require('../models/Signal');

const router = express.Router();

// Store active SSE connections
const clients = new Map();

// GET /api/notifications/stream - SSE endpoint for real-time desktop notifications
router.get('/stream', protect, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const userId = req.user._id.toString();

  // Store client connection
  if (!clients.has(userId)) {
    clients.set(userId, []);
  }
  clients.get(userId).push(res);

  // Send heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(':\n\n');
  }, 30000);

  // Cleanup on close
  req.on('close', () => {
    clearInterval(heartbeat);
    const userClients = clients.get(userId) || [];
    const idx = userClients.indexOf(res);
    if (idx !== -1) userClients.splice(idx, 1);
    if (userClients.length === 0) clients.delete(userId);
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
});

// GET /api/notifications/recent - Get recent signals for notification bell
router.get('/recent', protect, async (req, res) => {
  try {
    const signals = await Signal.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('asset direction entry timeframe confidenceScore createdAt');

    res.json({ notifications: signals });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Push notification to specific user via SSE
function pushToUser(userId, data) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.length === 0) return;

  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of userClients) {
    try {
      client.write(payload);
    } catch {
      // Client disconnected
    }
  }
}

// Push notification to all connected users
function pushToAll(data) {
  for (const [userId, userClients] of clients) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of userClients) {
      try {
        client.write(payload);
      } catch {
        // Client disconnected
      }
    }
  }
}

module.exports = { router, pushToUser, pushToAll, clients };
