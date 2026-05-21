// 강사 서버에 학생 서버 등록 (재시도 포함)
'use strict';

const os = require('os');
const { postJson } = require('./http');

function getLocalIp() {
  const iface = Object.values(os.networkInterfaces())
    .flat()
    .find((i) => i.family === 'IPv4' && !i.internal);
  return iface ? iface.address : '127.0.0.1';
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 강사 서버 등록 (최대 10회 재시도)
async function register(config, { delayMs = 1000 } = {}) {
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
        await delay(delayMs);
      }
    }
  }

  console.warn('[dsmhs-screener] ✗ 강사 서버에 연결할 수 없습니다. 수동으로 확인하세요.');
  return false;
}

module.exports = { register };
