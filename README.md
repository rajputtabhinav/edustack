# EduStack

EduStack is a Telegram Mini App growth product owned by Raptorvoid Private Limited. The platform sells handwritten note packs, unlocks a referral engine after the first purchase, tracks wallet earnings, supports manual UPI verification, and now includes gamification, products, bonus control, leaderboard ranking, and minimal admin operations.

## Stack

- Backend: Node.js, Express, MongoDB, Mongoose
- Frontend: React, Vite, Tailwind CSS
- Bot: `node-telegram-bot-api`

## Business Rules

- Notes price remains Rs.20
- Referral earning remains Rs.10 by default per successful paid referral
- Referral unlocks only after the user purchases
- Minimum withdrawal remains Rs.15
- Payments remain manual via UPI screenshot upload

## Upgrade Highlights

- Pre-purchase conversion dashboard with urgency and CTA
- Bonus engine with fallback to default reward
- Multi-product note packs: Academic, Coding, Exams
- Leaderboard engine with all-time snapshot generation
- Gamification: XP, badge, level
- Wallet upgrade: available, locked, and pending withdrawal states
- Fraud signals: self-referral, duplicate reward attempts, shared IP/device logging
- Private content delivery state for Telegram channel access
- Minimal admin APIs for verification, withdrawals, bonus control, and analytics

## Main User Endpoints

- `POST /user/create`
- `GET /user/:id`
- `GET /referrals/:id`
- `POST /payment/request`
- `POST /payment/verify`
- `POST /withdraw`
- `POST /withdraw/request`
- `GET /leaderboard`
- `GET /products`

## Admin Endpoints

- `POST /admin/verify-payment`
- `POST /admin/approve-withdraw`
- `POST /admin/set-bonus`
- `GET /admin/stats`

Admin requests require `x-admin-key: <ADMIN_API_KEY>`.

## Setup

1. Install dependencies from the repo root:

```bash
npm install
```

2. Start MongoDB locally for dev (optional):

- With Docker: `docker-compose up -d mongo` (mongo on 27017, mongo-express on 8081)
- Local URI you can use: `mongodb://localhost:27017/edustack`

3. Copy environment files:

- `backend/.env.example` -> `backend/.env`
- `bot/.env.example` -> `bot/.env`
- `frontend/.env.example` -> `frontend/.env`

4. Configure at minimum:

- `MONGODB_URI`
- `ADMIN_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `WEB_APP_URL`
- `VITE_API_BASE_URL`
- `UPI_ID`

For local end-to-end:

- Backend `MONGODB_URI`: `mongodb://localhost:27017/edustack`
- Frontend `VITE_API_BASE_URL`: `http://localhost:8080`

5. Optional private content delivery settings:

- `PRIVATE_CHANNEL_ID`
- `PRIVATE_CHANNEL_INVITE_LINK`

6. Run the apps:

```bash
npm run dev:backend
npm run dev:frontend
npm run dev:bot
```

## Structure

```text
backend/   API, schemas, services, admin routes, fraud logging
frontend/  Telegram Mini App with dashboard, buy, referral, wallet, withdraw, leaderboard
bot/       Telegram bot start flow and Web App launcher
```
