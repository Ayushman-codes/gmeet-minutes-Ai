# GMeet Minutes AI — Build Context for AI Coding Agent

> Paste this entire file as the project brief/system context before asking an agent
> (Claude Code, Cursor, Windsurf, v0, etc.) to scaffold or build this app. It is
> self-contained: stack, schema, contracts, file layout, and feature specs with
> acceptance criteria. Do not ask the user to re-explain anything covered below —
> follow it directly and ask only about genuine gaps.

## 1. Project Overview

**Name:** GMeet Minutes AI
**What it is:** A React web app that lets a host record the audio of a live Google
Meet call, sends that audio to the Gemini Flash API for transcription +
summarization in one call, produces a structured Minutes of Meeting (MoM), and
lets the host send it to participants via a Gmail compose redirect.

**Scope:** Single-user-per-meeting (the host). No real-time multi-user
collaboration required. Built for an academic (BCA final-year) evaluation by a
4-person team — prioritize a working core pipeline over exhaustive edge-case
handling.

**Non-goals (do not build unless explicitly asked):** multi-platform support
(Zoom/Teams), speaker diarization, real-time live captioning, calendar
integration, a custom backend server beyond Supabase Edge Functions.

## 2. Tech Stack (exact)

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS |
| Routing | react-router-dom v6 |
| Auth / DB / Storage | Supabase (`@supabase/supabase-js`) |
| AI | Google Gen AI SDK (`@google/genai`) |
| AI model | `gemini-3.1-flash-lite` (cost-efficient, documented direct-audio-to-text support) — use `gemini-3.5-flash` instead if higher summarization quality is needed. **Verify the current model string at https://ai.google.dev/gemini-api/docs/models before final submission** — Gemini model names rotate on a period of months and older names (e.g. `gemini-1.5-flash`, `gemini-2.0-flash`) are already shut down as of mid-2026. |
| Email handoff | Gmail compose URL redirect (`window.open`), no package needed |
| Hosting | Vercel |

## 3. Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
```

Note for the agent: this key will be used client-side. That's acceptable for an
academic demo restricted to a personal/dev Google Cloud project, but flag it as
a known security trade-off — do not silently route it through a server without
being asked, since that adds scope.

## 4. Database Schema (Supabase / Postgres — run as-is in the SQL editor)

```sql
-- profiles mirrors auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now()
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  agenda_notes text,
  meeting_date timestamptz default now(),
  status text default 'draft' check (status in ('draft','recording','processing','done','failed')),
  audio_url text,
  created_at timestamptz default now()
);

create table summaries (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade not null unique,
  attendees text[],
  summary_text text,
  key_points jsonb,
  decisions jsonb,
  raw_transcript text,
  created_at timestamptz default now()
);

create table action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade not null,
  description text not null,
  owner_name text,
  due_date date,
  is_completed boolean default false,
  created_at timestamptz default now()
);

