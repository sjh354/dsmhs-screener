'use strict';

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const ALIVE_MS = 10000; // report 5s × 2 여유

// 학생 데이터 메모리 저장 { name → { name, ip, port, lastSeen, probeResults } }
const students = new Map();

let roster = [];
let endpoints = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 수업 설정 일괄 업로드 (학생 명단 + 엔드포인트)
app.post('/screener/config', (req, res) => {
  const { students: names, endpoints: eps } = req.body;
  if (!Array.isArray(names) || names.some((n) => typeof n !== 'string')) {
    return res.status(400).json({ error: 'students는 문자열 배열이어야 합니다.' });
  }
  if (!Array.isArray(eps) || eps.some((e) => !e.method || !e.path)) {
    return res.status(400).json({ error: 'endpoints는 {method, path} 배열이어야 합니다.' });
  }
  roster = names.map((n) => n.trim()).filter(Boolean);
  endpoints = eps.map((e) => ({
    label: `${e.method} ${e.path}`,
    method: e.method,
    path: e.path,
    body: e.body ?? null,
  }));
  res.json({ ok: true, studentCount: roster.length, endpointCount: endpoints.length });
});

// 학생 등록
app.post('/screener/register', (req, res) => {
  const { name, ip, port } = req.body;
  if (!name || !ip) return res.status(400).json({ error: 'name, ip 필수' });
  students.set(name, { name, ip, port, lastSeen: Date.now(), probeResults: {} });
  res.json({ ok: true });
});

// 학생 자가진단 결과 수신 (lastSeen 갱신 포함)
app.post('/screener/report', (req, res) => {
  const { name, results } = req.body;
  if (!name) return res.status(400).json({ error: 'name 필수' });
  const student = students.get(name);
  if (student) {
    student.lastSeen = Date.now();
    if (results && typeof results === 'object') student.probeResults = results;
  } else {
    students.set(name, { name, ip: req.ip, port: null, lastSeen: Date.now(), probeResults: results || {} });
  }
  res.json({ ok: true });
});

// 학생 목록 + alive 여부 + probeResults (명단 미접속 학생 포함)
app.get('/screener/students', (req, res) => {
  const now = Date.now();
  const registered = new Map(
    Array.from(students.values()).map((s) => [s.name, {
      name: s.name,
      ip: s.ip,
      port: s.port,
      alive: now - s.lastSeen <= ALIVE_MS,
      registered: true,
      lastSeenIso: new Date(s.lastSeen).toISOString(),
      probeResults: s.probeResults,
    }])
  );

  for (const name of roster) {
    if (!registered.has(name)) {
      registered.set(name, {
        name,
        ip: null,
        port: null,
        alive: false,
        registered: false,
        lastSeenIso: null,
        probeResults: {},
      });
    }
  }

  res.json(Array.from(registered.values()));
});

// 엔드포인트 목록 반환 (학생 npm 패키지가 사용)
app.get('/screener/endpoints', (req, res) => {
  res.json(endpoints);
});

app.listen(PORT, () => {
  console.log(`[dsmhs-instructor] 강사 서버 실행 중 → http://localhost:${PORT}`);
});
