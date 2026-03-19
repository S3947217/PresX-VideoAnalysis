FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_STRIPE_KEY=""
ARG NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=""
ARG NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID=""
ARG NEXT_PUBLIC_APP_URL=""
ARG COGNITO_USER_POOL_ID=""
ARG COGNITO_CLIENT_ID=""
ARG API_GATEWAY_URL=""
ENV NEXT_PUBLIC_STRIPE_KEY=$NEXT_PUBLIC_STRIPE_KEY
ENV NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=$NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
ENV NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID=$NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
ENV COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
ENV API_GATEWAY_URL=$API_GATEWAY_URL

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
