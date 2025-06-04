FROM oven/bun:slim

# 安装 OpenSSL
RUN apt update && apt install openssl -y && rm -rf /var/lib/apt/lists/*

# 复制构建产物
COPY dist/main /app

RUN chmod a+x /app/docbase /app/dufs /app/schema-engine-*

EXPOSE 3000

CMD ["/app/docbase"]
