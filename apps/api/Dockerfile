FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm i

COPY . .
RUN npx prisma generate

COPY . .
RUN npm run build

RUN echo "🏗️  Resultado del build:" && (ls -la dist/ || echo "❌ dist/ no existe!")

FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production

EXPOSE 3008

CMD ["node", "dist/src/main.js"]