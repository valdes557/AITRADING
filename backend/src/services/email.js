const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[Email] SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(port) || 587,
    secure: parseInt(port) === 465,
    auth: { user, pass },
  });

  return transporter;
}

function formatSignalEmail(signal) {
  const direction = signal.direction === 'BUY' ? '🟢 BUY' : '🔴 SELL';
  const confidence = Math.round(signal.confidenceScore);

  return {
    subject: `${direction} ${signal.asset} - AI Trading Signal (${confidence}% confidence)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6c5ce7, #a855f7); padding: 20px 24px;">
          <h1 style="margin: 0; font-size: 18px; color: white;">AI Trading Signal</h1>
        </div>
        <div style="padding: 24px;">
          <div style="background: #16213e; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h2 style="margin: 0 0 8px; font-size: 22px; color: ${signal.direction === 'BUY' ? '#00b894' : '#e74c3c'};">
              ${direction} ${signal.asset}
            </h2>
            <p style="margin: 0; color: #a0a0a0; font-size: 13px;">
              ${signal.timeframe} | ${signal.strategy} | Confidence: ${confidence}%
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #2a2a4a;">💰 Entry</td>
              <td style="padding: 10px; border-bottom: 1px solid #2a2a4a; text-align: right; font-weight: bold;">${signal.entry}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #2a2a4a;">🛑 Stop Loss</td>
              <td style="padding: 10px; border-bottom: 1px solid #2a2a4a; text-align: right; color: #e74c3c;">${signal.stopLoss}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #2a2a4a;">🎯 Take Profit</td>
              <td style="padding: 10px; border-bottom: 1px solid #2a2a4a; text-align: right; color: #00b894;">${signal.takeProfit}</td>
            </tr>
            <tr>
              <td style="padding: 10px;">📐 Risk/Reward</td>
              <td style="padding: 10px; text-align: right; font-weight: bold;">${signal.riskReward}</td>
            </tr>
          </table>

          ${signal.aiExplanation ? `
          <div style="background: #16213e; border-left: 3px solid #a855f7; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
            <p style="margin: 0 0 4px; font-size: 12px; color: #a855f7; font-weight: bold;">AI Analysis</p>
            <p style="margin: 0; font-size: 13px; color: #c0c0c0;">${signal.aiExplanation.substring(0, 300)}</p>
          </div>` : ''}

          <p style="text-align: center; color: #666; font-size: 11px; margin-top: 24px;">
            AI Trading Signals — Trade Smarter<br>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/signals" style="color: #a855f7;">View in Dashboard</a>
          </p>
        </div>
      </div>
    `,
  };
}

async function sendSignalEmail(userEmail, signal) {
  try {
    const t = getTransporter();
    if (!t) return false;

    const { subject, html } = formatSignalEmail(signal);

    await t.sendMail({
      from: `"AI Trading Signals" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject,
      html,
    });

    console.log(`[Email] Signal sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send to ${userEmail}:`, error.message);
    return false;
  }
}

async function sendPasswordResetEmail(userEmail, resetUrl) {
  try {
    const t = getTransporter();
    if (!t) return false;

    await t.sendMail({
      from: `"AI Trading Signals" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Password Reset - AI Trading Signals',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; color: #e0e0e0; border-radius: 12px; padding: 32px;">
          <h2 style="color: #a855f7;">Password Reset</h2>
          <p>Click the button below to reset your password. This link expires in 30 minutes.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #a855f7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 12px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error(`[Email] Reset email failed:`, error.message);
    return false;
  }
}

module.exports = { sendSignalEmail, sendPasswordResetEmail, formatSignalEmail };
