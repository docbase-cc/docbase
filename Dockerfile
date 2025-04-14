FROM oven/bun:alpine

WORKDIR /app

# 复制构建产物
COPY dist dist

EXPOSE 3000

CMD ["bun", "run", "dist/main/main.js"]
