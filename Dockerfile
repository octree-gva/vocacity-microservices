FROM node:16 as build

WORKDIR /tmp/app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy source
COPY . .

# Build
RUN npm run build

# -------------------
FROM node:16-alpine
ENV ROOT="/app" \
  HOME="/app"
WORKDIR /app

# Copy source
COPY . .

# Copy built files
COPY --from=build /tmp/app/dist .

# Build and cleanup
ENV NODE_ENV=production \
  LOGGER=true \
  LOGLEVEL=info \
  APP_NAME=voca \
  # Frontend url
  APP_HOST=http://localhost:3000 \
  # SMTP to send emails
  SMTP_ADDRESS=mail.provider.net \
  SMTP_USERNAME=hello@host.app \
  SMTP_PASSWORD=pleaseChangeMe \
  SMTP_FROM=hello@host.app \
  SMTP_PORT=465 \
  SMTP_SECURE=true \
  # BullMQ
  BULL_REDIS_URL=redis://localhost:6379/2 \
  # Jelastic
  JELASTIC_ENDPOINT="https://app.jpc.provider.com" \
  JELASTIC_TOKEN="pleaseChangeMe" \
  JELASTIC_ROOT_ENVGROUP="vocacity" \
  # Vault
  VAULT_ADDR="http://0.0.0.0:8200" \
  VAULT_PATH="secret/voca" \
  VAULT_USER="voca" \
  VAULT_PASSWORD="pleaseChangeMe" 
  
RUN npm ci --omit=dev

# Start server
CMD ["node", "./node_modules/moleculer/bin/moleculer-runner.js"]
