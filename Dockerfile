# syntax=docker/dockerfile:1.7

# ------------
# Base builder
# ------------
FROM node:22-alpine AS base
ENV NODE_ENV=production
WORKDIR /app

# Install OS deps (for potential native builds)
RUN apk add --no-cache python3 make g++

# ----------------
# Dependencies stage
# ----------------
FROM base AS deps
ENV NODE_ENV=development

# Copy manifests for better layer caching
COPY package.json package-lock.json* ./

# If using pnpm/yarn, copy their lockfiles instead
# COPY pnpm-lock.yaml ./
# COPY yarn.lock ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

# -------------
# Build stage
# -------------
FROM base AS build
ENV NODE_ENV=production

# Bring installed deps
COPY --from=deps /app/node_modules /app/node_modules
# Copy project files
COPY . .

# Build the Astro project
RUN npm run build

# -------------
# Runtime stage
# -------------
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy built site
COPY --from=build /app/dist /app/dist
COPY package.json ./

# Install a small static file server
RUN --mount=type=cache,target=/root/.npm \
    npm i -g serve@14

# Use non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3001
CMD ["serve", "-s", "dist", "-l", "3001"]