create table email_logs (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade not null,
  sent_to text[],
  sent_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table meetings enable row level security;
alter table summaries enable row level security;
alter table action_items enable row level security;
alter table email_logs enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own meetings" on meetings for all using (auth.uid() = user_id);
create policy "own summaries" on summaries for all using (
  auth.uid() = (select user_id from meetings where meetings.id = summaries.meeting_id)
);
create policy "own action items" on action_items for all using (
  auth.uid() = (select user_id from meetings where meetings.id = action_items.meeting_id)
);
create policy "own email logs" on email_logs for all using (
  auth.uid() = (select user_id from meetings where meetings.id = email_logs.meeting_id)
);

-- auto-create profile row on signup
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 5. Data Contracts (TypeScript-style, for reference even in a .jsx codebase)

```ts
interface Meeting {
  id: string;
  user_id: string;
  title: string;
  agenda_notes?: string;
  meeting_date: string; // ISO
  status: 'draft' | 'recording' | 'processing' | 'done' | 'failed';
  audio_url?: string;
}

interface Summary {
  id: string;
  meeting_id: string;
  attendees: string[];
  summary_text: string;
  key_points: string[];
  decisions: string[];
  raw_transcript: string;
}

interface ActionItem {
  id: string;
  meeting_id: string;
  description: string;
  owner_name?: string;
  due_date?: string; // ISO date
  is_completed: boolean;
}

// Shape the Gemini call must return (see 8.2)
interface MomExtraction {
  attendees: string[];
  summary_text: string;
  key_points: string[];
  decisions: string[];
  action_items: { description: string; owner_name?: string; due_date?: string }[];
}
```

## 6. File / Folder Structure

```
gmeet-minutes-ai/
  src/
    components/
      RecorderControls.jsx
      SummaryEditor.jsx
      ActionItemList.jsx
      MeetingCard.jsx
      SendViaGmailButton.jsx
    pages/
      Login.jsx
      Dashboard.jsx
      Recorder.jsx
      Summary.jsx
      MeetingDetail.jsx
    lib/
      supabaseClient.js
      geminiClient.js       # wraps Gemini call + JSON parsing/validation
      gmailRedirect.js       # builds the compose URL
    hooks/
      useAudioRecorder.js    # getDisplayMedia + MediaRecorder wrapper
      useAuth.js
    App.jsx
    main.jsx
  supabase/
    schema.sql               # section 4 above
  .env.local
```

## 7. Feature Specs & Acceptance Criteria

**F1 — Auth**
- Supabase email/password AND Google OAuth sign-in.
- Unauthenticated users are redirected to `/login`; authenticated users land on `/dashboard`.
- Done when: a new user can sign up, gets a `profiles` row auto-created, and stays logged in across a refresh.

**F2 — Create meeting**
- Form: title (required), agenda notes (optional).
- Inserts a `meetings` row with `status = 'draft'`, then navigates to `/recorder/:id`.

**F3 — Audio capture**
- Use `navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })`, discard the video track immediately, feed the audio track to `MediaRecorder`.
- UI: Start / Stop button, live elapsed-time counter, a visible "Recording" indicator.
- On Stop: upload the resulting blob to Supabase Storage, set `meetings.audio_url`, set `status = 'processing'`.
- Done when: a recorded file is present in Supabase Storage and linked to the meeting row.
- Known limitation to document, not silently "fix": tab-audio sharing requires Chrome or Edge; other browsers may not expose the "share tab audio" checkbox.

**F4 — Gemini summarization**
- On upload success, call Gemini Flash with the audio file + the prompt template in section 8.2.
- Parse the JSON response into a `MomExtraction`; on parse failure, retry once, then set `status = 'failed'` and surface a retry button — never crash the page.
- Persist results into `summaries` and `action_items`; set `status = 'done'`.

**F5 — Review & edit**
- Editable fields for attendees, summary text, key points, decisions, and the action item list (add/remove/edit rows, including owner and due date).
- Saves back to `summaries` / `action_items` on blur or an explicit Save button.

**F6 — Send via Gmail**
- Recipient input (comma-separated emails).
- Builds a Gmail compose URL (section 8.3) with subject = meeting title + date, body = formatted MoM, opens in a new tab.
- Writes a row to `email_logs` when the user confirms they sent it (optimistic; there's no way to detect an actual send with the redirect approach — say so in the UI, don't claim certainty).

**F7 — Dashboard / history**
- Lists the user's meetings (title, date, status badge), newest first.
- Clicking a "done" meeting opens `/meeting/:id` (read-only `MeetingDetail`, reusing `SummaryEditor` in read-only mode).

## 8. API Integration Details

### 8.1 Supabase client

```js
// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 8.2 Gemini Flash call (transcription + structured summarization in one call)

```js
// src/lib/geminiClient.js
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const PROMPT = `You are given the audio recording of a meeting.
Return ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:
{
  "attendees": string[],       // names actually heard in the audio; empty array if none identifiable
  "summary_text": string,      // 2-4 sentence plain-language summary
  "key_points": string[],
  "decisions": string[],
  "action_items": [
    { "description": string, "owner_name": string | null, "due_date": string | null }
  ]
}`;

export async function summarizeMeetingAudio(audioFile) {
  const uploaded = await ai.files.upload({ file: audioFile });
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: [PROMPT, uploaded],
  });

  const cleaned = response.text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON — see raw text for manual recovery.');
  }
}
```

### 8.3 Gmail redirect

```js
// src/lib/gmailRedirect.js
export function openGmailCompose({ to, subject, body }) {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: to.join(','),
    su: subject,
    body,
  });
  window.open(`https://mail.google.com/mail/?${params.toString()}`, '_blank');
}
```

## 9. Routes

| Path | Component | Auth required |
|---|---|---|
| `/login` | `Login.jsx` | no |
| `/dashboard` | `Dashboard.jsx` | yes |
| `/recorder/:meetingId` | `Recorder.jsx` | yes |
| `/summary/:meetingId` | `Summary.jsx` | yes |
| `/meeting/:meetingId` | `MeetingDetail.jsx` | yes |

## 10. Build Order

1. Supabase project + run `schema.sql` + enable Google OAuth provider.
2. `useAuth` hook + `Login.jsx` + route guarding.
3. `Dashboard.jsx` + meeting CRUD (create/list).
4. `useAudioRecorder` hook + `Recorder.jsx` + Supabase Storage upload.
5. `geminiClient.js` + wire up the processing step after upload.
6. `Summary.jsx` with `SummaryEditor` + `ActionItemList`, save-back-to-DB.
7. `gmailRedirect.js` + `SendViaGmailButton`.
8. `MeetingDetail.jsx` (read-only reuse of Summary).
9. Empty/error/loading states across all screens; deploy to Vercel.

## 11. Constraints / Non-Negotiables

- No custom backend server — Supabase (Postgres + Auth + Storage + optional Edge Functions) is the entire backend.
- No video is stored or processed, audio only.
- Single-page app, client-rendered; no SSR requirement.
- Target Chrome/Edge for the recording feature; do not spend effort on cross-browser tab-audio workarounds.
- Keep the Gemini prompt strict-JSON and always parse defensively — never let a malformed AI response crash a screen.

## 12. Known Limitations (document these, don't attempt silent fixes)

- Tab-audio capture only works in Chromium-based browsers.
- No cryptographic proof the Gmail email was actually sent — the app can only confirm the compose window opened.
- Transcription accuracy drops with overlapping speakers or heavy background noise; no diarization in this scope.
- Gemini model names change frequently — pin the exact string used and note the pin date in the README.
