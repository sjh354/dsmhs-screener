// 5초마다 자기 서버 엔드포인트를 자가진단하고 강사 서버에 보고
'use strict';

const { postJson, getJson, probeRequest } = require('./http');

function startReporter(config, intervalMs = 5000) {
  const { instructorUrl, studentName, port } = config;

  const timer = setInterval(async () => {
    try {
      const endpoints = await getJson(`${instructorUrl}/screener/endpoints`);
      const results = {};
      await Promise.allSettled(
        endpoints.map(async (ep) => {
          const url = `http://localhost:${port}${ep.path}`;
          results[ep.label] = await probeRequest(url, ep.method, ep.body || null);
        })
      );
      await postJson(`${instructorUrl}/screener/report`, { name: studentName, results });
    } catch {
      // 조용히 실패 — 학생 서버에 영향 없음
    }
  }, intervalMs);

  process.on('exit', () => clearInterval(timer));

  return timer;
}

module.exports = { startReporter };
