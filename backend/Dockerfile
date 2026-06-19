FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm install

COPY backend/ .

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/main"]
