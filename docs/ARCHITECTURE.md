# AdFlow AI - System Architecture

## Overview

AdFlow AI is an AI-powered advertising platform for creating and managing video/image ad campaigns. The platform supports multi-tenant organizations with role-based access, AI content generation via multiple LLM providers (OpenAI, Gemini, Anthropic), and video generation through providers like Kling, Runway, Gemini Video, and Sora.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Runtime** | React 19 |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | Radix UI / shadcn/ui |
| **Video Rendering** | Remotion |
| **AI/LLM** | OpenAI, Google Gemini, Anthropic Claude |
| **Video Generation** | Kling, Runway, Sora, Gemini Video |
| **Language** | TypeScript |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Next.js App Router (React 19 Server + Client Components)                   │
│  ├── (auth)/ - Login/Signup flows                                           │
│  ├── dashboard/[orgId]/ - Main app shell                                    │
│  │   ├── campaigns/ - Campaign management & AI chat                         │
│  │   ├── brand-kits/ - Brand identity management                            │
│  │   ├── video-ads/ - Video ad generation                                   │
│  │   ├── image-ads/ - Image ad generation                                   │
│  │   ├── integrations/ - Meta/Google Ads connections                        │
│  │   └── settings/ - Org settings & secrets                                 │
│  └── api/ - API routes for webhooks & external calls                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER (modules/)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ├── auth/          - Authentication actions (login, signup, signout)       │
│  ├── organizations/ - Org CRUD & membership management                      │
│  ├── campaigns/     - Campaign service & actions                            │
│  ├── brand-kits/    - Brand kit service with website scraping               │
│  ├── generation/    - Video generation orchestration                        │
│  │   └── providers/ - Kling, Runway, Gemini, Sora integrations             │
│  ├── llm/           - LLM config, provider resolution, usage tracking       │
│  ├── image-generation/ - Image ad creation                                  │
│  ├── invitations/   - Team invite system                                    │
│  └── analytics/     - Usage event tracking                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL + Auth + Storage + RLS)                               │
│  ├── lib/db/server.ts   - Server-side Supabase client                       │
│  ├── lib/db/client.ts   - Browser Supabase client                           │
│  └── lib/db/middleware.ts - Session refresh middleware                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ├── OpenAI API       - GPT-4o for campaign strategy & chat                 │
│  ├── Google Gemini    - Alternative LLM & video generation                  │
│  ├── Anthropic Claude - Alternative LLM provider                            │
│  ├── Kling AI         - Video generation                                    │
│  ├── Runway ML        - Video generation                                    │
│  ├── OpenAI Sora      - Video generation                                    │
│  └── Meta/Google Ads  - Ad platform integrations (planned)                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ERD (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CORE ENTITIES                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────────────┐
│   auth.users     │         │        profiles          │
│ (Supabase Auth)  │─────────│ id (PK, FK → auth.users) │
│                  │    1:1  │ full_name                │
│ id (PK)          │         │ avatar_url               │
│ email            │         │ updated_at               │
└──────────────────┘         └──────────────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────────────────┐
│  organization_memberships    │
│ id (PK)                      │
│ org_id (FK → organizations)  │──────┐
│ user_id (FK → auth.users)    │      │
│ role (owner/admin/member/    │      │
│       viewer)                │      │
│ created_at                   │      │
└──────────────────────────────┘      │
                                      │ N:1
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           organizations                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)                                                                      │
│ name                                                                         │
│ slug (UNIQUE)                                                                │
│ billing_plan (default: 'free')                                               │
│ credits_balance (default: 0)                                                 │
│ created_at, updated_at                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │ 1:N (Multiple child tables)
         ▼
