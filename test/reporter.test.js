'use strict';

const { test, describe, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

// 강사 서버 역할: GET /screener/endpoints + POST /screener/report 처리
function makeInstructorServer(endpoints = [{ label: 'GET /health', method: 'GET', path: '/health', body: null }]) {
  return new Promise((resolve) => {
    const reports = [];
    const server = http.createServer((req, res) => {
      if (req.method === 'GET' && req.url === '/screener/endpoints') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(endpoints));
        return;
      }
      if (req.method === 'POST' && req.url === '/screener/report') {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          reports.push(JSON.parse(body));
          res.writeHead(200);
          res.end('{}');
        });
        return;
      }
      res.writeHead(404);
      res.end();
    });
    server.reports = reports;
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

// 학생 앱 역할: { healthStatus } 또는 { routes: { '/path': statusCode } } 옵션 지원
function makeStudentServer({ healthStatus = 200, routes = null } = {}) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (routes) {
        const status = routes[req.url];
        res.writeHead(status ?? 404);
        res.end();
        return;
      }
      if (req.url === '/health') {
        res.writeHead(healthStatus);
        res.end();
        return;
      }
      res.writeHead(404);
      res.end();
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

describe('reporter (startReporter)', () => {
  afterEach(() => { mock.timers.reset(); });

  test('startReporter returns a timer', () => {
    const { startReporter } = require('../lib/heartbeat');
    const timer = startReporter(
      { instructorUrl: 'http://127.0.0.1:1', studentName: 'x', port: 9999 },
      60000
    );
    assert.ok(timer);
    clearInterval(timer);
  });

  test('probes localhost and POSTs results to /screener/report', async () => {
    const instructor = await makeInstructorServer();
    const student = await makeStudentServer({ healthStatus: 200 });
    const instructorPort = instructor.address().port;
    const studentPort = student.address().port;

    mock.timers.enable(['setInterval']);

    const { startReporter } = require('../lib/heartbeat');
    const timer = startReporter(
      {
        instructorUrl: `http://127.0.0.1:${instructorPort}`,
        studentName: '테스트학생',
        port: studentPort,
      },
      30000
    );

    mock.timers.tick(30000);
    mock.timers.reset();

    // HTTP 왕복 완료 대기
    await new Promise((r) => setTimeout(r, 500));

    clearInterval(timer);
    instructor.close();
    student.close();

    assert.equal(instructor.reports.length, 1);
    const report = instructor.reports[0];
    assert.equal(report.name, '테스트학생');
    assert.ok(report.results);
    assert.ok(report.results['GET /health']);
    assert.equal(report.results['GET /health'].ok, true);
  });

  test('reports ok: false when localhost endpoint returns non-2xx', async () => {
    const instructor = await makeInstructorServer();
    const student = await makeStudentServer({ healthStatus: 500 });
    const instructorPort = instructor.address().port;
    const studentPort = student.address().port;

    mock.timers.enable(['setInterval']);

    const { startReporter } = require('../lib/heartbeat');
    const timer = startReporter(
      {
        instructorUrl: `http://127.0.0.1:${instructorPort}`,
        studentName: '실패학생',
        port: studentPort,
      },
      30000
    );

    mock.timers.tick(30000);
    mock.timers.reset();
    await new Promise((r) => setTimeout(r, 500));

    clearInterval(timer);
    instructor.close();
    student.close();

    assert.equal(instructor.reports.length, 1);
    assert.equal(instructor.reports[0].results['GET /health'].ok, false);
  });

  test('does not throw when instructor server is unreachable', async () => {
    mock.timers.enable(['setInterval']);

    const { startReporter } = require('../lib/heartbeat');
    const timer = startReporter(
      { instructorUrl: 'http://127.0.0.1:1', studentName: 'x', port: 9999 },
      30000
    );

    mock.timers.tick(30000);
    mock.timers.reset();
    await new Promise((r) => setTimeout(r, 300));

    clearInterval(timer);
  });

  test('reports ok: true for 404 when okStatus includes 404', async () => {
    const endpoints = [{ label: 'DELETE /memos/999', method: 'DELETE', path: '/memos/999', body: null, okStatus: [200, 404] }];
    const instructor = await makeInstructorServer(endpoints);
    const student = await makeStudentServer({ routes: { '/memos/999': 404 } });
    const instructorPort = instructor.address().port;
    const studentPort = student.address().port;

    mock.timers.enable(['setInterval']);
    const { startReporter } = require('../lib/heartbeat');
    const timer = startReporter(
      { instructorUrl: `http://127.0.0.1:${instructorPort}`, studentName: '테스트학생', port: studentPort },
      30000
    );

    mock.timers.tick(30000);
    mock.timers.reset();
    await new Promise((r) => setTimeout(r, 500));

    clearInterval(timer);
    instructor.close();
    student.close();

    assert.equal(instructor.reports.length, 1);
    assert.equal(instructor.reports[0].results['DELETE /memos/999'].ok, true);
  });

  test('reports ok: false for 404 when okStatus is not set', async () => {
    const endpoints = [{ label: 'DELETE /memos/999', method: 'DELETE', path: '/memos/999', body: null }];
    const instructor = await makeInstructorServer(endpoints);
    const student = await makeStudentServer({ routes: { '/memos/999': 404 } });
    const instructorPort = instructor.address().port;
    const studentPort = student.address().port;

    mock.timers.enable(['setInterval']);
    const { startReporter } = require('../lib/heartbeat');
    const timer = startReporter(
      { instructorUrl: `http://127.0.0.1:${instructorPort}`, studentName: '테스트학생', port: studentPort },
      30000
    );

    mock.timers.tick(30000);
    mock.timers.reset();
    await new Promise((r) => setTimeout(r, 500));

    clearInterval(timer);
    instructor.close();
    student.close();

    assert.equal(instructor.reports.length, 1);
    assert.equal(instructor.reports[0].results['DELETE /memos/999'].ok, false);
  });
});
