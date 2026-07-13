# RULES.md — GMeet Minutes AI

## Development Rules

### Code Style

1. **No comments** in code unless explicitly requested
2. **Functional components** only — no class components
3. **Tailwind CSS** for all styling — no CSS modules, no styled-components
4. **JSX** files — not TSX (TypeScript interfaces in AGENT_CONTEXT.md are reference only)
5. **Named exports** for hooks and lib modules, **default exports** for pages and components

### File Naming

- Pages: `src/pages/PascalCase.jsx`
- Components: `src/components/PascalCase.jsx`
- Hooks: `src/hooks/camelCase.js`
- Lib: `src/lib/camelCase.js`

### Data Rules

1. **Supabase is the only backend** — no custom server, no Express, no Edge Functions unless explicitly needed
2. **Row Level Security** on all tables — never query without user context
3. **Client-side API keys** — acceptable for this academic demo, documented as known trade-off
4. **Audio only** — never store or process video

### AI Rules

1. **Strict JSON parsing** — never let malformed Gemini response crash a page
2. **Retry once** on parse failure, then set status to 'failed' with retry button
3. **One call** for transcription + summarization (no separate transcription step)
4. **Model string must be verified** at https://ai.google.dev/gemini-api/docs/models before submission

### Git Rules

1. **Never commit secrets** — .env.local is gitignored
2. **Concise commit messages** matching repo style
3. **Only commit when explicitly asked**

### Testing

- Build must pass (`npm run build`) before any commit
- Run `npm run lint` if linting is configured
- Manual testing in Chrome/Edge for recording feature

### Known Limitations (Do Not Fix Silently)

1. Tab-audio capture only works in Chromium browsers
2. No proof Gmail email was actually sent — only compose window opens
3. Transcription accuracy drops with overlapping speakers
4. Gemini model names rotate periodically — pin and document the string used
