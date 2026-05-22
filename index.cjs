// dsmhs-screener: require 한 줄로 강사 서버 자동 등록 + 자가진단 시작
'use strict';

const config = require('./lib/config');

if (!config.enabled) {
  // 환경변수 누락 — config.js에서 이미 경고 출력함
  return;
}

const { register } = require('./lib/register');
const { startReporter } = require('./lib/heartbeat');

// 비동기 IIFE: require 자체를 블로킹하지 않음
(async () => {
  try {
    await register(config);
    startReporter(config);
  } catch {
    // 이미 각 모듈에서 처리됨
  }
})();
