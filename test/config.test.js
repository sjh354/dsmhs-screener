'use strict';

const { test, describe, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const CONFIG_PATH = require.resolve('../lib/config');
const originalReadFileSync = fs.readFileSync.bind(fs);

// 테스트용 package.json 내용을 주입해 config를 fresh load
function freshConfig(pkgContent) {
  delete require.cache[CONFIG_PATH];
  mock.method(fs, 'readFileSync', (filePath, encoding) => {
    if (typeof filePath === 'string' && filePath.endsWith('package.json') && encoding === 'utf8') {
      if (pkgContent === null) throw new Error('파일 없음');
      return JSON.stringify(pkgContent);
    }
    return originalReadFileSync(filePath, encoding);
  });
  const config = require('../lib/config');
  mock.restoreAll();
  return config;
}

describe('config.js', () => {
  let originalPort;

  beforeEach(() => {
    originalPort = process.env.PORT;
    delete process.env.PORT;
  });

  afterEach(() => {
    if (originalPort !== undefined) {
      process.env.PORT = originalPort;
    } else {
      delete process.env.PORT;
    }
    delete require.cache[CONFIG_PATH];
  });

  test('package.json이 없으면 enabled:false 반환', () => {
    const config = freshConfig(null);
    assert.equal(config.enabled, false);
  });

  test('"dsmhs" 키가 없으면 enabled:false 반환', () => {
    const config = freshConfig({ name: 'student-app' });
    assert.equal(config.enabled, false);
  });

  test('studentName 누락 시 enabled:false 반환', () => {
    const config = freshConfig({ dsmhs: { instructorUrl: 'http://localhost:4000' } });
    assert.equal(config.enabled, false);
  });

  test('instructorUrl 누락 시 enabled:false 반환', () => {
    const config = freshConfig({ dsmhs: { studentName: '홍길동' } });
    assert.equal(config.enabled, false);
  });

  test('정상 설정 시 enabled:true와 올바른 값 반환', () => {
    const config = freshConfig({
      dsmhs: { studentName: '홍길동', instructorUrl: 'http://localhost:4000' },
    });
    assert.equal(config.enabled, true);
    assert.equal(config.studentName, '홍길동');
    assert.equal(config.instructorUrl, 'http://localhost:4000');
    assert.equal(config.port, 3000);
  });

  test('trailing slash 제거', () => {
    const config = freshConfig({
      dsmhs: { studentName: '홍길동', instructorUrl: 'http://localhost:4000/' },
    });
    assert.equal(config.instructorUrl, 'http://localhost:4000');
  });

  test('PORT 환경변수로 포트 설정', () => {
    process.env.PORT = '5000';
    const config = freshConfig({
      dsmhs: { studentName: '홍길동', instructorUrl: 'http://localhost:4000' },
    });
    assert.equal(config.port, 5000);
  });

  test('PORT 미설정 시 기본값 3000', () => {
    delete process.env.PORT;
    const config = freshConfig({
      dsmhs: { studentName: '홍길동', instructorUrl: 'http://localhost:4000' },
    });
    assert.equal(config.port, 3000);
  });
});
