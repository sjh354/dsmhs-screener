// 30초마다 강사 서버에 heartbeat 전송
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

function startHeartbeat(config, intervalMs = 30000) {
  const { instructorUrl, studentName } = config;
  const url = `${instructorUrl}/screener/heartbeat`;

  const timer = setInterval(async () => {
    try {
      await postJson(url, { name: studentName, timestamp: new Date().toISOString() });
    } catch {
      // 조용히 실패 — 학생 서버에 영향 없음
    }
  }, intervalMs);

  // 프로세스 종료 시 인터벌 정리
  process.on('exit', () => clearInterval(timer));

  return timer;
}

module.exports = { startHeartbeat };
