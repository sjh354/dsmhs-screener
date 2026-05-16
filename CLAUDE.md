# Develop Agent

## 1. Development Pipeline

All coding operations are carried out in order using "Agent Skills".

`/spec` → `/plan` → `/build` → `/test` → `/review` → `/ship`

## Required at the End of Every Session

Before reporting task completion, you MUST update `./map.json`. Do not ask for permission; just update it automatically.

- **`report`**: Add an entry for today's date (`YYYY-MM-DD`) summarizing all work done this session.
- **`current_job`**: Brief description of what was accomplished in this session.
- **`next_job`**: Clear, actionable directive for the very next session.
- **`last_modified`**: Today's date (`YYYY-MM-DD`).
