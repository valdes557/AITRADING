const axios = require('axios');
const User = require('../models/User');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// In-memory store for linking codes: { code: userId }
const linkingCodes = new Map();

let lastUpdateId = 0;
let botUsername = '';

/**
 * Generate a unique linking code for a user
 */
function generateLinkingCode(userId) {
  // Remove any existing code for this user
  for (const [code, uid] of linkingCodes.entries()) {
    if (uid === userId) linkingCodes.delete(code);
  }

  const code = 'LINK_' + Math.random().toString(36).substring(2, 10).toUpperCase();
  linkingCodes.set(code, userId);

  // Expire after 10 minutes
  setTimeout(() => linkingCodes.delete(code), 10 * 60 * 1000);

  return code;
}

/**
 * Get the bot username
 */
async function getBotUsername() {
  if (botUsername) return botUsername;
  try {
    const { data } = await axios.get(`${API_BASE}/getMe`);
    botUsername = data.result.username;
    return botUsername;
  } catch (err) {
    console.error('[TelegramBot] Failed to get bot info:', err.message);
    return null;
  }
}

/**
 * Process incoming Telegram updates
 */
async function processUpdates() {
  try {
    const { data } = await axios.get(`${API_BASE}/getUpdates`, {
      params: {
        offset: lastUpdateId + 1,
        timeout: 30,
        allowed_updates: ['message'],
      },
      timeout: 35000,
    });

    if (!data.ok || !data.result) return;

    for (const update of data.result) {
      lastUpdateId = update.update_id;

      if (!update.message || !update.message.text) continue;

      const chatId = update.message.chat.id.toString();
      const text = update.message.text.trim();
      const firstName = update.message.from?.first_name || 'Trader';

      if (text === '/start' || text === '/help') {
        await sendMessage(chatId,
          `👋 Bienvenue ${firstName} sur *AI Trading Signals Bot* !\n\n` +
          `Pour recevoir les signaux de trading sur Telegram, vous devez lier votre compte.\n\n` +
          `📋 *Comment faire :*\n` +
          `1. Connectez-vous sur la plateforme AI Trading Signals\n` +
          `2. Allez dans *Paramètres* → section *Telegram*\n` +
          `3. Cliquez sur *Générer un code de liaison*\n` +
          `4. Envoyez le code ici\n\n` +
          `Exemple: \`LINK_ABC12345\`\n\n` +
          `💡 _Vous pouvez aussi envoyer directement votre code de liaison si vous l'avez déjà._`
        );
      } else if (text.startsWith('LINK_')) {
        // Try to link account
        const code = text.trim();
        const userId = linkingCodes.get(code);

        if (!userId) {
          await sendMessage(chatId,
            `❌ Code invalide ou expiré.\n\n` +
            `Générez un nouveau code depuis la plateforme :\n` +
            `*Paramètres* → *Telegram* → *Générer un code*`
          );
        } else {
          try {
            const user = await User.findById(userId);
            if (!user) {
              await sendMessage(chatId, `❌ Utilisateur introuvable.`);
            } else {
              user.telegramChatId = chatId;
              user.preferences.notifications.telegram = true;
              await user.save();
              linkingCodes.delete(code);

              await sendMessage(chatId,
                `✅ *Compte lié avec succès !*\n\n` +
                `Bonjour ${user.name} ! 🎉\n` +
                `Vous recevrez désormais tous les signaux de trading directement ici.\n\n` +
                `📊 Bonne chance sur les marchés !`
              );
              console.log(`[TelegramBot] User ${user.email} linked to chat ${chatId}`);
            }
          } catch (err) {
            console.error('[TelegramBot] Link error:', err.message);
            await sendMessage(chatId, `❌ Erreur serveur. Réessayez.`);
          }
        }
      } else {
        await sendMessage(chatId,
          `🤖 Je suis le bot AI Trading Signals.\n\n` +
          `Commandes disponibles :\n` +
          `/start - Instructions de liaison\n\n` +
          `Pour lier votre compte, envoyez votre code de liaison (ex: \`LINK_ABC12345\`).`
        );
      }
    }
  } catch (err) {
    if (!err.message.includes('timeout') && !err.message.includes('ETIMEDOUT')) {
      console.error('[TelegramBot] Polling error:', err.message);
    }
  }
}

/**
 * Send a message via Telegram
 */
async function sendMessage(chatId, text) {
  try {
    await axios.post(`${API_BASE}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }, { timeout: 10000 });
  } catch (err) {
    console.error(`[TelegramBot] Send failed to ${chatId}:`, err.message);
  }
}

/**
 * Start the Telegram bot long-polling loop
 */
async function startTelegramBot() {
  if (!BOT_TOKEN || BOT_TOKEN === 'your_telegram_bot_token') {
    console.warn('[TelegramBot] Bot token not configured, skipping bot start');
    return;
  }

  const username = await getBotUsername();
  if (username) {
    console.log(`[TelegramBot] Bot @${username} started polling`);
  } else {
    console.error('[TelegramBot] Could not get bot info, check your TELEGRAM_BOT_TOKEN');
    return;
  }

  // Continuous polling loop
  const poll = async () => {
    while (true) {
      await processUpdates();
      // Small delay to avoid hammering the API
      await new Promise((r) => setTimeout(r, 1000));
    }
  };

  poll().catch((err) => console.error('[TelegramBot] Fatal error:', err.message));
}

module.exports = { startTelegramBot, generateLinkingCode, getBotUsername, linkingCodes };
