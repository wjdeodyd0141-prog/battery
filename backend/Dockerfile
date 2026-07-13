FROM node:22-alpine

WORKDIR /app

COPY package.json /app/package.json
COPY prisma /app/prisma/

RUN npm install

COPY src /app/src/
COPY nest-cli.json /app/nest-cli.json
COPY tsconfig.json /app/tsconfig.json
COPY tsconfig.build.json /app/tsconfig.build.json
COPY prisma.config.ts /app/prisma.config.ts

RUN npx prisma generate

RUN npx nest build

RUN echo "=== dist/main.js ===" && ls /app/dist/main.js

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && node /app/dist/main.js"]
