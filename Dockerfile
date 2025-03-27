FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build || npm run build:win
RUN chmod +x ./dist/*.js

CMD ["node", "dist/index.js"] 