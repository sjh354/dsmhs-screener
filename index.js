// dsmhs-screener: require 한 줄로 강사 서버 자동 등록 + heartbeat 시작
'use strict';

// 최후 방어선: 패키지 오류가 학생 서버를 크래시시키지 않도록
process.on('uncaughtException', (err) => {
  if (err && err.stack && err.stack.includes('dsmhs-screener')) {
    console.warn('[dsmhs-screener] 예기치 않은 오류 발생 (학생 서버에는 영향 없음):', err.message);
  } else {
    // 패키지 외부 오류는 그대로 전달
    throw err;
  }
});

const config = require('./lib/config');

if (!config.enabled) {
  // 환경변수 누락 — config.js에서 이미 경고 출력함
  return;
}

const { register } = require('./lib/register');
const { startHeartbeat } = require('./lib/heartbeat');

// 비동기 IIFE: require 자체를 블로킹하지 않음
(async () => {
  try {
    await register(config);
    startHeartbeat(config);
  } catch {
    // 이미 각 모듈에서 처리됨
  }
})();
