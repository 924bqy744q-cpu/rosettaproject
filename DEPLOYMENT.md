
# Deployment Guide

This project is a monorepo containing both the API (`apps/api`) and the Frontend (`apps/web`).

## Option 1: Railway (Example for deploying both services)

Railway handles monorepos well. You can deploy both the API and Web services from the same repository.

### 1. Connect GitHub Repo
- Go to [Railway Dashboard](https://railway.app/dashboard)
- Click "New Project" -> "Deploy from GitHub repo"
- Select `rosettaproject`

### 2. Configure Backend Service (`apps/api`)
Railway will likely auto-detect the repo. You need to configure it to point to the API app.

- **Settings > General > Root Directory**: `apps/api`
- **Settings > Build > Build Command**: `npm install`
- **Settings > Deploy > Start Command**: `npm run start` 
- **Variables**:
    - `ANTHROPIC_API_KEY`: [Your Key]
    - `POSTHOG_API_KEY`: [Your Key]
    - `NODE_ENV`: `production`
    - `PORT`: `3000` (Railway exposes this port)

### 3. Configure Frontend Service (`apps/web`)
add a specific service for the frontend on Railway, but set the root to `apps/web`.

- **Settings > General > Root Directory**: `apps/web`
- **Settings > Build > Build Command**: `npm run build`
- **Settings > Deploy > Start Command**: `npm run preview -- --port $PORT --host` (Vite preview command for production-like serving)

## Option 2: Vercel (Recommended for Frontend)

Vercel is optimized for Frontend deployments like Vite/React.

1.  Connect GitHub repo `rosettaproject`
2.  **Framework Preset**: Vite
3.  **Root Directory**: `apps/web`
4.  **Environment Variables**:
    - `VITE_API_URL`: [Your Railway Backend URL]

## Summary
- **Backend**: Railway (Node.js service)
- **Frontend**: Vercel (Static hosting for React/Vite) OR Railway (Containerized serving of static files)
