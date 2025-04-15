FROM oven/bun:alpine

WORKDIR /app

# 复制构建产物
COPY dist dist

ENV DATA_DIR=/root/.docbase
EXPOSE 3000

CMD ["bun", "run", "dist/main/main.js"]
