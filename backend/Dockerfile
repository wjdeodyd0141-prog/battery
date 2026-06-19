FROM node:22-alpine

WORKDIR /app

COPY backend/package.json /app/package.json
COPY backend/prisma /app/prisma/

RUN npm install

COPY backend/src /app/src/
COPY backend/nest-cli.json /app/nest-cli.json
COPY backend/tsconfig.json /app/tsconfig.json
COPY backend/tsconfig.build.json /app/tsconfig.build.json

RUN npx prisma generate

RUN npx nest build

RUN echo "=== dist/main.js ===" && ls /app/dist/main.js

EXPOSE 3001

CMD ["node", "/app/dist/main.js"]
