import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from datetime import datetime

from app.market_data import MarketDataService
from app.indicators import TechnicalIndicators


class SignalGenerator:
    """AI Signal Generator that analyzes markets and produces trading signals."""

    def __init__(self):
        self.market_data = MarketDataService()
        self.indicators = TechnicalIndicators()

    async def generate(
        self,
        markets: List[str],
        trading_style: List[str],
        strategies: List[str],
        timeframes: List[str],
        assets: Optional[List[str]] = None,
    ) -> List[Dict]:
        """Generate signals based on user preferences."""
        signals = []

        # Get assets to scan
        target_assets = assets or []
        if not target_assets:
            for market in markets:
                target_assets.extend(
                    self.market_data.get_available_assets(market)[:5]
                )

        for asset in target_assets:
            for tf in timeframes:
                for strategy in strategies:
                    try:
                        signal = await self._analyze_and_generate(
                            asset, tf, strategy, trading_style
                        )
                        if signal and signal["confidence_score"] >= 65:
                            signals.append(signal)
                    except Exception as e:
                        print(f"Error analyzing {asset} {tf} {strategy}: {e}")
                        continue

        # Sort by confidence score and return top signals
        signals.sort(key=lambda s: s["confidence_score"], reverse=True)
        return signals[:10]

    async def _analyze_and_generate(
        self, asset: str, timeframe: str, strategy: str, trading_style: List[str]
    ) -> Optional[Dict]:
        """Analyze a single asset and potentially generate a signal."""
        # Fetch market data
        candles = await self.market_data.get_ohlcv(asset, timeframe, 200)
        if len(candles) < 50:
            return None

        df = pd.DataFrame(candles)

        # Calculate all indicators
        indicators = self.indicators.calculate_all(df)

        # Run strategy analysis
        analysis = self._run_strategy(strategy, df, indicators)

        if not analysis or analysis["direction"] is None:
            return None

        # Calculate entry, SL, TP based on strategy
        close = df["close"].iloc[-1]
        atr = indicators.get("atr", close * 0.01)

        if analysis["direction"] == "BUY":
            entry = close
            stop_loss = close - (atr * self._get_sl_multiplier(trading_style))
            take_profit = close + (atr * self._get_tp_multiplier(trading_style))
        else:
            entry = close
            stop_loss = close + (atr * self._get_sl_multiplier(trading_style))
            take_profit = close - (atr * self._get_tp_multiplier(trading_style))

        risk = abs(entry - stop_loss)
        reward = abs(take_profit - entry)
        rr = round(reward / risk, 2) if risk > 0 else 0

        if rr < 1.5:
            return None

        # Generate AI explanation
        explanation = self._generate_explanation(
            asset, analysis, indicators, strategy, timeframe
        )

        # Calculate confidence score
        confidence = self._calculate_confidence(analysis, indicators, rr)

        # Format price precision
        decimals = 5 if close < 10 else 2 if close < 1000 else 0
        fmt = lambda x: round(x, decimals)

        return {
            "asset": asset,
            "market": "crypto" if "USDT" in asset or "BTC" in asset else "forex",
            "direction": analysis["direction"],
            "entry": fmt(entry),
            "stop_loss": fmt(stop_loss),
            "take_profit": fmt(take_profit),
            "risk_reward": rr,
            "timeframe": timeframe,
            "strategy": strategy,
            "confidence_score": confidence,
            "ai_explanation": explanation,
            "is_premium": confidence >= 85,
            "indicators": {
                "rsi": round(indicators.get("rsi", 50), 2),
                "macd": {
                    "value": round(indicators.get("macd", 0), 4),
                    "signal": round(indicators.get("macd_signal", 0), 4),
                    "histogram": round(indicators.get("macd_hist", 0), 4),
                },
                "ema20": fmt(indicators.get("ema20", close)),
                "ema50": fmt(indicators.get("ema50", close)),
                "ema200": fmt(indicators.get("ema200", close)),
                "atr": round(atr, 4),
                "volume": round(indicators.get("volume_ratio", 1), 2),
            },
        }

    def _run_strategy(
        self, strategy: str, df: pd.DataFrame, indicators: Dict
    ) -> Optional[Dict]:
        """Run a specific trading strategy and return analysis."""
        close = df["close"].iloc[-1]
        rsi = indicators.get("rsi", 50)
        macd = indicators.get("macd", 0)
        macd_signal = indicators.get("macd_signal", 0)
        ema20 = indicators.get("ema20", close)
        ema50 = indicators.get("ema50", close)
        ema200 = indicators.get("ema200", close)

        if strategy == "smart_money":
            return self._smart_money_strategy(df, indicators)
        elif strategy == "order_blocks":
            return self._order_blocks_strategy(df, indicators)
        elif strategy == "breakout":
            return self._breakout_strategy(df, indicators)
        elif strategy == "trend_following":
            return self._trend_following_strategy(df, indicators)
        return None

    def _smart_money_strategy(self, df: pd.DataFrame, ind: Dict) -> Dict:
        """Smart Money Concepts strategy."""
        close = df["close"].iloc[-1]
        rsi = ind.get("rsi", 50)
        ema20 = ind.get("ema20", close)
        ema50 = ind.get("ema50", close)
        volume_ratio = ind.get("volume_ratio", 1)

        # Detect liquidity sweep + structure break
        recent_low = df["low"].iloc[-20:].min()
        recent_high = df["high"].iloc[-20:].max()
        prev_low = df["low"].iloc[-5:].min()
        prev_high = df["high"].iloc[-5:].max()

        direction = None
        strength = 0

        # Bullish: price swept below recent low then reversed up
        if prev_low <= recent_low * 1.001 and close > ema20 and rsi > 40:
            direction = "BUY"
            strength = 70 + min(20, (rsi - 40) * 0.5)
        # Bearish: price swept above recent high then reversed down
        elif prev_high >= recent_high * 0.999 and close < ema20 and rsi < 60:
            direction = "SELL"
            strength = 70 + min(20, (60 - rsi) * 0.5)

        if volume_ratio > 1.5:
            strength += 5

        return {"direction": direction, "strength": strength, "type": "smart_money"}

    def _order_blocks_strategy(self, df: pd.DataFrame, ind: Dict) -> Dict:
        """Order Block detection strategy."""
        close = df["close"].iloc[-1]
        rsi = ind.get("rsi", 50)
        macd = ind.get("macd", 0)
        macd_signal = ind.get("macd_signal", 0)

        direction = None
        strength = 0

        # Find bullish OB: last strong bearish candle before a rally
        for i in range(-10, -2):
            candle = df.iloc[i]
            next_candles = df.iloc[i + 1 : i + 4]
            if (
                candle["close"] < candle["open"]  # bearish
                and all(c["close"] > c["open"] for _, c in next_candles.iterrows())
                and close >= candle["low"]
                and close <= candle["high"] * 1.01
            ):
                direction = "BUY"
                strength = 72
                break

        # Find bearish OB
        if direction is None:
            for i in range(-10, -2):
                candle = df.iloc[i]
                next_candles = df.iloc[i + 1 : i + 4]
                if (
                    candle["close"] > candle["open"]  # bullish
                    and all(
                        c["close"] < c["open"] for _, c in next_candles.iterrows()
                    )
                    and close <= candle["high"]
                    and close >= candle["low"] * 0.99
                ):
                    direction = "SELL"
                    strength = 72
                    break

        # Confirm with MACD
        if direction == "BUY" and macd > macd_signal:
            strength += 8
        elif direction == "SELL" and macd < macd_signal:
            strength += 8

        return {"direction": direction, "strength": strength, "type": "order_blocks"}

    def _breakout_strategy(self, df: pd.DataFrame, ind: Dict) -> Dict:
        """Breakout detection strategy."""
        close = df["close"].iloc[-1]
        atr = ind.get("atr", close * 0.01)
        volume_ratio = ind.get("volume_ratio", 1)

        # Consolidation range (last 20 candles)
        high_range = df["high"].iloc[-20:].max()
        low_range = df["low"].iloc[-20:].min()
        range_size = high_range - low_range

        direction = None
        strength = 0

        # Bullish breakout above range with volume
        if close > high_range and volume_ratio > 1.3:
            direction = "BUY"
            strength = 70 + min(15, volume_ratio * 5)
        # Bearish breakout below range with volume
        elif close < low_range and volume_ratio > 1.3:
            direction = "SELL"
            strength = 70 + min(15, volume_ratio * 5)

        # Tight range breakouts are stronger
        if range_size < atr * 3:
            strength += 5

        return {"direction": direction, "strength": strength, "type": "breakout"}

    def _trend_following_strategy(self, df: pd.DataFrame, ind: Dict) -> Dict:
        """Trend following with EMA crossover strategy."""
        close = df["close"].iloc[-1]
        ema20 = ind.get("ema20", close)
        ema50 = ind.get("ema50", close)
        ema200 = ind.get("ema200", close)
        rsi = ind.get("rsi", 50)
        macd = ind.get("macd", 0)
        macd_signal = ind.get("macd_signal", 0)

        direction = None
        strength = 0

        # Strong uptrend: price > EMA20 > EMA50 > EMA200
        if close > ema20 > ema50 > ema200:
            direction = "BUY"
            strength = 75
            if macd > macd_signal:
                strength += 5
            if 40 < rsi < 70:
                strength += 5

        # Strong downtrend: price < EMA20 < EMA50 < EMA200
        elif close < ema20 < ema50 < ema200:
            direction = "SELL"
            strength = 75
            if macd < macd_signal:
                strength += 5
            if 30 < rsi < 60:
                strength += 5

        return {
            "direction": direction,
            "strength": strength,
            "type": "trend_following",
        }

    def _generate_explanation(
        self,
        asset: str,
        analysis: Dict,
        indicators: Dict,
        strategy: str,
        timeframe: str,
    ) -> str:
        """Generate human-readable AI explanation for the signal."""
        direction = analysis["direction"]
        rsi = round(indicators.get("rsi", 50), 1)
        macd = indicators.get("macd", 0)
        macd_signal = indicators.get("macd_signal", 0)
        ema20 = indicators.get("ema20", 0)
        ema50 = indicators.get("ema50", 0)
        volume_ratio = round(indicators.get("volume_ratio", 1), 1)

        strategy_names = {
            "smart_money": "Smart Money Concepts",
            "order_blocks": "Order Block",
            "breakout": "Breakout",
            "trend_following": "Trend Following",
        }
        strat_name = strategy_names.get(strategy, strategy)

        parts = [f"{strat_name} {direction} signal on {asset} ({timeframe})."]

        if strategy == "smart_money":
            if direction == "BUY":
                parts.append(
                    f"Liquidity sweep detected below recent lows with bullish reversal."
                )
            else:
                parts.append(
                    f"Liquidity grab above recent highs followed by bearish rejection."
                )

        elif strategy == "order_blocks":
            if direction == "BUY":
                parts.append(f"Price returning to bullish order block zone.")
            else:
                parts.append(f"Price testing bearish order block with rejection.")

        elif strategy == "breakout":
            if direction == "BUY":
                parts.append(
                    f"Bullish breakout above consolidation range with {volume_ratio}x average volume."
                )
            else:
                parts.append(
                    f"Bearish breakdown below support with {volume_ratio}x average volume."
                )

        elif strategy == "trend_following":
            if direction == "BUY":
                parts.append(
                    f"Strong uptrend confirmed: price above EMA20 ({round(ema20, 2)}) and EMA50 ({round(ema50, 2)})."
                )
            else:
                parts.append(
                    f"Strong downtrend: price below EMA20 ({round(ema20, 2)}) and EMA50 ({round(ema50, 2)})."
                )

        # Add indicator context
        rsi_desc = "overbought" if rsi > 70 else "oversold" if rsi < 30 else "neutral"
        parts.append(f"RSI at {rsi} ({rsi_desc}).")

        macd_desc = "bullish" if macd > macd_signal else "bearish"
        parts.append(f"MACD showing {macd_desc} momentum.")

        if volume_ratio > 1.5:
            parts.append(f"Volume {volume_ratio}x above average, confirming move.")

        return " ".join(parts)

    def _calculate_confidence(
        self, analysis: Dict, indicators: Dict, rr: float
    ) -> int:
        """Calculate confidence score (0-100) based on multiple factors."""
        score = analysis.get("strength", 50)

        # Bonus for good RR
        if rr >= 3:
            score += 5
        elif rr >= 2:
            score += 3

        # Volume confirmation
        if indicators.get("volume_ratio", 1) > 1.5:
            score += 3

        # RSI not extreme (unless strategy expects it)
        rsi = indicators.get("rsi", 50)
        if 35 < rsi < 65:
            score += 2

        return min(95, max(50, int(score)))

    def _get_sl_multiplier(self, trading_style: List[str]) -> float:
        """Get stop loss ATR multiplier based on trading style."""
        if "scalping" in trading_style:
            return 1.0
        elif "intraday" in trading_style:
            return 1.5
        else:  # swing
            return 2.5

    def _get_tp_multiplier(self, trading_style: List[str]) -> float:
        """Get take profit ATR multiplier based on trading style."""
        if "scalping" in trading_style:
            return 2.0
        elif "intraday" in trading_style:
            return 3.5
        else:  # swing
            return 6.0

    async def analyze_asset(self, asset: str, timeframe: str) -> Dict:
        """Full analysis of a single asset."""
        candles = await self.market_data.get_ohlcv(asset, timeframe, 200)
        df = pd.DataFrame(candles)
        indicators = self.indicators.calculate_all(df)
        close = df["close"].iloc[-1]

        return {
            "asset": asset,
            "timeframe": timeframe,
            "price": close,
            "indicators": indicators,
            "support": round(df["low"].iloc[-20:].min(), 5),
            "resistance": round(df["high"].iloc[-20:].max(), 5),
            "trend": "bullish"
            if close > indicators.get("ema50", close)
            else "bearish",
        }

    async def generate_daily_analysis(self) -> Dict:
        """Generate daily market analysis."""
        crypto_assets = ["BTC/USDT", "ETH/USDT", "SOL/USDT"]
        forex_assets = ["EUR/USD", "GBP/USD"]

        analyses = []
        for asset in crypto_assets + forex_assets:
            try:
                a = await self.analyze_asset(asset, "H4")
                analyses.append(a)
            except Exception:
                continue

        opportunities = []
        key_levels = []
        for a in analyses:
            trend = a.get("trend", "neutral")
            opportunities.append(
                f"{a['asset']}: {trend.capitalize()} bias near {a['price']}"
            )
            key_levels.append(
                {
                    "asset": a["asset"],
                    "support": a["support"],
                    "resistance": a["resistance"],
                }
            )

        bullish_count = sum(1 for a in analyses if a.get("trend") == "bullish")
        overall = (
            "Bullish"
            if bullish_count > len(analyses) / 2
            else "Bearish"
            if bullish_count < len(analyses) / 2
            else "Mixed"
        )

        return {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "market_summary": f"Markets showing {overall.lower()} sentiment today across crypto and forex. {len(analyses)} assets analyzed.",
            "bias": overall,
            "opportunities": opportunities,
            "key_levels": key_levels,
        }
