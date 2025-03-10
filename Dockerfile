FROM oven/bun

WORKDIR /app

# 复制构建产物
COPY dist/main /app

# 复制 dufs
COPY dist/dufs /bin/dufs
RUN chmod 777 /bin/dufs

ENV NODE_ENV=production

EXPOSE 3000

CMD ["bun", "main.js"]
