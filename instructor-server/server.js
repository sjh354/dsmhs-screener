'use strict';

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const ALIVE_MS = 10000; // heartbeat 5s × 2 여유

// 학생 데이터 메모리 저장 { name → { name, ip, port, lastSeen } }
const students = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 학생 등록
app.post('/screener/register', (req, res) => {
  const { name, ip, port } = req.body;
  if (!name || !ip) return res.status(400).json({ error: 'name, ip 필수' });
  students.set(name, { name, ip, port, lastSeen: Date.now() });
  res.json({ ok: true });
});

// heartbeat 수신
app.post('/screener/heartbeat', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name 필수' });
  const student = students.get(name);
  if (student) {
    student.lastSeen = Date.now();
  } else {
    // 서버 재시작 후 heartbeat만 들어오는 경우 재등록
    students.set(name, { name, ip: req.ip, port: null, lastSeen: Date.now() });
  }
  res.json({ ok: true });
});

// 학생 목록 + alive 여부
app.get('/screener/students', (req, res) => {
  const now = Date.now();
  const list = Array.from(students.values()).map((s) => ({
    ...s,
    alive: now - s.lastSeen <= ALIVE_MS,
    lastSeenIso: new Date(s.lastSeen).toISOString(),
  }));
  res.json(list);
});

app.listen(PORT, () => {
  console.log(`[dsmhs-instructor] 강사 서버 실행 중 → http://localhost:${PORT}`);
});
