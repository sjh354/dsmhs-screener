// 환경변수 로드 및 검증
require('dotenv').config();

function loadConfig() {
  const instructorUrl = process.env.DSMHS_INSTRUCTOR_URL;
  const studentName = process.env.DSMHS_STUDENT_NAME;

  if (!instructorUrl || !studentName) {
    const missing = [];
    if (!instructorUrl) missing.push('DSMHS_INSTRUCTOR_URL');
    if (!studentName) missing.push('DSMHS_STUDENT_NAME');
    console.warn(
      `[dsmhs-screener] ⚠ 환경변수 누락: ${missing.join(', ')}. 패키지 기능이 비활성화됩니다.`
    );
    return { enabled: false };
  }

  const port = parseInt(process.env.DSMHS_PORT || process.env.PORT || '3000', 10);

  return {
    enabled: true,
    instructorUrl: instructorUrl.replace(/\/$/, ''), // trailing slash 제거
    studentName,
    port,
  };
}

module.exports = loadConfig();
