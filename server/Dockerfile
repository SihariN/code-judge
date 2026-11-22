FROM node:22-slim

# Prisma needs OpenSSL, which the slim image doesn't include
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Docker command-line client: only the worker uses it, to start sandbox containers
COPY --from=docker:28-cli /usr/local/bin/docker /usr/local/bin/docker

WORKDIR /app/server

# Install dependencies first, so this layer is cached until package files change
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

COPY server/prisma ./prisma
RUN npx prisma generate

COPY server/src ./src
COPY server/scripts ./scripts

# The judge runner lives outside server/ and is required by the worker
COPY judge /app/judge

ENV NODE_ENV=production

# Run as an unprivileged user by default (the worker overrides this in compose)
USER node

CMD ["node", "src/server.js"]