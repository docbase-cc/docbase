FROM oven/bun

WORKDIR /app

# 复制构建产物
COPY dist/main /app

EXPOSE 3000

# 运行主程序
CMD ["bun", "main.js"]
