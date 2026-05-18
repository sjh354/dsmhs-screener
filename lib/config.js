// 학생 package.json의 "dsmhs" 키에서 설정 로드
'use strict';

const fs = require('fs');
const path = require('path');

function loadConfig() {
  const pkgPath = path.join(process.cwd(), 'package.json');

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch {
    console.warn('[dsmhs-screener] ⚠ package.json을 찾을 수 없습니다. 패키지 기능이 비활성화됩니다.');
    return { enabled: false };
  }

  if (!pkg.dsmhs) {
    console.warn('[dsmhs-screener] ⚠ package.json에 "dsmhs" 키가 없습니다. 패키지 기능이 비활성화됩니다.');
    return { enabled: false };
  }

  const { studentName, instructorUrl } = pkg.dsmhs;
  const missing = [];
  if (!studentName) missing.push('studentName');
  if (!instructorUrl) missing.push('instructorUrl');

  if (missing.length > 0) {
    console.warn(
      `[dsmhs-screener] ⚠ dsmhs 설정 누락: ${missing.join(', ')}. 패키지 기능이 비활성화됩니다.`
    );
    return { enabled: false };
  }

  const port = parseInt(process.env.PORT || '3000', 10) || 3000;

  return {
    enabled: true,
    instructorUrl: instructorUrl.replace(/\/$/, ''),
    studentName,
    port,
  };
}

module.exports = loadConfig();
