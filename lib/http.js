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

// 강사 서버에서 JSON 목록을 받아오는 GET 헬퍼
function getJson(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
    };

    const req = (isHttps ? https : http).request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error('invalid JSON')); }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(new Error('timeout')); });
    req.end();
  });
}

// localhost 엔드포인트 프로브 — 결과만 반환 (본문 무시)
function probeRequest(url, method, body, okStatus) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname + parsed.search,
      method: method || 'GET',
      headers: payload
        ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        : {},
    };

    const req = http.request(options, (res) => {
      res.resume();
      const is2xx = res.statusCode >= 200 && res.statusCode < 300;
      const isCustomOk = Array.isArray(okStatus) && okStatus.includes(res.statusCode);
      resolve({ ok: is2xx || isCustomOk, status: res.statusCode });
    });

    req.on('error', (err) => resolve({ ok: false, status: 0, error: err.message }));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ ok: false, status: 0, error: 'timeout' });
    });

    if (payload) req.write(payload);
    req.end();
  });
}

module.exports = { postJson, getJson, probeRequest };
