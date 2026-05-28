FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npx tsc

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV SESSION_DIR=/data/session
ENV ALLOW_INTERACTIVE_TOKEN_REFRESH=false
ENV TZ=Asia/Taipei

COPY package.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

VOLUME ["/data/session"]

CMD ["node", "dist/main.js"]