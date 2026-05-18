'use strict';

const { test, describe, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

function makeServer() {
  return new Promise((resolve) => {
    const requests = [];
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        requests.push({ path: req.url, body: JSON.parse(body) });
        res.writeHead(200);
        res.end();
      });
    });
    server.requests = requests;
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

describe('heartbeat.js', () => {
  afterEach(() => {
    mock.timers.reset();
  });

  test('startHeartbeat returns a timer object', () => {
    const { startHeartbeat } = require('../lib/heartbeat');
    const timer = startHeartbeat(
      { instructorUrl: 'http://127.0.0.1:1', studentName: 'x' },
      60000
    );
    assert.ok(timer);
    clearInterval(timer);
  });

  test('sends POST to /screener/heartbeat with correct body after interval fires', async () => {
    const server = await makeServer();
    const port = server.address().port;

    mock.timers.enable(['setInterval']);

    const { startHeartbeat } = require('../lib/heartbeat');
    const timer = startHeartbeat(
      { instructorUrl: `http://127.0.0.1:${port}`, studentName: '심박학생' },
      30000
    );

    mock.timers.tick(30000);
    mock.timers.reset();

    // Wait for the async HTTP request to complete
    await new Promise((r) => setTimeout(r, 200));

    clearInterval(timer);
    server.close();

    assert.equal(server.requests.length, 1);
    assert.equal(server.requests[0].path, '/screener/heartbeat');
    assert.equal(server.requests[0].body.name, '심박학생');
    assert.ok(typeof server.requests[0].body.timestamp === 'string');
  });

  test('does not throw when instructor server is unreachable', async () => {
    mock.timers.enable(['setInterval']);

    const { startHeartbeat } = require('../lib/heartbeat');
    const timer = startHeartbeat(
      { instructorUrl: 'http://127.0.0.1:1', studentName: 'x' },
      30000
    );

    mock.timers.tick(30000);
    mock.timers.reset();

    await new Promise((r) => setTimeout(r, 200));

    clearInterval(timer);
  });
});
