import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

from app.signal_generator import SignalGenerator
from app.market_data import MarketDataService

load_dotenv()

app = FastAPI(title="AI Trading Signal Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

signal_generator = SignalGenerator()
market_data = MarketDataService()


class SignalRequest(BaseModel):
    markets: List[str] = ["crypto"]
    trading_style: List[str] = ["intraday"]
    strategies: List[str] = ["smart_money"]
    timeframes: List[str] = ["H1"]
    assets: Optional[List[str]] = None


class AnalysisRequest(BaseModel):
    asset: str
    timeframe: str = "H1"


@app.get("/health")
async def health():
    return {"status": "ok", "engine": "signal-generator"}


@app.post("/generate-signals")
async def generate_signals(request: SignalRequest):
    """Generate trading signals based on user preferences."""
    try:
        signals = await signal_generator.generate(
            markets=request.markets,
            trading_style=request.trading_style,
            strategies=request.strategies,
            timeframes=request.timeframes,
            assets=request.assets,
        )
        return {"signals": signals, "count": len(signals)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze")
async def analyze_asset(request: AnalysisRequest):
    """Analyze a specific asset and return indicators + AI explanation."""
    try:
        analysis = await signal_generator.analyze_asset(
            asset=request.asset,
            timeframe=request.timeframe,
        )
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/daily-analysis")
async def daily_analysis():
    """Generate daily market analysis summary."""
    try:
        analysis = await signal_generator.generate_daily_analysis()
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/market-data/{asset}")
async def get_market_data(asset: str, timeframe: str = "H1", limit: int = 100):
    """Get OHLCV market data for an asset."""
    try:
        data = await market_data.get_ohlcv(asset, timeframe, limit)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
