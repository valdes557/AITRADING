# AI Trading Signals

A SaaS platform that uses artificial intelligence to analyze crypto & forex markets, detect trends, and generate personalized trading signals with real-time alerts.

## Architecture

```
├── frontend/          # Next.js 14 + Tailwind CSS + Recharts
├── backend/           # Express.js + MongoDB + JWT auth + Cron jobs
├── signal-engine/     # Python FastAPI (indicators, strategies, AI)
├── telegram-bot/      # Telegram notification bot
└── .gitignore
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)

### 1. Backend
```bash
cd backend
cp .env.example .env   # Edit with your secrets (JWT_SECRET, MONGODB_URI, etc.)
npm install
npm run dev            # Runs on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev            # Runs on http://localhost:3000
```

### 3. Signal Engine (Python)
```bash
cd signal-engine
pip install -r requirements.txt
python main.py         # Runs on http://localhost:8000
```

### 4. Telegram Bot (optional)
```bash
cd telegram-bot
npm install
# Set TELEGRAM_BOT_TOKEN in backend/.env first
node bot.js
```

## Frontend Pages
| Route | Description |
|---|---|
| `/` | Landing page with features, pricing, testimonials |
| `/login` | User login form |
| `/register` | User registration form |
| `/dashboard` | Main dashboard — stats, equity curve, recent signals |
| `/dashboard/signals` | All signals list with filters (status, market) |
| `/dashboard/journal` | Trading journal with P&L tracking |
| `/dashboard/analytics` | Charts — weekly P&L, win rate trend, asset distribution, strategy table |
| `/dashboard/settings` | User preferences (markets, style, strategies, timeframes, notifications) |

## Backend API Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | - | Register new user |
| POST | `/api/auth/login` | - | Login |
| GET | `/api/auth/profile` | JWT | Get user profile |
| PUT | `/api/auth/profile` | JWT | Update profile |
| POST | `/api/auth/forgot-password` | - | Request password reset |
| POST | `/api/auth/reset-password` | - | Reset password with token |
| GET | `/api/signals/active` | JWT | Get active signals (filtered by plan) |
| GET | `/api/signals/history` | JWT | Signal history with pagination |
| GET | `/api/signals/stats` | JWT | Signal win/loss stats |
| GET | `/api/dashboard/stats` | JWT | Dashboard stats + equity curve |
| GET | `/api/dashboard/daily-analysis` | JWT | Daily market analysis |
| GET | `/api/journal` | JWT | User's journal entries |
| POST | `/api/journal` | JWT | Create journal entry |
| GET | `/api/journal/stats` | JWT | Journal P&L stats |
| GET | `/api/users/preferences` | JWT | Get preferences |
| PUT | `/api/users/preferences` | JWT | Update preferences |
| GET | `/api/subscriptions/plans` | - | List pricing plans |
| POST | `/api/subscriptions` | JWT | Create subscription |
| GET | `/api/admin/stats` | Admin | Platform stats |
| GET | `/api/admin/users` | Admin | Manage users |

## Signal Engine Strategies
- **Smart Money Concepts** — liquidity sweeps, structure breaks
- **Order Blocks** — supply/demand zone detection
- **Breakout** — range breakouts with volume confirmation
- **Trend Following** — EMA crossover with MACD/RSI confirmation

## Indicators Computed
RSI, MACD, EMA (20/50/200), ATR, Bollinger Bands, Stochastic RSI, ADX, Volume Ratio

## Subscription Plans
| Plan | Price | Signals | AI Explanation | Telegram |
|---|---|---|---|---|
| Free | $0 | 2/day | Truncated | - |
| Basic | $19/mo | Unlimited | Truncated | - |
| Pro | $49/mo | Unlimited | Full | Fast alerts |
| VIP | $99/mo | Premium | Full + daily analysis | Priority alerts |

## Tech Stack
- **Frontend**: Next.js 14, React 18, Tailwind CSS, Recharts, Zustand, Axios
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, node-cron
- **AI Engine**: Python, FastAPI, pandas, numpy, aiohttp
- **Notifications**: Telegram Bot API, Nodemailer
- **Security**: Helmet, CORS, Rate Limiting, bcrypt password hashing
