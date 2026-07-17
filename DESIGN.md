# DESIGN.md — Zoom Minutes AI

## UI / UX Design System

### Color Palette

- **Primary**: blue-600 (#2563eb) — buttons, links, focus rings
- **Background**: gray-50 (#f9fafb) — page backgrounds
- **Surface**: white — cards, modals, forms
- **Text Primary**: gray-900 (#111827) — headings, body
- **Text Secondary**: gray-500 (#6b7280) — labels, metadata
- **Success**: green-600 (#16a34a) — sent/done states
- **Warning**: yellow-600 (#ca8a04) — processing states
- **Error**: red-600 (#dc2626) — errors, delete actions
- **Recording**: red-500 with pulse animation — live recording indicator

### Typography

- **Headings**: system-ui, font-semibold, text-gray-900
- **Body**: system-ui, text-sm, text-gray-700
- **Mono**: ui-monospace — timer display

### Component Patterns

#### Cards
- `bg-white rounded-xl shadow-sm border border-gray-200 p-6`
- Used for: summary sections, action items, meeting list items

#### Buttons
- **Primary**: `bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2.5`
- **Secondary**: `text-sm text-gray-500 hover:text-gray-700`
- **Danger**: `bg-red-500 hover:bg-red-600 text-white` (record button)
- **Success**: `bg-green-600 hover:bg-green-700 text-white` (send button)

#### Forms
- Inputs: `border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`
- Textarea: same styling with rows prop
- Labels: `text-xs text-gray-500`

#### Status Badges
- Draft: `bg-gray-100 text-gray-700`
- Recording: `bg-blue-100 text-blue-700`
- Processing: `bg-yellow-100 text-yellow-700`
- Done: `bg-green-100 text-green-700`
- Failed: `bg-red-100 text-red-700`

### Page Layouts

#### Login
- Centered card on gray-50 background
- Logo + title at top
- Email/password form
- Google OAuth button with icon
- Toggle between sign-in and sign-up

#### Dashboard
- Full-width header with app name + user email + sign out
- "Your Meetings" heading + "New Meeting" button
- Meeting list: cards with title, date, status badge
- Create meeting modal: title + agenda notes + create button

#### Recorder
- Centered card
- Meeting title + status label
- Zoom meeting join form: Meeting ID, Password, User Name
- "Join Meeting" button
- During meeting: elapsed timer (MM:SS), recording indicator with pulse
- Leave meeting button (gray square)
- Zoom SDK embedded meeting container

#### Summary
- Full-width header with meeting title
- Sections: Attendees, Summary, Key Points, Decisions, Action Items
- Editable inputs in edit mode, plain text in read-only
- Save button + Send via Gmail button

#### Meeting Detail
- Same layout as Summary but read-only
- Gmail send still available
