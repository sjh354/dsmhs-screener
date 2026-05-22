FROM node:18-alpine
WORKDIR /app

# express 먼저 설치 (이후 dsmhs-screener 배치가 덮이지 않도록)
RUN npm init -y && npm install express

# dsmhs-screener 패키지 소스를 node_modules에 직접 배치
COPY package.json index.cjs index.mjs ./node_modules/dsmhs-screener/
COPY lib ./node_modules/dsmhs-screener/lib

COPY docker/student/server.js ./
COPY docker/student/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
