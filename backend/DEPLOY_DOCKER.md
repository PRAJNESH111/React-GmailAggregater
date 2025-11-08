# Deploy backend with Docker (DigitalOcean Droplet)

This Dockerfile builds a production image for the backend server.

## Prerequisites

- Docker installed on the Droplet
- MongoDB connection (DigitalOcean Managed DB or self-hosted). Put the connection string in `MONGO_URI`.
- Set required environment variables:
  - `PORT` (default 5000)
  - `MONGO_URI`
  - `JWT_SECRET`
  - `CORS_ORIGINS` (comma-separated list of allowed web origins, e.g. `http://localhost:5173,https://your-frontend.com`)
  - Google OAuth (if used): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and either `BACKEND_BASE_URL` or `REDIRECT_URI`

## Build

From the `backend` folder:

```bash
# Build with an image name
docker build -t mailverse-backend:latest .
```

## Run

```bash
docker run -d \
  --name mailverse-backend \
  -p 5000:5000 \
  -e PORT=5000 \
  -e MONGO_URI="your-mongodb-connection-string" \
  -e JWT_SECRET="a-strong-secret" \
  -e CORS_ORIGINS="http://localhost:5173,https://your-frontend.com" \
  -e GOOGLE_CLIENT_ID="..." \
  -e GOOGLE_CLIENT_SECRET="..." \
  -e BACKEND_BASE_URL="https://api.yourdomain.com" \
  mailverse-backend:latest
```

Notes:

- When exposing cookies cross-site (frontend != backend domain), your server is already configured to set `SameSite=None; Secure` in production. Ensure you serve over HTTPS in production.
- If you put Nginx/Traefik in front, forward traffic to the container on port 5000 and preserve `X-Forwarded-*` headers (the server already sets `app.set('trust proxy', 1)`).

## Optional: docker-compose

An example to run the app with an external MongoDB:

```yaml
version: "3.8"
services:
  app:
    image: mailverse-backend:latest
    container_name: mailverse-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      PORT: 5000
      MONGO_URI: ${MONGO_URI}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGINS: ${CORS_ORIGINS}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      BACKEND_BASE_URL: ${BACKEND_BASE_URL}
```

Create a `.env` next to `docker-compose.yml` (or pass env directly) and then:

```bash
docker compose up -d
```
