FROM oven/bun:alpine

WORKDIR /app

# 复制构建产物
COPY dist/main /app

# TODO docker 编译时候下载 dufs
# RUN chmod 777 /app/dufs

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "alias npm=\"bun\" && bun main.js"]
