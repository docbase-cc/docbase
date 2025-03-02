FROM oven/bun:alpine

WORKDIR /app

# 复制前端构建产物
COPY packages/ui/.output/public ./public

# 复制后端构建产物
COPY packages/app/dist/* ./

EXPOSE 3000

# 运行主程序
CMD ["bun", "main.js"]
