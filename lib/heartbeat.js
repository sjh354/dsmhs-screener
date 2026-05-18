// 5초마다 강사 서버에 heartbeat 전송
'use strict';

const { postJson } = require('./http');

function startHeartbeat(config, intervalMs = 5000) {
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
