// 공유 HTTP/HTTPS POST 헬퍼 (내장 모듈만 사용)
'use strict';

const http = require('http');
const https = require('https');

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = (isHttps ? https : http).request(options, (res) => {
      // 응답 본문을 소비하여 keep-alive 소켓이 재사용 가능하도록 함
      res.resume();
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve(res.statusCode);
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy(new Error('timeout'));
    });
    req.write(payload);
    req.end();
  });
}

module.exports = { postJson };
