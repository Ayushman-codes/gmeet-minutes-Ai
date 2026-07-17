# Zoom Minutes AI

A React web app that joins Zoom meetings, records audio, and generates structured Minutes of Meeting (MoM) using Gemini Flash AI.

## Features

- **Auth**: Email/password + Google OAuth sign-in via Supabase
- **Zoom Integration**: Join Zoom meetings directly in-app via Meeting SDK
- **Audio Recording**: Captures meeting audio via MediaRecorder
- **AI Summarization**: Gemini Flash generates summary, key points, decisions, and action items
- **Review & Edit**: Edit all meeting summary fields before saving
- **Send via Gmail**: One-click Gmail compose with formatted MoM

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + Vite 8, Tailwind CSS 4 |
| Auth / DB / Storage | Supabase |
| AI | Google Gemini Flash |
| Video Conferencing | Zoom Meeting SDK for Web |
| Signature Backend | Supabase Edge Functions |

## Prerequisites

- Node.js 18+
- A Supabase project
- A Zoom Developer account with Meeting SDK credentials
- A Google Gemini API key

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd zoom-minutes
npm install
```

### 2. Environment variables

Create `.env.local`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_ZOOM_SDK_KEY=your_zoom_sdk_key
```

### 3. Zoom Developer Setup

1. Go to [marketplace.zoom.us](https://marketplace.zoom.us) → Sign In
2. Develop → Meeting SDK → Create App
3. Copy the **SDK Key** (Client ID) and **SDK Secret** (Client Secret)
4. Add the SDK Key to `.env.local` as `VITE_ZOOM_SDK_KEY`
5. The SDK Secret is used server-side only (in the Edge Function)

### 4. Deploy Supabase Edge Function

The Zoom SDK requires a JWT signature from a backend. Deploy the included Edge Function:

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set the Zoom SDK Secret
supabase secrets set ZOOM_MEETING_SDK_SECRET=your_sdk_secret
supabase secrets set ZOOM_SDK_KEY=your_sdk_key

# Deploy the function
supabase functions deploy sign-zoom
```

### 5. Database setup

Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor.

### 6. Create storage bucket

Create a storage bucket named `meeting-audio` in the Supabase dashboard.

### 7. Start development server

```bash
npm run dev
```

## Usage

1. Sign up / sign in
2. Click "New Meeting" → enter title → Create
3. On the Recorder page, enter:
   - Zoom Meeting ID
   - Meeting Password (if required)
   - Your Name
4. Click "Join Meeting" → joins the Zoom meeting
5. Meeting audio is recorded automatically
6. Click the stop button when done → audio uploads → navigates to Summary
7. Review and edit the generated MoM
8. Save or send via Gmail

## Project Structure

```
zoom-minutes/
  src/
    components/
      SummaryEditor.jsx
      ActionItemList.jsx
      SendViaGmailButton.jsx
    pages/
      Login.jsx
      Dashboard.jsx
      Recorder.jsx
      Summary.jsx
      MeetingDetail.jsx
    lib/
      supabaseClient.js
      geminiClient.js
      gmailRedirect.js
      zoomClient.js
    hooks/
      useAuth.js
    App.jsx
    main.jsx
  supabase/
    schema.sql
    functions/
      sign-zoom/
        index.ts
```

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```
