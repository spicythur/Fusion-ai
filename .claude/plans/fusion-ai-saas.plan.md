# Plan: Fusion AI — SaaS Platform

**Source PRD**: `.claude/prds/fusion-ai-saas.prd.md`
**Selected Milestone**: 1 — Next.js Migration
**Complexity**: Large

## Summary
Migrate frontend from Vite + React to Next.js with SSR landing page, API routes for backend proxy, and foundation for auth/database/billing. Preserve all existing functionality (chat, presets, WebSocket, Fusion 360 integration).

## Current State
- **Frontend**: Vite + React 19, single `App.jsx` (291 lines), `useFusion.js` hook (240 lines), `App.css` (718 lines)
- **Backend**: Express.js on port 3001, WebSocket at `/ws/generate`, REST endpoints
- **Tests**: Vitest, 15 frontend tests, 24 backend tests
- **AI**: MiMo API via Anthropic-compatible SDK, 37 features tested (100% pass)

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Naming | `frontend/src/App.jsx` | PascalCase components, camelCase hooks |
| State | `frontend/src/hooks/useFusion.js` | Custom hooks for WebSocket + API |
| Styling | `frontend/src/App.css` | CSS variables, clean minimal design |
| Tests | `frontend/src/__tests__/` | Vitest + Testing Library |
| Backend | `backend/index.js` | Express + WebSocket + Anthropic SDK |

## Migration Strategy

### Phase 1: Next.js Foundation (Milestone 1)
**What**: Create Next.js project, migrate components, keep Express backend as-is.

**Why not full rewrite**: Incremental migration preserves working code. Express backend stays independent — Next.js API routes can proxy to it later.

### Phase 2: Auth + Database (Milestone 2-3)
**What**: Add NextAuth.js + Supabase for user accounts and data persistence.

### Phase 3: Billing + Quota (Milestone 4-5)
**What**: Stripe integration, usage tracking per tier.

### Phase 4: Landing + Admin (Milestone 7-8)
**What**: SSR landing page, admin dashboard.

---

## Files to Change — Milestone 1 (Next.js Migration)

| File | Action | Why |
|---|---|---|
| `frontend-next/` | CREATE | New Next.js project (parallel to existing Vite) |
| `frontend-next/app/layout.tsx` | CREATE | Root layout with metadata |
| `frontend-next/app/page.tsx` | CREATE | Landing page (SSR) |
| `frontend-next/app/chat/page.tsx` | CREATE | Chat interface (client component) |
| `frontend-next/components/ChatInterface.tsx` | CREATE | Main chat component (from App.jsx) |
| `frontend-next/components/Header.tsx` | CREATE | Header component |
| `frontend-next/components/WelcomeScreen.tsx` | CREATE | Welcome + presets |
| `frontend-next/components/MessageBubble.tsx` | CREATE | Success/error cards |
| `frontend-next/components/InputArea.tsx` | CREATE | Input + toggle |
| `frontend-next/hooks/useFusion.ts` | CREATE | WebSocket hook (from useFusion.js) |
| `frontend-next/styles/globals.css` | CREATE | Global styles (from App.css) |
| `frontend-next/next.config.js` | CREATE | Next.js config with proxy |
| `frontend-next/package.json` | CREATE | Dependencies |

## Tasks

### Task 1: Initialize Next.js Project
- **Action**: `npx create-next-app@latest frontend-next --typescript --tailwind --app --src-dir`
- **Why**: Fresh Next.js 14+ with App Router, TypeScript, Tailwind
- **Validate**: `npm run dev` works, shows default page

### Task 2: Migrate CSS to Tailwind + CSS Variables
- **Action**: Convert `App.css` variables to Tailwind config + globals.css
- **Mirror**: Keep same color scheme (--accent: #2563eb, --bg: #ffffff)
- **Validate**: Visual parity with current design

### Task 3: Migrate Components
- **Action**: Split `App.jsx` into Next.js components
  - `ChatInterface.tsx` — main chat logic (client component, "use client")
  - `Header.tsx` — header with status badges
  - `WelcomeScreen.tsx` — welcome + presets
  - `MessageBubble.tsx` — success/error cards
  - `InputArea.tsx` — input field + toggle
- **Mirror**: Same props, same state management
- **Validate**: Each component renders correctly

### Task 4: Migrate useFusion Hook
- **Action**: Convert `useFusion.js` to TypeScript `useFusion.ts`
- **Changes**: Add types, keep same WebSocket logic
- **Mirror**: Same behavior (connect, send, receive, timeout)
- **Validate**: WebSocket connection works, messages flow

### Task 5: Setup API Route Proxy
- **Action**: Create `app/api/fusion/[...path]/route.ts` to proxy to Express backend
- **Why**: Next.js API routes forward to localhost:3001
- **Validate**: `/api/fusion/status` returns backend response

### Task 6: Create Landing Page
- **Action**: SSR landing page with features, pricing, CTA
- **Mirror**: Same design language as chat UI
- **Validate**: Page loads fast (SSR), looks professional

### Task 7: Migrate Tests
- **Action**: Move tests to `__tests__/` in Next.js project
- **Changes**: Update imports, use `@testing-library/react`
- **Validate**: All 15 tests pass

### Task 8: Update PM2 Config
- **Action**: Update `ecosystem.config.cjs` to run Next.js instead of Vite
- **Validate**: `pm2 start` works, both services running

---

## Validation Commands
```bash
cd frontend-next
npm run dev          # Dev server on port 3000
npm run build        # Production build
npm run test         # Run tests
npm run lint         # Check code quality
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| WebSocket proxy issues in Next.js | Medium | Keep Express backend, proxy via API routes |
| SSR breaks client-side hooks | Low | Use "use client" directive for interactive components |
| Tailwind migration breaks styling | Low | Keep CSS variables as fallback |
| Test migration takes longer | Medium | Migrate incrementally, component by component |

## Acceptance
- [ ] Next.js project builds successfully
- [ ] Landing page renders (SSR)
- [ ] Chat interface works (WebSocket + Fusion 360)
- [ ] All 15 tests pass
- [ ] PM2 runs both frontend + backend
- [ ] Visual parity with current Vite app

---

*Next milestone after this: 2 — Auth System (NextAuth.js + Supabase)*
