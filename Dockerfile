FROM oven/bun:alpine

WORKDIR /app

COPY ./dist/main /app

EXPOSE 3000

CMD ["bun", "main.js"]
