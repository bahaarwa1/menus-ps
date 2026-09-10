# Menus.ps — Production Deployment & DevOps Guide

## 1. Cloud Architecture & Infrastructure
- **Hosting Platform**: Vercel (Edge Network + Serverless Functions) or Dockerized Node.js on Railway / AWS ECS.
- **Database & Realtime**: Managed PostgreSQL on Supabase (EU Central / Frankfurt for lowest latency to Palestine).
- **Storage**: Supabase Storage / Cloudflare R2 for food photos.
- **DNS & CDN**: Cloudflare (SSL, DDoS protection, edge caching).

---

## 2. Environment Variables Specification

```env
# App Configuration
NEXT_PUBLIC_APP_URL="https://menus.ps"
NEXT_PUBLIC_DEFAULT_CURRENCY="₪"

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."

# Security & Sessions
JWT_SECRET="super-secret-random-32-chars-key"
STAFF_PIN_PEPPER="local-palestine-restaurant-salt"

# Realtime & Sockets
NEXT_PUBLIC_REALTIME_WS_URL="wss://xxxxxxxx.supabase.co/realtime/v1/websocket"
```

---

## 3. Production Readiness & Pre-Flight Script
Before tagging a release:
```bash
# 1. Check linting
npm run lint

# 2. Build production artifacts
npm run build

# 3. Test production start locally
npm run start
```
