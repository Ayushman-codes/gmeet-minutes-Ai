# PHASES.md — GMeet Minutes AI

## Build Phases

### Phase 0 — Project Initialization
**Status:** Done

- Scaffolded Vite + React project
- Installed dependencies: react-router-dom, @supabase/supabase-js, @google/genai
- Installed Tailwind CSS v4 with @tailwindcss/vite plugin
- Created directory structure: src/{components,pages,lib,hooks}
- Created .env.local placeholder
- Created supabaseClient.js, geminiClient.js, gmailRedirect.js
- Created supabase/schema.sql with full schema

### Phase 1 — Authentication
**Status:** Done

- Created useAuth hook with email/password + Google OAuth
- Created Login.jsx with sign-in/sign-up toggle
- Added ProtectedRoute wrapper in App.jsx
- Configured routes: /login, /dashboard, /recorder/:id, /summary/:id, /meeting/:id

### Phase 2 — Dashboard + Meeting CRUD
**Status:** Done

- Created Dashboard.jsx with meeting list (newest first)
- Added status badges (draft/recording/processing/done/failed)
- Added create meeting form (title required, agenda optional)
- Auto-navigates to /recorder/:id after creation

### Phase 3 — Audio Recording
**Status:** Done

- Created Recorder.jsx with getDisplayMedia audio capture
- Discards video track, records audio via MediaRecorder (audio/webm;codecs=opus)
- Live elapsed time counter (MM:SS format)
- Recording indicator with pulse animation
- On stop: uploads blob to Supabase Storage, updates meeting status
- Navigates to /summary/:id after upload

### Phase 4 — Gemini Summarization
**Status:** Done

- Created geminiClient.js with summarizeMeetingAudio function
- Uploads audio to Gemini Files API
- Sends structured prompt requesting JSON response
- Parses JSON response into MomExtraction shape
- Wired into Summary.jsx: auto-processes on "processing" status
- Retries once on parse failure, then sets status to "failed"
- Persists results to summaries + action_items tables

### Phase 5 — Summary Review & Edit
**Status:** Done

- Created SummaryEditor.jsx with editable fields
- Attendees: comma-separated input
- Summary: textarea
- Key Points & Decisions: add/remove/edit list items
- Created ActionItemList.jsx with full CRUD
- Add/edit/delete action items
- Toggle completion status
- Owner and due date fields
- Save button persists all changes to Supabase

### Phase 6 — Gmail Send
**Status:** Done

- Created gmailRedirect.js with openGmailCompose function
- Created SendViaGmailButton.jsx
- Recipient input (comma-separated emails)
- Builds formatted MoM body with all sections
- Opens Gmail compose URL in new tab
- Logs sent recipients to email_logs table

### Phase 7 — Meeting Detail
**Status:** Done

- Created MeetingDetail.jsx as read-only view
- Reuses SummaryEditor in read-only mode
- Reuses ActionItemList in read-only mode
- Gmail send still available

### Phase 8 — Polish & Error States
**Status:** Done

- Loading spinner on all pages
- Error banners with retry options
- Empty states (no meetings, no summary, no action items)
- Failed processing state with retry button
- Build passes clean

### Next Steps (Manual)

1. Create Supabase project and run schema.sql
2. Enable Google OAuth provider in Supabase
3. Create `meeting-audio` storage bucket in Supabase
4. Fill in .env.local with real credentials
5. Test auth flow end-to-end
6. Test recording in Chrome/Edge
7. Verify Gemini model name at https://ai.google.dev/gemini-api/docs/models
8. Deploy to Vercel
