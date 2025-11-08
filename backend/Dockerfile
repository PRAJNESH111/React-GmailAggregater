# Backend Dockerfile for MailVerse
# Multi-stage build to keep image small

FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies (respect package-lock.json when present)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then \
    npm ci --omit=dev; \
    else \
    npm install --omit=dev; \
    fi


# Copy application source
COPY . .

# Expose app port (defaults to 5000 in code if PORT is not set)
EXPOSE 5000
ENV PORT=5000

# Start the server
CMD ["node", "server.js"]
