# ARCHITECTURE.md — Zoom Minutes AI

## System Architecture

### Overview

```
┌─────────────────────────────────────────────────┐
│                  React SPA (Vite)               │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Pages    │  │Components│  │   Hooks      │  │
│  │ Login     │  │ Summary   │  │ useAuth      │  │
│  │ Dashboard │  │ ActionItem│  │              │  │
│  │ Recorder  │  │ SendGmail │  │              │  │
│  │ Summary   │  │ MeetingCrd│  │              │  │
│  │ Detail    │  │           │  │              │  │
│  └─────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
│        │              │               │          │
│  ┌─────┴──────────────┴───────────────┴───────┐  │
│  │              Lib Layer                      │  │
│  │  supabaseClient.js  geminiClient.js        │  │
│  │  gmailRedirect.js   zoomClient.js          │  │
│  └──────┬──────────────┬──────────────────────┘  │
└─────────┼──────────────┼────────────────────────┘
          │              │
    ┌─────▼─────┐  ┌─────▼──────┐  ┌──────────────┐
    │ Supabase  │  │ Gemini API │  │ Zoom SDK     │
    │ Auth      │  │ (Flash)    │  │ (Web)        │
    │ Database  │  └────────────┘  │ + Edge Func  │
    │ Storage   │                  │ (sign-zoom)  │
    │ Edge Fn   │                  └──────────────┘
    └───────────┘
```

### Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + Vite 8, Tailwind CSS 4 |
| Routing | react-router-dom v6 |
| Auth / DB / Storage | Supabase (@supabase/supabase-js) |
| AI | Google Gen AI SDK (@google/genai) |
| AI Model | gemini-3.1-flash-lite |
| Video Conferencing | Zoom Meeting SDK for Web (@zoom/meetingsdk) |
| Signature Backend | Supabase Edge Functions (Deno) |
| Email | Gmail compose URL redirect (window.open) |
| Hosting | Vercel |

### Data Flow

1. **Auth** -> Supabase Auth (email/password or Google OAuth)
2. **Create Meeting** -> Insert row in `meetings` table (status: draft)
3. **Join Zoom Meeting** -> Enter Meeting ID + Password -> Edge Function signs request -> Zoom SDK joins meeting
4. **Record Audio** -> MediaRecorder captures audio during Zoom meeting
5. **Process** -> Upload audio to Supabase Storage -> Fetch -> Upload to Gemini -> Parse JSON -> Insert into `summaries` + `action_items`
6. **Review** -> Edit in SummaryEditor / ActionItemList -> Save back to Supabase
7. **Send** -> Build Gmail compose URL -> Open in new tab -> Log in `email_logs`

### Database Tables

- `profiles` — mirrors auth.users, auto-created on signup
- `meetings` — one per recording session, status workflow: draft -> recording -> processing -> done/failed
- `summaries` — one per meeting, holds attendees, summary, key points, decisions, raw transcript
- `action_items` — many per meeting, description, owner, due date, completion status
- `email_logs` — many per meeting, tracks who it was sent to

### Security Model

- Row Level Security (RLS) on all tables
- Each user can only access their own data
- Policies use `auth.uid()` joined through meetings table
- Gemini API key used client-side (accepted trade-off for academic demo)
- Zoom SDK Secret stored in Supabase Edge Function environment (never exposed to client)
