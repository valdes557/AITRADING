const axios = require('axios');

// WhatsApp Business API via CallMeBot (free) or Twilio
// For production, use Twilio WhatsApp API or official WhatsApp Business API

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || '';
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || '';

/**
 * Send a WhatsApp message using CallMeBot free API
 * User must first authorize: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 * Or use Twilio WhatsApp Sandbox for development
 */
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    if (!phoneNumber) {
      console.warn('[WhatsApp] No phone number provided');
      return false;
    }

    // Option 1: CallMeBot (free, user must authorize first)
    if (process.env.WHATSAPP_PROVIDER === 'callmebot') {
      const apiKey = process.env.CALLMEBOT_API_KEY || '';
      const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
      await axios.get(url, { timeout: 10000 });
      console.log(`[WhatsApp] Message sent to ${phoneNumber}`);
      return true;
    }

    // Option 2: Twilio WhatsApp
    if (process.env.WHATSAPP_PROVIDER === 'twilio') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      await axios.post(
        url,
        new URLSearchParams({
          To: `whatsapp:${phoneNumber}`,
          From: fromNumber,
          Body: message,
        }).toString(),
        {
          auth: { username: accountSid, password: authToken },
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000,
        }
      );
      console.log(`[WhatsApp] Twilio message sent to ${phoneNumber}`);
      return true;
    }

    // Option 3: Generic WhatsApp Business API
    if (WHATSAPP_API_URL && WHATSAPP_API_TOKEN) {
      await axios.post(
        WHATSAPP_API_URL,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber.replace('+', ''),
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      console.log(`[WhatsApp] API message sent to ${phoneNumber}`);
      return true;
    }

    console.warn('[WhatsApp] No provider configured. Set WHATSAPP_PROVIDER in .env');
    return false;
  } catch (error) {
    console.error(`[WhatsApp] Failed to send to ${phoneNumber}:`, error.message);
    return false;
  }
}

/**
 * Format a trading signal into a WhatsApp message
 */
function formatSignalMessage(signal) {
  const direction = signal.direction === 'BUY' ? '🟢 BUY' : '🔴 SELL';
  const confidence = '⭐'.repeat(Math.min(Math.round(signal.confidenceScore / 20), 5));

  return `📊 *AI Trading Signal*

${direction} *${signal.asset}*
⏰ Timeframe: ${signal.timeframe}
📈 Strategy: ${signal.strategy}

💰 Entry: ${signal.entry}
🛑 Stop Loss: ${signal.stopLoss}
🎯 Take Profit: ${signal.takeProfit}
📐 Risk/Reward: ${signal.riskReward}

🧠 Confidence: ${signal.confidenceScore}% ${confidence}

${signal.aiExplanation ? `💡 _${signal.aiExplanation.substring(0, 200)}_` : ''}

_AI Trading Signals - Trade Smarter_`;
}

/**
 * Send signal notification to a user via WhatsApp
 */
async function notifyUserWhatsApp(user, signal) {
  if (!user.whatsappNumber || !user.preferences?.notifications?.whatsapp) {
    return false;
  }
  const message = formatSignalMessage(signal);
  return sendWhatsAppMessage(user.whatsappNumber, message);
}

/**
 * Broadcast signal to all users with WhatsApp enabled
 */
async function broadcastSignalWhatsApp(users, signal) {
  const eligible = users.filter(
    (u) => u.whatsappNumber && u.preferences?.notifications?.whatsapp && !u.isBanned
  );

  let sent = 0;
  for (const user of eligible) {
    const success = await notifyUserWhatsApp(user, signal);
    if (success) sent++;
    // Rate limiting: wait 1s between messages
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`[WhatsApp] Broadcast complete: ${sent}/${eligible.length} sent`);
  return sent;
}

module.exports = {
  sendWhatsAppMessage,
  formatSignalMessage,
  notifyUserWhatsApp,
  broadcastSignalWhatsApp,
};
