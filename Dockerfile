FROM oven/bun:alpine

WORKDIR /app

# 复制构建产物
COPY dist dist
COPY package.json package.json
COPY node_modules node_modules

EXPOSE 3000

CMD ["bun", "run", "dist/main/main.js"]
