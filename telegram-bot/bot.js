require('dotenv').config({ path: '../backend/.env' });
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const mongoose = require('mongoose');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-trading-signals';

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Connect to MongoDB to update user telegram chat IDs
mongoose.connect(MONGODB_URI).then(() => {
  console.log('Telegram bot connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
});

// User schema (simplified for bot)
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  plan: String,
  telegramChatId: String,
  preferences: Object,
}, { collection: 'users' });

const User = mongoose.model('TelegramUser', userSchema);

// /start command
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const linkCode = match[1]?.trim();

  const welcome = `
🤖 *AI Trading Signals Bot*

Welcome! I'll send you real-time trading signals powered by AI.

*Commands:*
/link \`your@email.com\` - Link your account
/signals - Get latest active signals
/stats - View your trading stats
/settings - Your preferences
/help - Show all commands

${linkCode ? '🔗 Linking your account...' : '📧 Use /link your@email.com to connect your account.'}
  `;

  bot.sendMessage(chatId, welcome, { parse_mode: 'Markdown' });

  if (linkCode) {
    await linkAccount(chatId, linkCode);
  }
});

// /link command
bot.onText(/\/link (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1].trim().toLowerCase();

  await linkAccount(chatId, email);
});

async function linkAccount(chatId, email) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      bot.sendMessage(chatId, '❌ No account found with that email. Please register at our website first.');
      return;
    }

    user.telegramChatId = String(chatId);
    await user.save();

    bot.sendMessage(
      chatId,
      `✅ *Account linked successfully!*\n\n👤 ${user.name}\n📧 ${user.email}\n💎 Plan: ${user.plan.toUpperCase()}\n\nYou'll now receive signal alerts here!`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Link error:', error);
    bot.sendMessage(chatId, '❌ Error linking account. Please try again.');
  }
}

// /signals command
bot.onText(/\/signals/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({ telegramChatId: String(chatId) });
    if (!user) {
      bot.sendMessage(chatId, '⚠️ Account not linked. Use /link your@email.com');
      return;
    }

    // Fetch from API or directly from DB
    const Signal = mongoose.model('Signal', new mongoose.Schema({}, { strict: false, collection: 'signals' }));
    const signals = await Signal.find({ status: 'active' }).sort({ createdAt: -1 }).limit(5);

    if (signals.length === 0) {
      bot.sendMessage(chatId, '📊 No active signals right now. Stay tuned!');
      return;
    }

    for (const signal of signals) {
      const s = signal.toObject();
      const emoji = s.direction === 'BUY' ? '🟢' : '🔴';
      const arrow = s.direction === 'BUY' ? '⬆️' : '⬇️';

      let message = `
${emoji} *${s.direction} ${s.asset}* ${arrow}
━━━━━━━━━━━━━━━
📊 Timeframe: ${s.timeframe}
🎯 Strategy: ${s.strategy}
📈 Confidence: ${s.confidenceScore}%

💰 Entry: \`${s.entry}\`
🛑 Stop Loss: \`${s.stopLoss}\`
✅ Take Profit: \`${s.takeProfit}\`
📐 R:R: ${s.riskReward}:1
`;

      if (['pro', 'vip'].includes(user.plan) && s.aiExplanation) {
        message += `\n🧠 *AI Analysis:*\n${s.aiExplanation}`;
      } else if (s.aiExplanation) {
        message += `\n🔒 _Upgrade to Pro for AI analysis_`;
      }

      message += `\n━━━━━━━━━━━━━━━`;

      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Signals error:', error);
    bot.sendMessage(chatId, '❌ Error fetching signals. Please try again.');
  }
});

// /stats command
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({ telegramChatId: String(chatId) });
    if (!user) {
      bot.sendMessage(chatId, '⚠️ Account not linked. Use /link your@email.com');
      return;
    }

    const Signal = mongoose.model('Signal', new mongoose.Schema({}, { strict: false, collection: 'signals' }));
    const total = await Signal.countDocuments();
    const active = await Signal.countDocuments({ status: 'active' });
    const won = await Signal.countDocuments({ status: 'won' });
    const lost = await Signal.countDocuments({ status: 'lost' });
    const winRate = (won + lost) > 0 ? ((won / (won + lost)) * 100).toFixed(1) : '0';

    const message = `
📊 *Trading Statistics*
━━━━━━━━━━━━━━━
📈 Total Signals: ${total}
⚡ Active: ${active}
✅ Won: ${won}
❌ Lost: ${lost}
🎯 Win Rate: ${winRate}%
💎 Your Plan: ${user.plan.toUpperCase()}
━━━━━━━━━━━━━━━
    `;

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Error fetching stats.');
  }
});

// /settings command
bot.onText(/\/settings/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({ telegramChatId: String(chatId) });
    if (!user) {
      bot.sendMessage(chatId, '⚠️ Account not linked. Use /link your@email.com');
      return;
    }

    const prefs = user.preferences || {};
    const message = `
⚙️ *Your Settings*
━━━━━━━━━━━━━━━
👤 ${user.name}
📧 ${user.email}
💎 Plan: ${user.plan.toUpperCase()}

📊 Markets: ${(prefs.markets || ['crypto']).join(', ')}
⏱️ Style: ${(prefs.tradingStyle || ['intraday']).join(', ')}
🧠 Strategies: ${(prefs.strategies || ['smart_money']).join(', ')}
🕐 Timeframes: ${(prefs.timeframes || ['H1']).join(', ')}
━━━━━━━━━━━━━━━
_Modify settings on the web dashboard_
    `;

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Error fetching settings.');
  }
});

// /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const message = `
🤖 *AI Trading Signals Bot - Help*
━━━━━━━━━━━━━━━
/start - Welcome message
/link \`email\` - Link your account
/signals - Active trading signals
/stats - Trading statistics
/settings - Your preferences
/help - This help menu
━━━━━━━━━━━━━━━
🌐 Visit our website for full features
  `;
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Function to broadcast signal to all subscribed users
async function broadcastSignal(signal) {
  try {
    const users = await User.find({
      telegramChatId: { $exists: true, $ne: null },
    });

    const emoji = signal.direction === 'BUY' ? '🟢' : '🔴';
    const arrow = signal.direction === 'BUY' ? '⬆️' : '⬇️';

    for (const user of users) {
      // Check plan limits
      if (signal.isPremium && !['pro', 'vip'].includes(user.plan)) {
        continue;
      }

      let message = `
🚨 *NEW SIGNAL* 🚨

${emoji} *${signal.direction} ${signal.asset}* ${arrow}
━━━━━━━━━━━━━━━
📊 ${signal.timeframe} | ${signal.strategy}
📈 Confidence: ${signal.confidenceScore}%

💰 Entry: \`${signal.entry}\`
🛑 SL: \`${signal.stopLoss}\`
✅ TP: \`${signal.takeProfit}\`
📐 R:R: ${signal.riskReward}:1
`;

      if (['pro', 'vip'].includes(user.plan) && signal.aiExplanation) {
        message += `\n🧠 *AI:* ${signal.aiExplanation}`;
      }

      try {
        await bot.sendMessage(user.telegramChatId, message, {
          parse_mode: 'Markdown',
        });
      } catch (err) {
        console.error(`Failed to send to ${user.telegramChatId}:`, err.message);
      }
    }

    console.log(`Signal broadcasted to ${users.length} users`);
  } catch (error) {
    console.error('Broadcast error:', error);
  }
}

// Export for use by signal cron job
module.exports = { bot, broadcastSignal };

console.log('🤖 AI Trading Signals Telegram Bot is running...');
