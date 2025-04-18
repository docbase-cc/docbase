FROM ubuntu:latest

# 安装 OpenSSL
RUN apt update && apt install openssl -y && rm -rf /var/lib/apt/lists/*

# 复制构建产物
COPY dist/main /app

EXPOSE 3000

CMD ["/app/docbase"]
