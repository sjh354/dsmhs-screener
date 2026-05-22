'use strict';

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const ALIVE_MS = 10000; // report 5s × 2 여유

// 학생 데이터 메모리 저장 { name → { name, ip, port, lastSeen, probeResults } }
const students = new Map();

// 강사가 관리하는 엔드포인트 목록 (서버 재시작 시 기본값으로 초기화)
const DEFAULT_ENDPOINTS = [
  { label: 'GET /health',     method: 'GET',    path: '/health',   body: null },
  { label: 'GET /memos',      method: 'GET',    path: '/memos',    body: null },
  { label: 'GET /memos/1',    method: 'GET',    path: '/memos/1',  body: null },
  { label: 'POST /memos',     method: 'POST',   path: '/memos',    body: { title: 'test', content: 'test' } },
  { label: 'DELETE /memos/1', method: 'DELETE', path: '/memos/1',  body: null },
];
let endpoints = [...DEFAULT_ENDPOINTS];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// 학생 목록 + alive 여부 + probeResults
app.get('/screener/students', (req, res) => {
  const now = Date.now();
  const list = Array.from(students.values()).map((s) => ({
    name: s.name,
    ip: s.ip,
    port: s.port,
    alive: now - s.lastSeen <= ALIVE_MS,
    lastSeenIso: new Date(s.lastSeen).toISOString(),
    probeResults: s.probeResults,
  }));
  res.json(list);
});

// 엔드포인트 목록 반환
app.get('/screener/endpoints', (req, res) => {
  res.json(endpoints);
});

// 엔드포인트 추가 (label 중복 거부)
app.post('/screener/endpoints', (req, res) => {
  const { method, path: epPath, body = null } = req.body;
  if (!method || !epPath) return res.status(400).json({ error: 'method, path 필수' });
  const label = `${method} ${epPath}`;
  if (endpoints.some((e) => e.label === label)) {
    return res.status(409).json({ error: '이미 존재하는 엔드포인트입니다.' });
  }
  endpoints.push({ label, method, path: epPath, body });
  res.json({ ok: true, endpoints });
});

// 엔드포인트 삭제 (인덱스 기반)
app.delete('/screener/endpoints/:idx', (req, res) => {
  const idx = parseInt(req.params.idx, 10);
  if (isNaN(idx) || idx < 0 || idx >= endpoints.length) {
    return res.status(400).json({ error: '유효하지 않은 인덱스' });
  }
  endpoints.splice(idx, 1);
  res.json({ ok: true, endpoints });
});

app.listen(PORT, () => {
  console.log(`[dsmhs-instructor] 강사 서버 실행 중 → http://localhost:${PORT}`);
});
