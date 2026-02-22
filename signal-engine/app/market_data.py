import aiohttp
import pandas as pd
from typing import List, Dict, Optional
from datetime import datetime


TIMEFRAME_MAP = {
    "M5": "5m",
    "M15": "15m",
    "H1": "1h",
    "H4": "4h",
    "D1": "1d",
}

CRYPTO_ASSETS = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
    "ADAUSDT", "DOGEUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT",
]

FOREX_ASSETS = [
    "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD",
    "NZDUSD", "USDCHF", "EURGBP", "EURJPY", "GBPJPY",
]


class MarketDataService:
    """Fetches market data from Binance (crypto) and generates forex mock data."""

    def __init__(self):
        self.binance_base = "https://api.binance.com/api/v3"

    async def get_ohlcv(
        self, asset: str, timeframe: str = "H1", limit: int = 100
    ) -> List[Dict]:
        """Get OHLCV candle data for an asset."""
        interval = TIMEFRAME_MAP.get(timeframe, "1h")

        if self._is_crypto(asset):
            return await self._get_binance_klines(asset, interval, limit)
        else:
            return self._generate_forex_data(asset, interval, limit)

    async def _get_binance_klines(
        self, symbol: str, interval: str, limit: int
    ) -> List[Dict]:
        """Fetch klines from Binance API."""
        url = f"{self.binance_base}/klines"
        params = {"symbol": symbol.replace("/", ""), "interval": interval, "limit": limit}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as resp:
                    if resp.status != 200:
                        return self._generate_mock_data(symbol, limit)
                    data = await resp.json()
                    return [
                        {
                            "timestamp": k[0],
                            "open": float(k[1]),
                            "high": float(k[2]),
                            "low": float(k[3]),
                            "close": float(k[4]),
                            "volume": float(k[5]),
                        }
                        for k in data
                    ]
        except Exception:
            return self._generate_mock_data(symbol, limit)

    def _generate_forex_data(
        self, asset: str, interval: str, limit: int
    ) -> List[Dict]:
        """Generate realistic forex mock data."""
        import numpy as np

        base_prices = {
            "EURUSD": 1.0860, "GBPUSD": 1.2720, "USDJPY": 157.50,
            "AUDUSD": 0.6650, "USDCAD": 1.3680, "NZDUSD": 0.6120,
            "USDCHF": 0.8920, "EURGBP": 0.8540, "EURJPY": 171.00,
            "GBPJPY": 200.30,
        }
        base = base_prices.get(asset.replace("/", ""), 1.0)
        volatility = base * 0.001

        np.random.seed(int(datetime.now().timestamp()) % 10000)
        prices = [base]
        for _ in range(limit - 1):
            change = np.random.normal(0, volatility)
            prices.append(prices[-1] + change)

        candles = []
        for i, close in enumerate(prices):
            high = close + abs(np.random.normal(0, volatility * 0.5))
            low = close - abs(np.random.normal(0, volatility * 0.5))
            open_p = prices[i - 1] if i > 0 else close
            candles.append({
                "timestamp": int(datetime.now().timestamp() * 1000) - (limit - i) * 3600000,
                "open": round(open_p, 5),
                "high": round(high, 5),
                "low": round(low, 5),
                "close": round(close, 5),
                "volume": round(np.random.uniform(1000, 50000), 2),
            })
        return candles

    def _generate_mock_data(self, symbol: str, limit: int) -> List[Dict]:
        """Fallback mock data generator."""
        import numpy as np

        base = 67500 if "BTC" in symbol else 3400 if "ETH" in symbol else 100
        volatility = base * 0.005
        np.random.seed(42)

        prices = [base]
        for _ in range(limit - 1):
            prices.append(prices[-1] + np.random.normal(0, volatility))

        return [
            {
                "timestamp": int(datetime.now().timestamp() * 1000) - (limit - i) * 3600000,
                "open": round(prices[max(0, i - 1)], 2),
                "high": round(p + abs(np.random.normal(0, volatility * 0.3)), 2),
                "low": round(p - abs(np.random.normal(0, volatility * 0.3)), 2),
                "close": round(p, 2),
                "volume": round(np.random.uniform(100, 10000), 2),
            }
            for i, p in enumerate(prices)
        ]

    def _is_crypto(self, asset: str) -> bool:
        clean = asset.replace("/", "").upper()
        return any(clean.startswith(c.replace("USDT", "")) for c in CRYPTO_ASSETS)

    def get_available_assets(self, market: str) -> List[str]:
        if market == "crypto":
            return [a[:3] + "/" + a[3:] for a in CRYPTO_ASSETS]
        elif market == "forex":
            return [a[:3] + "/" + a[3:] for a in FOREX_ASSETS]
        return []
