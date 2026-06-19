FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm install

COPY backend/ .

RUN npx prisma generate
RUN npm run build && echo "=== dist contents ===" && ls -la dist/

EXPOSE 3001

CMD ["sh", "-c", "echo '=== CHECKING /app/dist ===' && ls /app/dist 2>/dev/null && node /app/dist/main.js || (echo 'dist not found, checking /app:' && ls /app && exit 1)"]
