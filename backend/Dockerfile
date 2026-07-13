FROM node:22-alpine

WORKDIR /app

# 빌드 단계에서 prisma generate에 필요한 임시 DB 주소 (실제 연결 안 함)
ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
ENV DATABASE_URL=$DATABASE_URL

COPY package.json /app/package.json
COPY prisma /app/prisma/

RUN npm install

COPY src /app/src/
COPY nest-cli.json /app/nest-cli.json
COPY tsconfig.json /app/tsconfig.json
COPY tsconfig.build.json /app/tsconfig.build.json

RUN npx prisma generate

RUN npx nest build

RUN echo "=== dist/main.js ===" && ls /app/dist/main.js

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && node /app/dist/main.js"]
