#!/bin/sh
set -e

cat > /app/package.json <<EOF
{
  "name": "${STUDENT_NAME}-app",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "dsmhs": {
    "studentName": "${STUDENT_NAME}",
    "instructorUrl": "${INSTRUCTOR_URL}"
  }
}
EOF

exec node /app/server.js
