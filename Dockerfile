FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig*.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY src/shared/rules/rulesets ./dist/server/shared/rules/rulesets
EXPOSE 8080
USER node
CMD ["node", "dist/server/server/index.js"]
