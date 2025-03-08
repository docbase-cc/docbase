FROM oven/bun:alpine

WORKDIR /app

# 复制构建产物
COPY dist/main /app

ENV NODE_ENV=production

EXPOSE 3000

CMD ["bun", "main.js"]
