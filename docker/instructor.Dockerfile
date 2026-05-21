FROM node:18-alpine
WORKDIR /app

COPY instructor-server/package.json ./
RUN npm install --production

COPY instructor-server/server.js ./
COPY instructor-server/public ./public

EXPOSE 4000
CMD ["node", "server.js"]
