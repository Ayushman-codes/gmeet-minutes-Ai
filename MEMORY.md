# MEMORY.md — Zoom Minutes AI

## Project Memory

### Build Log

| Phase | Status | Date | Notes |
|-------|--------|------|-------|
| 0 — Init | Done | 2026-07-13 | Vite scaffold, Tailwind, deps installed |
| 1 — Auth | Done | 2026-07-13 | useAuth hook, Login page, route guarding, react-router-dom v7 |
| 2 — Dashboard | Done | 2026-07-13 | Meeting list, create meeting form |
| 3 — Recorder | Done | 2026-07-13 | getDisplayMedia, MediaRecorder, Storage upload |
| 4 — Gemini | Done | 2026-07-13 | geminiClient.js, processing pipeline |
| 5 — Summary | Done | 2026-07-13 | SummaryEditor, ActionItemList, save to DB |
| 6 — Gmail | Done | 2026-07-13 | gmailRedirect.js, SendViaGmailButton |
| 7 — Detail | Done | 2026-07-13 | MeetingDetail read-only page |
| 8 — Polish | Done | 2026-07-13 | Error/loading states, clean build |
| 9 — Zoom SDK | Done | 2026-07-14 | Zoom Meeting SDK integration, Edge Function for signature |
| 10 — Fixes | Done | 2026-07-23 | Gemini anti-hallucination prompt, zoomClient leave error handling |

### Files Created

```
src/
  lib/
    supabaseClient.js      — Supabase client init
    geminiClient.js        — Gemini Flash call + JSON parse
    gmailRedirect.js       — Gmail compose URL builder
    zoomClient.js          — Zoom Meeting SDK wrapper
  hooks/
    useAuth.js             — Auth state + sign in/out methods
  pages/
    Login.jsx              — Email/password + Google OAuth
    Dashboard.jsx          — Meeting list + create form
    Recorder.jsx           — Zoom SDK join + audio capture + upload
    Summary.jsx            — Processing + review + edit
    MeetingDetail.jsx      — Read-only meeting view
  components/
    SummaryEditor.jsx      — Editable summary fields
    ActionItemList.jsx     — Editable action items list
    SendViaGmailButton.jsx — Gmail compose trigger
  App.jsx                  — Router + route guards
  main.jsx                 — Entry point
  index.css                — Tailwind import
supabase/
  schema.sql               — Full DB schema + RLS + trigger
  functions/
    sign-zoom/
      index.ts             — JWT signature generation for Zoom SDK
```

### Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_ZOOM_SDK_KEY=
```

Edge Function environment:
```
ZOOM_SDK_KEY=
ZOOM_MEETING_SDK_SECRET=
```

### Current Model Pin

- Model: `gemini-3.1-flash-lite`
- Pinned: 2026-07-13
- Verify at: https://ai.google.dev/gemini-api/docs/models

### Decisions Made

1. Using React 19 (not 18) — latest stable at build time
2. Tailwind CSS v4 with @tailwindcss/vite plugin — not v3 PostCSS setup
3. No TypeScript — JSX only per AGENT_CONTEXT.md
4. Supabase Storage bucket `meeting-audio` must be created manually
5. Client-side Gemini API key — documented as known security trade-off
6. Zoom SDK Secret stored server-side only (Edge Function) — never exposed to client
7. Zoom SDK join as participant (role=0) — user provides Meeting ID + Password
8. react-router-dom v7 — latest major version
9. Gemini anti-hallucination rules — return empty result for silent/noise-only audio
