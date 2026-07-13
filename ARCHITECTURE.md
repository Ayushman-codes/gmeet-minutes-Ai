# ARCHITECTURE.md — GMeet Minutes AI

## System Architecture

### Overview

```
┌─────────────────────────────────────────────────┐
│                  React SPA (Vite)               │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Pages    │  │ Components│  │   Hooks      │  │
│  │ Login     │  │ Summary   │  │ useAuth      │  │
│  │ Dashboard │  │ ActionItem│  │ useAudioRec  │  │
│  │ Recorder  │  │ SendGmail │  │              │  │
│  │ Summary   │  │ MeetingCrd│  │              │  │
│  │ Detail    │  │           │  │              │  │
│  └─────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
│        │              │               │          │
│  ┌─────┴──────────────┴───────────────┴───────┐  │
│  │              Lib Layer                      │  │
│  │  supabaseClient.js  geminiClient.js        │  │
│  │  gmailRedirect.js                        │  │
│  └──────┬──────────────┬──────────────────────┘  │
└─────────┼──────────────┼────────────────────────┘
          │              │
    ┌─────▼─────┐  ┌─────▼──────┐
    │ Supabase  │  │ Gemini API │
    │ Auth      │  │ (Flash)    │
    │ Database  │  └────────────┘
    │ Storage   │
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
| Email | Gmail compose URL redirect (window.open) |
| Hosting | Vercel |

### Data Flow

1. **Auth** → Supabase Auth (email/password or Google OAuth)
2. **Create Meeting** → Insert row in `meetings` table (status: draft)
3. **Record Audio** → getDisplayMedia → MediaRecorder → Blob → Supabase Storage
4. **Process** → Fetch audio from Storage → Upload to Gemini → Parse JSON → Insert into `summaries` + `action_items`
5. **Review** → Edit in SummaryEditor / ActionItemList → Save back to Supabase
6. **Send** → Build Gmail compose URL → Open in new tab → Log in `email_logs`

### Database Tables

- `profiles` — mirrors auth.users, auto-created on signup
- `meetings` — one per recording session, status workflow: draft → recording → processing → done/failed
- `summaries` — one per meeting, holds attendees, summary, key points, decisions, raw transcript
- `action_items` — many per meeting, description, owner, due date, completion status
- `email_logs` — many per meeting, tracks who it was sent to

### Security Model

- Row Level Security (RLS) on all tables
- Each user can only access their own data
- Policies use `auth.uid()` joined through meetings table
- Gemini API key used client-side (accepted trade-off for academic demo)
