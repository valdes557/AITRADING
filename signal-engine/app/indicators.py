import pandas as pd
import numpy as np
from typing import Dict


class TechnicalIndicators:
    """Calculate technical indicators for market analysis."""

    def calculate_all(self, df: pd.DataFrame) -> Dict:
        """Calculate all indicators and return as dict."""
        if len(df) < 20:
            return {}

        close = df["close"]
        high = df["high"]
        low = df["low"]
        volume = df.get("volume", pd.Series([0] * len(df)))

        indicators = {}

        # RSI
        indicators["rsi"] = self.rsi(close, 14)

        # MACD
        macd_line, signal_line, histogram = self.macd(close)
        indicators["macd"] = macd_line
        indicators["macd_signal"] = signal_line
        indicators["macd_hist"] = histogram

        # EMAs
        indicators["ema20"] = self.ema(close, 20)
        indicators["ema50"] = self.ema(close, 50)
        if len(close) >= 200:
            indicators["ema200"] = self.ema(close, 200)
        else:
            indicators["ema200"] = self.ema(close, len(close) - 1)

        # ATR
        indicators["atr"] = self.atr(high, low, close, 14)

        # Bollinger Bands
        bb_upper, bb_middle, bb_lower = self.bollinger_bands(close, 20, 2)
        indicators["bb_upper"] = bb_upper
        indicators["bb_middle"] = bb_middle
        indicators["bb_lower"] = bb_lower

        # Volume ratio (current vs average)
        if volume.sum() > 0:
            avg_vol = volume.iloc[-20:].mean()
            indicators["volume_ratio"] = (
                volume.iloc[-1] / avg_vol if avg_vol > 0 else 1.0
            )
        else:
            indicators["volume_ratio"] = 1.0

        # Stochastic RSI
        indicators["stoch_rsi"] = self.stochastic_rsi(close, 14)

        # ADX (trend strength)
        indicators["adx"] = self.adx(high, low, close, 14)

        # Support & Resistance levels
        indicators["support"] = low.iloc[-20:].min()
        indicators["resistance"] = high.iloc[-20:].max()

        return indicators

    def rsi(self, series: pd.Series, period: int = 14) -> float:
        """Relative Strength Index."""
        delta = series.diff()
        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)

        avg_gain = gain.rolling(window=period, min_periods=period).mean()
        avg_loss = loss.rolling(window=period, min_periods=period).mean()

        rs = avg_gain / avg_loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))
        return float(rsi.iloc[-1]) if not pd.isna(rsi.iloc[-1]) else 50.0

    def macd(
        self,
        series: pd.Series,
        fast: int = 12,
        slow: int = 26,
        signal: int = 9,
    ) -> tuple:
        """MACD indicator."""
        ema_fast = series.ewm(span=fast, adjust=False).mean()
        ema_slow = series.ewm(span=slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        histogram = macd_line - signal_line
        return (
            float(macd_line.iloc[-1]),
            float(signal_line.iloc[-1]),
            float(histogram.iloc[-1]),
        )

    def ema(self, series: pd.Series, period: int) -> float:
        """Exponential Moving Average."""
        result = series.ewm(span=period, adjust=False).mean()
        return float(result.iloc[-1])

    def sma(self, series: pd.Series, period: int) -> float:
        """Simple Moving Average."""
        result = series.rolling(window=period).mean()
        return float(result.iloc[-1]) if not pd.isna(result.iloc[-1]) else float(series.iloc[-1])

    def atr(
        self,
        high: pd.Series,
        low: pd.Series,
        close: pd.Series,
        period: int = 14,
    ) -> float:
        """Average True Range."""
        tr1 = high - low
        tr2 = abs(high - close.shift(1))
        tr3 = abs(low - close.shift(1))
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr_val = tr.rolling(window=period).mean()
        return float(atr_val.iloc[-1]) if not pd.isna(atr_val.iloc[-1]) else float(tr.iloc[-1])

    def bollinger_bands(
        self, series: pd.Series, period: int = 20, std_dev: float = 2.0
    ) -> tuple:
        """Bollinger Bands."""
        middle = series.rolling(window=period).mean()
        std = series.rolling(window=period).std()
        upper = middle + (std * std_dev)
        lower = middle - (std * std_dev)
        return (
            float(upper.iloc[-1]) if not pd.isna(upper.iloc[-1]) else float(series.iloc[-1]),
            float(middle.iloc[-1]) if not pd.isna(middle.iloc[-1]) else float(series.iloc[-1]),
            float(lower.iloc[-1]) if not pd.isna(lower.iloc[-1]) else float(series.iloc[-1]),
        )

    def stochastic_rsi(
        self, series: pd.Series, period: int = 14
    ) -> float:
        """Stochastic RSI."""
        delta = series.diff()
        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)
        avg_gain = gain.rolling(window=period).mean()
        avg_loss = loss.rolling(window=period).mean()
        rs = avg_gain / avg_loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))

        rsi_min = rsi.rolling(window=period).min()
        rsi_max = rsi.rolling(window=period).max()
        stoch = (rsi - rsi_min) / (rsi_max - rsi_min).replace(0, np.nan) * 100

        val = stoch.iloc[-1]
        return float(val) if not pd.isna(val) else 50.0

    def adx(
        self,
        high: pd.Series,
        low: pd.Series,
        close: pd.Series,
        period: int = 14,
    ) -> float:
        """Average Directional Index (trend strength)."""
        plus_dm = high.diff()
        minus_dm = -low.diff()

        plus_dm = plus_dm.where((plus_dm > minus_dm) & (plus_dm > 0), 0.0)
        minus_dm = minus_dm.where((minus_dm > plus_dm) & (minus_dm > 0), 0.0)

        tr1 = high - low
        tr2 = abs(high - close.shift(1))
        tr3 = abs(low - close.shift(1))
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

        atr_val = tr.rolling(window=period).mean()
        plus_di = 100 * (plus_dm.rolling(window=period).mean() / atr_val)
        minus_di = 100 * (minus_dm.rolling(window=period).mean() / atr_val)

        dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di).replace(0, np.nan)
        adx_val = dx.rolling(window=period).mean()

        val = adx_val.iloc[-1]
        return float(val) if not pd.isna(val) else 25.0

    def detect_order_blocks(self, df: pd.DataFrame, lookback: int = 50) -> list:
        """Detect order block zones."""
        blocks = []
        for i in range(max(3, len(df) - lookback), len(df) - 2):
            candle = df.iloc[i]
            body = abs(candle["close"] - candle["open"])
            total_range = candle["high"] - candle["low"]

            if total_range == 0:
                continue

            # Strong candle (body > 60% of range)
            if body / total_range > 0.6:
                is_bullish = candle["close"] > candle["open"]

                # Check if next candles moved in opposite direction significantly
                next_move = df["close"].iloc[i + 1 : i + 4]
                if len(next_move) < 2:
                    continue

                if is_bullish and all(
                    next_move < candle["close"]
                ):
                    blocks.append(
                        {
                            "type": "bearish_ob",
                            "high": candle["high"],
                            "low": candle["low"],
                            "index": i,
                        }
                    )
                elif not is_bullish and all(
                    next_move > candle["close"]
                ):
                    blocks.append(
                        {
                            "type": "bullish_ob",
                            "high": candle["high"],
                            "low": candle["low"],
                            "index": i,
                        }
                    )

        return blocks[-5:]  # Return last 5 order blocks

    def detect_liquidity_zones(self, df: pd.DataFrame) -> Dict:
        """Detect liquidity zones (clusters of equal highs/lows)."""
        highs = df["high"].iloc[-30:]
        lows = df["low"].iloc[-30:]

        # Find clusters (prices within 0.1% of each other)
        threshold = df["close"].iloc[-1] * 0.001

        buy_liquidity = []
        sell_liquidity = []

        for i in range(len(lows)):
            cluster_count = sum(abs(lows.iloc[i] - lows.iloc[j]) < threshold for j in range(len(lows)))
            if cluster_count >= 3:
                buy_liquidity.append(float(lows.iloc[i]))

        for i in range(len(highs)):
            cluster_count = sum(abs(highs.iloc[i] - highs.iloc[j]) < threshold for j in range(len(highs)))
            if cluster_count >= 3:
                sell_liquidity.append(float(highs.iloc[i]))

        return {
            "buy_side": sorted(set(round(x, 5) for x in buy_liquidity))[:3],
            "sell_side": sorted(set(round(x, 5) for x in sell_liquidity), reverse=True)[:3],
        }
