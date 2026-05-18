'use strict';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

// config.js executes at require time, so we bust the require cache before each test
// and re-require with the desired env vars already set.
const CONFIG_PATH = require.resolve('../lib/config');

function freshConfig() {
  delete require.cache[CONFIG_PATH];
  return require('../lib/config');
}

describe('config.js', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
    delete require.cache[CONFIG_PATH];
  });

  test('returns enabled:false when both vars are missing', () => {
    delete process.env.DSMHS_INSTRUCTOR_URL;
    delete process.env.DSMHS_STUDENT_NAME;
    assert.equal(freshConfig().enabled, false);
  });

  test('returns enabled:false when only DSMHS_INSTRUCTOR_URL is set', () => {
    process.env.DSMHS_INSTRUCTOR_URL = 'http://localhost:4000';
    delete process.env.DSMHS_STUDENT_NAME;
    assert.equal(freshConfig().enabled, false);
  });

  test('returns enabled:false when only DSMHS_STUDENT_NAME is set', () => {
    delete process.env.DSMHS_INSTRUCTOR_URL;
    process.env.DSMHS_STUDENT_NAME = '홍길동';
    assert.equal(freshConfig().enabled, false);
  });

  test('returns enabled:true with both required vars', () => {
    process.env.DSMHS_INSTRUCTOR_URL = 'http://localhost:4000';
    process.env.DSMHS_STUDENT_NAME = '홍길동';
    delete process.env.DSMHS_PORT;
    delete process.env.PORT;
    const config = freshConfig();
    assert.equal(config.enabled, true);
    assert.equal(config.instructorUrl, 'http://localhost:4000');
    assert.equal(config.studentName, '홍길동');
    assert.equal(config.port, 3000);
  });

  test('strips trailing slash from instructorUrl', () => {
    process.env.DSMHS_INSTRUCTOR_URL = 'http://localhost:4000/';
    process.env.DSMHS_STUDENT_NAME = '홍길동';
    assert.equal(freshConfig().instructorUrl, 'http://localhost:4000');
  });

  test('uses DSMHS_PORT when provided', () => {
    process.env.DSMHS_INSTRUCTOR_URL = 'http://localhost:4000';
    process.env.DSMHS_STUDENT_NAME = '홍길동';
    process.env.DSMHS_PORT = '8080';
    delete process.env.PORT;
    assert.equal(freshConfig().port, 8080);
  });

  test('falls back to PORT env var when DSMHS_PORT is absent', () => {
    process.env.DSMHS_INSTRUCTOR_URL = 'http://localhost:4000';
    process.env.DSMHS_STUDENT_NAME = '홍길동';
    delete process.env.DSMHS_PORT;
    process.env.PORT = '5000';
    assert.equal(freshConfig().port, 5000);
  });

  test('DSMHS_PORT takes precedence over PORT', () => {
    process.env.DSMHS_INSTRUCTOR_URL = 'http://localhost:4000';
    process.env.DSMHS_STUDENT_NAME = '홍길동';
    process.env.DSMHS_PORT = '9000';
    process.env.PORT = '5000';
    assert.equal(freshConfig().port, 9000);
  });

  test('defaults to port 3000 when neither DSMHS_PORT nor PORT is set', () => {
    process.env.DSMHS_INSTRUCTOR_URL = 'http://localhost:4000';
    process.env.DSMHS_STUDENT_NAME = '홍길동';
    delete process.env.DSMHS_PORT;
    delete process.env.PORT;
    assert.equal(freshConfig().port, 3000);
  });

  test('defaults to port 3000 when DSMHS_PORT is non-numeric', () => {
    process.env.DSMHS_INSTRUCTOR_URL = 'http://localhost:4000';
    process.env.DSMHS_STUDENT_NAME = '홍길동';
    process.env.DSMHS_PORT = 'abc';
    delete process.env.PORT;
    assert.equal(freshConfig().port, 3000);
  });
});
