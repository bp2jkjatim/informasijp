FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app
ARG NEXT_PUBLIC_BASE_PATH=/sisdm
ARG GIT_COMMIT=unknown
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ARG NEXT_PUBLIC_BASE_PATH=/sisdm
ARG GIT_COMMIT=unknown

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3500
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}
ENV APP_GIT_COMMIT=${GIT_COMMIT}

LABEL org.opencontainers.image.revision=${GIT_COMMIT}

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

RUN mkdir -p uploads/certificates uploads/supporting-documents \
  && chown -R nextjs:nextjs /app

USER nextjs

EXPOSE 3500

CMD ["npm", "run", "start"]
