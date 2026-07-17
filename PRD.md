# PRD — Zoom Minutes AI

## Product Requirements Document

### 1. Product Vision

A React web app that lets a user join a Zoom meeting, record the audio, send it to the Gemini Flash API for transcription + summarization in one call, produce a structured Minutes of Meeting (MoM), and send it to participants via a Gmail compose redirect.

### 2. Target Users

- BCA final-year students (4-person team building for academic evaluation)
- Single-user-per-meeting model (the participant)

### 3. Core Features

| ID | Feature | Description |
|----|---------|-------------|
| F1 | Auth | Supabase email/password + Google OAuth sign-in |
| F2 | Create Meeting | Form with title (required), agenda notes (optional) |
| F3 | Zoom Integration | Join Zoom meetings via Meeting SDK, capture audio via MediaRecorder |
| F4 | Gemini Summarization | Transcription + structured MoM extraction via Gemini Flash |
| F5 | Review & Edit | Editable attendees, summary, key points, decisions, action items |
| F6 | Send via Gmail | Gmail compose URL redirect with formatted MoM |
| F7 | Dashboard / History | List meetings with status badges, view completed meetings |

### 4. Non-Goals

- Speaker diarization
- Real-time live captioning
- Calendar integration
- Custom backend server beyond Supabase Edge Functions

### 5. Success Criteria

- New user can sign up, get profile auto-created, stay logged in across refresh
- User can join a Zoom meeting, record audio, and see structured meeting minutes
- User can edit minutes and action items, then email via Gmail redirect
- All data is user-scoped via Row Level Security

### 6. Constraints

- Supabase (Postgres + Auth + Storage + Edge Functions) is the entire backend
- Audio only — no video stored or processed
- SPA, client-rendered — no SSR
- Target Chrome/Edge for the Zoom SDK
- Strict-JSON Gemini prompt with defensive parsing

### 7. Known Limitations

- Zoom Meeting SDK requires Chrome/Edge on desktop
- No cryptographic proof Gmail email was actually sent
- Transcription accuracy drops with overlapping speakers / background noise
- Gemini model names change frequently — must pin exact string
- Zoom SDK signature requires a Supabase Edge Function deployment
