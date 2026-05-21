FROM node:22-alpine
WORKDIR /app
COPY workers/package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate --schema=./prisma/schema.prisma
COPY workers/tsconfig.json .
COPY workers/src ./src
RUN npm run build
CMD ["node", "dist/index.js"]