┌────────────────────┬────────────────────┬────────────────────┬──────────────┐
│                    │                    │                    │              │
▼                    ▼                    ▼                    ▼              │
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ ┌──────────────────┐   │
│  brand_kits  │ │  campaigns   │ │   invitations    │ │ organization_    │   │
│ id (PK)      │ │ id (PK)      │ │ id (PK)          │ │ secrets          │   │
│ org_id (FK)  │ │ org_id (FK)  │ │ org_id (FK)      │ │ id (PK)          │   │
│ name         │ │ name         │ │ email            │ │ org_id (FK)      │   │
│ website_url  │ │ brief        │ │ role             │ │ name             │   │
│ business_name│ │ platform     │ │ token (UNIQUE)   │ │ value            │   │
│ description  │ │ status       │ │ status           │ │ created_at       │   │
│ locations    │ │ chat_history │ │ expires_at       │ │ updated_at       │   │
│ colors (JSON)│ │ strategy     │ └──────────────────┘ └──────────────────┘   │
│ fonts (JSON) │ │ assets (JSON)│                                             │
│ social_links │ │ agent_status │                                             │
│ logo_url     │ │ duration     │          ┌──────────────────────┐           │
│ offerings    │ │ aspect_ratio │          │  llm_usage_events    │           │
│ strategy     │ │ created_at   │          │ id (PK)              │           │
│ created_at   │ │ updated_at   │          │ org_id (FK)          │◄──────────┘
│ updated_at   │ └──────────────┘          │ campaign_id (FK)     │
└──────────────┘         │                 │ provider             │
                         │ 1:N             │ model                │
                         ▼                 │ kind                 │
               ┌──────────────────┐        │ input_tokens         │
               │ video_generations│        │ output_tokens        │
               │ id (PK)          │        │ total_tokens         │
               │ org_id (FK)      │        │ unit_count           │
               │ campaign_id (FK) │        │ cost                 │
               │ prompt           │        │ created_at           │
               │ video_url        │        └──────────────────────┘
               │ thumbnail_url    │
               │ status           │
               │ provider         │
               │ provider_id      │
               │ created_at       │
               └──────────────────┘
```

---

## Key Data Flows

### 1. User Authentication Flow
```
User → Login Page → Supabase Auth → Session Cookie → Middleware Refresh → Dashboard
```

### 2. Campaign Creation Flow
```
User → New Campaign Form → AI Strategy Chat → Brand Kit Selection → Video Generation → Review & Export
```

### 3. Video Generation Flow
```
User Prompt → Campaign Service → Provider Factory → (Kling/Runway/Gemini/Sora) → 
Poll Status → Upload to Storage → Update DB → Display Result
```

### 4. LLM Usage Tracking
```
Any LLM Call → llm/usage.ts → Insert llm_usage_events → Calculate Cost → 
Update Organization Credits (if applicable)
```

---

## Module Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── (auth)/               # Auth layout group
│   │   ├── login/
│   │   └── signup/
│   ├── auth/callback/        # OAuth callback
│   ├── dashboard/[orgId]/    # Main authenticated routes
│   │   ├── campaigns/
│   │   ├── brand-kits/
│   │   ├── video-ads/
│   │   ├── image-ads/
│   │   ├── integrations/
│   │   └── settings/
│   ├── api/                  # API routes
│   │   ├── brand/
│   │   ├── campaigns/
│   │   └── cron/
│   ├── invite/               # Invitation acceptance
│   └── onboarding/           # New user onboarding
│
├── components/               # React components
│   ├── ui/                   # Base UI (shadcn)
│   ├── campaigns/            # Campaign-specific
│   ├── brand-kits/           # Brand kit forms
│   ├── video-ads/            # Video components
│   ├── image-ads/            # Image components
│   └── dashboard/            # Dashboard shell
│
├── modules/                  # Business logic layer
│   ├── auth/                 # Auth actions
│   ├── organizations/        # Org service
│   ├── campaigns/            # Campaign CRUD
│   ├── brand-kits/           # Brand kit CRUD
│   ├── generation/           # Video generation
│   │   └── providers/        # Provider adapters
│   ├── llm/                  # LLM configuration
│   ├── invitations/          # Invite system
│   └── analytics/            # Usage analytics
│
├── lib/                      # Shared utilities
│   ├── db/                   # Supabase clients
│   ├── storage.ts            # Storage helpers
│   └── utils.ts              # Common utilities
│
└── remotion/                 # Video rendering
```

---

## Security Model

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- **Organizations**: Users can only access orgs they're members of
- **Campaigns/Brand Kits**: Scoped to organization membership
- **Secrets**: Only org admins/owners can read/write

### API Key Storage
- Organization-level secrets stored in `organization_secrets`
- Provider API keys (OpenAI, etc.) resolved from:
  1. Org secrets (priority)
  2. Environment variables (fallback)

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# LLM Providers (fallback if not in org secrets)
OPENAI_API_KEY=xxx
GEMINI_API_KEY=xxx
ANTHROPIC_API_KEY=xxx

# Video Providers
KLING_API_KEY=xxx
RUNWAY_API_KEY=xxx
SORA_API_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Deployment Considerations

1. **Vercel**: Recommended for Next.js deployment
2. **Supabase**: Managed PostgreSQL with Auth
3. **Cron Jobs**: Use Vercel Cron or external service for video status polling
4. **Storage**: Supabase Storage for video/image assets
5. **Edge Functions**: Consider for real-time features

---

*Last Updated: December 5, 2025*
