# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Electron 桌面番茄钟应用，代码在 `pomodoro/` 目录。

## Development commands

```bash
cd pomodoro && npm start
```

## Architecture

Standard Electron app with context isolation (no framework, no external runtime deps):

- **main.js** — Main process: 400×550 non-resizable BrowserWindow, two IPC channels (`set-title`, `show-notification`) for window title and native OS notifications.
- **preload.js** — Bridges IPC methods to `window.electronAPI` via `contextBridge`.
- **index.html + style.css** — Pure HTML/CSS UI. SVG circle with `stroke-dasharray`/`stroke-dashoffset` for circular progress ring. Dark navy gradient background, glassmorphism container, CSS-driven accent colors per mode via body classes.
- **renderer.js** — All timer logic. Web Audio API oscillator beeps for sound (no audio files).

## Timer state machine

```
IDLE → RUNNING → PAUSED → (resume) → RUNNING
  ↑                  ↓
  └── reset ── timer reaches 0 (auto-switch mode + auto-start next phase)
```

Three modes (`MODES` in renderer.js):

| Mode | Duration | Next |
|------|----------|------|
| WORK | 25 min | SHORT_BREAK (or LONG_BREAK every 4th) |
| SHORT_BREAK | 5 min | WORK |
| LONG_BREAK | 15 min | WORK |

`completedSessions` tracks finished work sessions. Every 4th work session triggers LONG_BREAK instead of SHORT_BREAK. Session dots are grouped by round (4 per round), resetting after each long break.

Sound: three 150ms sine-wave beeps at 800Hz, 300ms apart (Web Audio API).

## Git remotes

```
origin  https://github.com/sheldon-one/pomodoro-timer.git (GitHub)
```
