FROM node:18-alpine
WORKDIR /app

# dsmhs-screener 패키지 소스를 node_modules에 직접 배치
COPY package.json index.cjs index.mjs ./node_modules/dsmhs-screener/
COPY lib ./node_modules/dsmhs-screener/lib

COPY docker/student/app.js ./
COPY docker/student/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
