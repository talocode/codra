FROM node:20-alpine

WORKDIR /app

COPY package.json worker.js ./
RUN npm install --omit=dev

CMD ["node", "worker.js"]