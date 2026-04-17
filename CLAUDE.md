# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with Turbopack at localhost:3000
npm run build     # Production build
npm run lint      # ESLint via next lint
npm run prettier  # Format all files with Prettier + tailwindcss plugin
```

No test suite is configured in this project.

## Architecture

TinyNote is a Next.js 15 (App Router) note-taking app. The entire application logic lives in a single file:

- [notes.tsx](notes.tsx) — Root client component (`"use client"`). Contains the `Note` type, all state, the Tiptap rich-text editor instance, CRUD handlers, and the full UI (note grid + create/edit Dialog). `app/page.tsx` simply re-exports it as `<NotesApp />`.

Notes are held in React `useState` — there is **no backend or persistence layer** currently. The git history shows Firebase and an AI chat route (`app/api/chat/route.js`) were removed; those deleted files are still staged as deletions in the working tree.

### UI Stack

- **shadcn/ui** (New York style, neutral base) — component primitives in [components/ui/](components/ui/). Add new components with `npx shadcn@latest add <component>`.
- **Tiptap** (`@tiptap/react` + `@tiptap/starter-kit`) — rich-text editor embedded in the note modal. The single editor instance is reused for both create and edit flows; content is set via `editor.commands.setContent(...)` when opening the edit modal.
- **Tailwind CSS v3** with CSS variables for theming (defined in `app/globals.css`). Dark mode uses the `class` strategy.
- **lucide-react** for icons (configured as the shadcn icon library).
- **framer-motion** is installed but not yet used in the current codebase.

### Key Conventions

- Path alias `@/` maps to the repo root (configured in `tsconfig.json`).
- All colors/radii reference CSS custom properties — never use raw Tailwind color classes like `bg-blue-500` for themed elements; use semantic tokens like `bg-primary`, `text-muted-foreground`, etc.
- The `handleAIAssist` function in [notes.tsx](notes.tsx) is a placeholder stub — AI integration is not wired up yet.
