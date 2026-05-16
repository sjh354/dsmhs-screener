// 강사 서버에 학생 서버 등록 (재시도 포함)
const http = require('http');
const https = require('https');
const os = require('os');

// 로컬 네트워크 IP 자동 감지
function getLocalIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// HTTP/HTTPS POST 요청 (내장 모듈만 사용)
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
      resolve(res.statusCode);
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy(new Error('timeout'));
    });
    req.write(payload);
    req.end();
  });
}

// 1초 지연 헬퍼
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 강사 서버 등록 (최대 10회 재시도)
async function register(config) {
  const { instructorUrl, studentName, port } = config;
  const ip = getLocalIp();
  const body = { name: studentName, ip, port, timestamp: new Date().toISOString() };
  const url = `${instructorUrl}/screener/register`;

  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await postJson(url, body);
      console.log(`[dsmhs-screener] ✓ 강사 서버에 등록되었습니다. (${studentName})`);
      return true;
    } catch {
      if (attempt < 10) {
        await delay(1000);
      }
    }
  }

  console.warn('[dsmhs-screener] ✗ 강사 서버에 연결할 수 없습니다. 수동으로 확인하세요.');
  return false;
}

module.exports = { register };
