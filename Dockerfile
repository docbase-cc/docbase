FROM oven/bun:alpine

WORKDIR /app

# 复制构建产物
COPY dist/main /app

EXPOSE 3000

CMD ["bun", "main.js"]
