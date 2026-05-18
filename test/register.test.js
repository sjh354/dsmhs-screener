'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

function makeServer({ statusCode = 200, close = false } = {}) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (close) {
        req.socket.destroy();
        return;
      }
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        server._lastBody = JSON.parse(body);
        server._lastPath = req.url;
        res.writeHead(statusCode);
        res.end();
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

describe('register.js', () => {
  test('sends POST to /screener/register with correct body and returns true', async () => {
    const server = await makeServer({ statusCode: 200 });
    const port = server.address().port;
    const { register } = require('../lib/register');

    const result = await register({
      instructorUrl: `http://127.0.0.1:${port}`,
      studentName: '테스트학생',
      port: 3000,
    });

    assert.equal(result, true);
    assert.equal(server._lastPath, '/screener/register');
    assert.equal(server._lastBody.name, '테스트학생');
    assert.equal(server._lastBody.port, 3000);
    assert.ok(typeof server._lastBody.ip === 'string');
    assert.ok(typeof server._lastBody.timestamp === 'string');

    server.close();
  });

  test('returns false after 10 failed attempts', async () => {
    const closeServer = await makeServer({ close: true });
    const port = closeServer.address().port;
    const { register } = require('../lib/register');

    const result = await register(
      { instructorUrl: `http://127.0.0.1:${port}`, studentName: '실패학생', port: 3000 },
      { delayMs: 0 }
    );

    assert.equal(result, false);
    closeServer.close();
  });

  test('treats non-2xx HTTP responses as failure and retries', async () => {
    const server = await makeServer({ statusCode: 500 });
    const port = server.address().port;
    const { register } = require('../lib/register');

    const result = await register(
      { instructorUrl: `http://127.0.0.1:${port}`, studentName: '오류학생', port: 3000 },
      { delayMs: 0 }
    );

    assert.equal(result, false);
    server.close();
  });

  test('logs success message to console on successful registration', async () => {
    const server = await makeServer({ statusCode: 200 });
    const port = server.address().port;

    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));

    const { register } = require('../lib/register');
    try {
      await register({
        instructorUrl: `http://127.0.0.1:${port}`,
        studentName: '로그학생',
        port: 3000,
      });
    } finally {
      console.log = origLog;
    }

    server.close();
    assert.ok(logs.some((l) => l.includes('✓') && l.includes('로그학생')));
  });

  test('logs warning when all retries fail', async () => {
    const closeServer = await makeServer({ close: true });
    const port = closeServer.address().port;

    const warnings = [];
    const origWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));

    const { register } = require('../lib/register');
    try {
      await register(
        { instructorUrl: `http://127.0.0.1:${port}`, studentName: '경고학생', port: 3000 },
        { delayMs: 0 }
      );
    } finally {
      console.warn = origWarn;
    }

    closeServer.close();
    assert.ok(warnings.some((w) => w.includes('✗')));
  });
});
