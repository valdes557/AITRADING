const cron = require('node-cron');
const axios = require('axios');
const Signal = require('../models/Signal');
const User = require('../models/User');

const SIGNAL_ENGINE_URL = process.env.SIGNAL_ENGINE_URL || 'http://localhost:8000';

async function generateSignals() {
  try {
    console.log('[CRON] Starting signal generation...');

    // Get unique user preference combinations
    const users = await User.find({ isBanned: false }).select('preferences plan');
    
    const preferenceSet = new Set();
    const requests = [];

    for (const user of users) {
      const key = JSON.stringify({
        markets: user.preferences.markets,
        strategies: user.preferences.strategies,
        timeframes: user.preferences.timeframes,
        tradingStyle: user.preferences.tradingStyle,
      });

      if (!preferenceSet.has(key)) {
        preferenceSet.add(key);
        requests.push({
          markets: user.preferences.markets,
          trading_style: user.preferences.tradingStyle,
          strategies: user.preferences.strategies,
          timeframes: user.preferences.timeframes,
        });
      }
    }

    let totalSignals = 0;

    for (const req of requests) {
      try {
        const { data } = await axios.post(`${SIGNAL_ENGINE_URL}/generate-signals`, req, {
          timeout: 30000,
        });

        if (data.signals && data.signals.length > 0) {
          for (const s of data.signals) {
            // Check if similar signal already exists (same asset, direction, timeframe in last 4h)
            const existing = await Signal.findOne({
              asset: s.asset,
              direction: s.direction,
              timeframe: s.timeframe,
              status: 'active',
              createdAt: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) },
            });

            if (!existing) {
              await Signal.create({
                asset: s.asset,
                market: s.market,
                direction: s.direction,
                entry: s.entry,
                stopLoss: s.stop_loss,
                takeProfit: s.take_profit,
                riskReward: s.risk_reward,
                timeframe: s.timeframe,
                strategy: s.strategy,
                confidenceScore: s.confidence_score,
                aiExplanation: s.ai_explanation,
                isPremium: s.is_premium,
                indicators: s.indicators,
              });
              totalSignals++;
            }
          }
        }
      } catch (err) {
        console.error(`[CRON] Signal engine error:`, err.message);
      }
    }

    console.log(`[CRON] Generated ${totalSignals} new signals`);

    // Expire old active signals (older than 24h)
    const expired = await Signal.updateMany(
      {
        status: 'active',
        createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      { $set: { status: 'expired', closedAt: new Date() } }
    );

    if (expired.modifiedCount > 0) {
      console.log(`[CRON] Expired ${expired.modifiedCount} old signals`);
    }
  } catch (error) {
    console.error('[CRON] Signal generation failed:', error.message);
  }
}

async function checkSignalResults() {
  try {
    const activeSignals = await Signal.find({ status: 'active' });

    for (const signal of activeSignals) {
      try {
        const { data } = await axios.get(
          `${SIGNAL_ENGINE_URL}/market-data/${signal.asset.replace('/', '')}?timeframe=${signal.timeframe}&limit=1`
        );

        if (!data.data || data.data.length === 0) continue;

        const currentPrice = data.data[data.data.length - 1].close;

        if (signal.direction === 'BUY') {
          if (currentPrice >= signal.takeProfit) {
            const result = ((signal.takeProfit - signal.entry) / signal.entry) * 100;
            signal.status = 'won';
            signal.result = Math.round(result * 100) / 100;
            signal.closedAt = new Date();
            await signal.save();
          } else if (currentPrice <= signal.stopLoss) {
            const result = ((signal.stopLoss - signal.entry) / signal.entry) * 100;
            signal.status = 'lost';
            signal.result = Math.round(result * 100) / 100;
            signal.closedAt = new Date();
            await signal.save();
          }
        } else {
          if (currentPrice <= signal.takeProfit) {
            const result = ((signal.entry - signal.takeProfit) / signal.entry) * 100;
            signal.status = 'won';
            signal.result = Math.round(result * 100) / 100;
            signal.closedAt = new Date();
            await signal.save();
          } else if (currentPrice >= signal.stopLoss) {
            const result = ((signal.entry - signal.stopLoss) / signal.entry) * 100;
            signal.status = 'lost';
            signal.result = Math.round(result * 100) / 100;
            signal.closedAt = new Date();
            await signal.save();
          }
        }
      } catch {
        continue;
      }
    }
  } catch (error) {
    console.error('[CRON] Signal result check failed:', error.message);
  }
}

function startCronJobs() {
  // Generate signals every 30 minutes
  cron.schedule('*/30 * * * *', generateSignals);

  // Check signal results every 5 minutes
  cron.schedule('*/5 * * * *', checkSignalResults);

  console.log('[CRON] Signal generation cron jobs started');

  // Run initial generation after 10 seconds
  setTimeout(generateSignals, 10000);
}

module.exports = { startCronJobs, generateSignals, checkSignalResults };
