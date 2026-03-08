const User = require('../models/User');
const { sendSignalEmail } = require('./email');
const { sendSignalTelegram } = require('./telegram');
const { notifyUserWhatsApp } = require('./whatsapp');
let pushToAll = null;

// Lazy load to avoid circular dependency
function getPushToAll() {
  if (!pushToAll) {
    try {
      const notifications = require('../routes/notifications');
      pushToAll = notifications.pushToAll;
    } catch {
      pushToAll = () => {};
    }
  }
  return pushToAll;
}

/**
 * Dispatch signal notifications to all eligible users
 * Channels: Email, Telegram, WhatsApp (based on user preferences)
 */
async function dispatchSignalNotifications(signal) {
  try {
    const users = await User.find({ isBanned: false });

    let emailSent = 0;
    let telegramSent = 0;
    let whatsappSent = 0;

    for (const user of users) {
      // Check if user's plan allows this signal
      if (signal.isPremium && !['pro', 'vip'].includes(user.plan)) {
        continue;
      }

      // Check market preference match
      if (
        user.preferences.markets.length > 0 &&
        !user.preferences.markets.includes(signal.market)
      ) {
        continue;
      }

      // Email notification
      if (user.preferences.notifications.email && user.email) {
        try {
          const sent = await sendSignalEmail(user.email, signal);
          if (sent) emailSent++;
        } catch (err) {
          // Silent fail per user
        }
      }

      // Telegram notification
      if (user.preferences.notifications.telegram && user.telegramChatId) {
        try {
          const sent = await sendSignalTelegram(user.telegramChatId, signal);
          if (sent) telegramSent++;
        } catch (err) {
          // Silent fail per user
        }
      }

      // WhatsApp notification
      if (user.preferences.notifications.whatsapp && user.whatsappNumber) {
        try {
          const sent = await notifyUserWhatsApp(user, signal);
          if (sent) whatsappSent++;
        } catch (err) {
          // Silent fail per user
        }
      }

      // Small delay between users to avoid rate limits
      await new Promise((r) => setTimeout(r, 200));
    }

    // Desktop push notification via SSE to all connected browsers
    try {
      const push = getPushToAll();
      push({
        type: 'new_signal',
        signal: {
          _id: signal._id,
          asset: signal.asset,
          direction: signal.direction,
          entry: signal.entry,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
          timeframe: signal.timeframe,
          confidenceScore: signal.confidenceScore,
          strategy: signal.strategy,
          createdAt: signal.createdAt,
        },
      });
    } catch {
      // SSE push is best-effort
    }

    console.log(
      `[Notifications] Signal ${signal.asset} ${signal.direction}: Email=${emailSent}, Telegram=${telegramSent}, WhatsApp=${whatsappSent}`
    );
  } catch (error) {
    console.error('[Notifications] Dispatch failed:', error.message);
  }
}

module.exports = { dispatchSignalNotifications };
