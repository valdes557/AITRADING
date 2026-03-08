const axios = require('axios');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

function formatSignalTelegram(signal) {
  const direction = signal.direction === 'BUY' ? '🟢 BUY' : '🔴 SELL';
  const confidence = '⭐'.repeat(Math.min(Math.round(signal.confidenceScore / 20), 5));

  return `📊 *AI Trading Signal*

${direction} *${signal.asset}*
⏰ Timeframe: ${signal.timeframe}
📈 Strategy: ${signal.strategy}

💰 Entry: \`${signal.entry}\`
🛑 Stop Loss: \`${signal.stopLoss}\`
🎯 Take Profit: \`${signal.takeProfit}\`
📐 Risk/Reward: ${signal.riskReward}

🧠 Confidence: ${signal.confidenceScore}% ${confidence}

${signal.aiExplanation ? `💡 _${signal.aiExplanation.substring(0, 200)}_` : ''}

_AI Trading Signals — Trade Smarter_`;
}

async function sendTelegramMessage(chatId, text) {
  try {
    if (!BOT_TOKEN || BOT_TOKEN === 'your_telegram_bot_token') {
      console.warn('[Telegram] Bot token not configured');
      return false;
    }
    if (!chatId) return false;

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      },
      { timeout: 10000 }
    );

    console.log(`[Telegram] Message sent to chat ${chatId}`);
    return true;
  } catch (error) {
    console.error(`[Telegram] Failed to send to ${chatId}:`, error.message);
    return false;
  }
}

async function sendSignalTelegram(chatId, signal) {
  const message = formatSignalTelegram(signal);
  return sendTelegramMessage(chatId, message);
}

module.exports = { sendTelegramMessage, sendSignalTelegram, formatSignalTelegram };
