# Persistent Task Checklist: VTU Judo Tournament

Handoff and state tracking document for AI coding agents.

- [x] Inspect existing architecture
- [x] Dataset management (State, UI, table, search, add/edit/delete)
- [x] Dataset import/update (XLSX/CSV upload, parse, validate, preview, confirm, empty state)
- [x] Participant search (Name and college lookup component for matchup creation)
- [x] Matchup creation (Player 1 & 2 selection modals, auto-populate college, no manual college entry)
- [x] Ordered matchup queue (FIFO queue, live creation without interrupting current, reorder/delete)
- [x] Three-fixture public display (Current dominant, Next, Next+1, no match numbers)
- [x] Live matchup creation (Add to queue while current match runs without interruption)
- [x] Gender display toggle (MEN / WOMEN operator controls, decoupled from data, synced to /display)
- [x] Weight display toggle (Operator buttons, decoupled from data, synced to /display)
- [x] Real-time date/time (Live global clock with real current date and time in IST/local)
- [x] Black logo section (Solid black header background, clean contrast)
- [x] Proper logo containment (object-fit contain, balanced sizing, no overflow or stretch)
- [x] Winner declaration (Confirmation modal, presentation-only crown, no auto-advance)
- [x] Manual Show Next Fixture (Explicit button, advances queue order)
- [x] Realtime synchronization (BroadcastChannel + storage events for /admin and /display)
- [x] Display reconnect/fallback (Retain last valid state, gracefully reconnect)
- [x] Remove demo-data dependency (Empty state when no dataset loaded, no hardcoded match numbers)
- [x] Fix Gender/Weight so they appear only on current fixture
- [x] Fix VTU logo to image-only
- [x] Keep Sambhram logo unchanged
- [x] Remove "Results Logged"
- [x] Fix dataset import rejection
- [x] Create blank Excel import template
- [x] Change participant IDs to 3-digit format
- [x] Replace public display tournament title
- [x] Final manual validation (Build passes, no compile errors. Fixed missing `Download` icon import in AdminPage.jsx.)
- [x] Replace VTU logo with official emblem + text badge (contained neatly in header box)
- [x] Storage architecture confirmed (localStorage + BroadcastChannel cross-tab sync, ideal for kiosk)
- [x] Vercel deployment configuration (`vercel.json` SPA routing rewrites)
- [x] Remove unused files and directories (`src/data`, `scripts`, `test_data`, legacy logos)
- [x] Clean build verification (`vite build` exit code 0)
- [x] Git repository initialization and push to remote

