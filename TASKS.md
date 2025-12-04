# Admotion AI UI/UX Redesign Plan

## Goals
- Rebuild the app shell to match the provided ad-creation screens: floating light canvas, centered prompt builder, icon-only rail, and top-right credit/share actions.
- Make the left rail hideable (ChatGPT/Gemini style), remember user preference, and keep content usable on mobile with an overlay drawer.
- Modernize visual system (tokens, typography, spacing, shadows) while keeping the existing Supabase + Next.js 16 (App Router) stack.

## Architecture Blueprint
- **Frontend**: Next.js 16 (App Router) with React 19. Server Components for data fetch, Client Components for interactive shell (rail toggle, menus, prompt input). Tailwind v4 tokens for theming; Radix primitives for popovers/menus.
- **Auth & Data**: Supabase Auth with RLS-backed tables. Use the existing `@/modules/*` services for reads/writes; favor Server Actions for mutations (campaigns, brand kits, generations).
- **State**: Local UI state via React; persist shell prefs (rail open/closed) in `localStorage` keyed per user/org. Derived data (credits, campaigns) fetched server-side; optimistic updates for prompt presets if needed.
- **Assets**: Host static UI assets (icons, sample cards) in `public/` and map via Next Image for responsive rendering.
- **Observability**: Reuse `llm_usage_events` for prompt runs; log rail toggle events only if we add product analytics (to be decided).

## ERD Snapshot (Supabase)
- `profiles` 1—N `organization_memberships` N—1 `organizations`
- `organizations` 1—N `brand_kits`
- `organizations` 1—N `campaigns` 1—N `video_generations`
- `campaigns` 1—N `image_generations`
- `organizations` 1—N `invitations`
- `organizations` 1—N `usage_events`
- `organizations` 1—N `llm_usage_events` (optional campaign_id)
- `llm_profiles` (global catalog) — created_by → `profiles.id`

## UI/UX Redesign Plan
- **Shell**: Icon-only rail with tooltips; expand-on-hover on desktop, slide-in drawer on mobile; persistent toggle button; floating bottom avatar/settings control.
- **Top Bar**: Credit pill with CTA to buy more; share button; optional org switcher if needed in this view.
- **Hero Prompt Builder**: Centered greeting + headline; gradient, pill-shaped input with send CTA; sub-controls for aspect ratio selector, add-input chips, Ads Style dropdown with thumbnails.
- **Quick Start Gallery**: Horizontal scroll of sample prompts/cards; tap to inject prompt; responsive stacking on mobile.
- **States**: Empty, loading, success, and error states for prompt submission; keyboard shortcuts (⌘/Ctrl+K to focus input).
- **Responsiveness & A11y**: Large touch targets, focus rings, prefers-reduced-motion fallbacks, semantic headings.

## Work Breakdown
1) Define design tokens (colors, radii, shadows, gradients) and add brand font import.  
2) Build new app shell layout: rail + header + centered canvas; add rail toggle (desktop collapse + mobile drawer).  
3) Implement greeting/hero section and prompt builder component (input, send button, helper text).  
4) Add aspect-ratio switcher and Ads Style popover (with thumbnails + selection state).  
5) Create Quick Start prompt gallery (cards with preview images and inject-to-input behavior).  
6) Wire prompt submission to existing generation endpoint/action; show credit deduction + loading state.  
7) Persist rail preference per user/org; ensure SSR hydration safety.  
8) Polish interactions: hover/active states, focus management, keyboard shortcuts, animations with prefers-reduced-motion guards.  
9) Responsive QA (mobile/desktop), accessibility audit, and regression check on dashboard routes.  
10) Document new components/props and add storybook-style usage notes (optional if time).

## Inputs Needed From You
- Final logo/SVG for the top-left mark and any brand mascot used in the rail.  
- Brand palette (primary/secondary/neutral), gradients, and chosen typography (font files or links).  
- Icon set preference (Lucide vs custom) and any motion constraints (timings/easing).  
- The exact copy for greetings, placeholders, aspect ratio labels, Ads Style options, and sample prompt cards.  
- Rules for credits (how to fetch/update the balance, link for “Get more credit”, share target URL).  
- Any additional states beyond the provided mockups (errors, zero-credit, loading skeletons, mobile-specific behavior).
