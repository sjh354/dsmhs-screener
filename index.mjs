// ESM 진입점 — lib/ 파일은 createRequire로 CJS 호출
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const config = require('./lib/config');

if (config.enabled) {
  const { register } = require('./lib/register');
  const { startHeartbeat } = require('./lib/heartbeat');

  (async () => {
    try {
      await register(config);
      startHeartbeat(config);
    } catch {
      // 이미 각 모듈에서 처리됨
    }
  })();
}
