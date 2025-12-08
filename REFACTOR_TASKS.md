# Admotion AI - Refactor & Architecture Tasks

> Enterprise-level refactor with ≤150 lines per module/service  
> Created: Dec 8, 2025  
> Status: In Progress

---

## 📋 Task Overview

| # | Category | Task | Status | Priority |
|---|----------|------|--------|----------|
| 1 | Architecture | Update ERD with image_generations, creative_chat_sessions | ✅ Done | High |
| 2 | Architecture | Document module boundaries and dependencies | 🔄 Pending | High |
| 3 | Refactor | Split `image-generator.tsx` (~1400 lines → ≤150 each) | ✅ Done | Critical |
| 4 | Refactor | Split `video-generator.tsx` (~1150 lines → ≤150 each) | 🔄 Pending | Critical |
| 5 | Refactor | Fix lint errors in `generation/actions.ts` | ✅ Done | Medium |
| 6 | Refactor | Fix lint errors in `invitations/actions.ts` | ✅ Done | Medium |
| 7 | Refactor | Fix lint errors in `organizations/actions.ts` | ✅ Done | Medium |
| 8 | Refactor | Fix lint errors in `llm/admin-actions.ts` | ✅ Done | Medium |
| 9 | Feature | Add post-generation quick actions (CTA swap, logo position) | 🔄 Pending | Medium |
| 10 | Feature | Reference image upload preview in initial view | 🔄 Pending | Low |
| 11 | Quality | Run full lint & build verification | ✅ Done (94 warnings) | High |
| 12 | Release | Commit with semantic version tag | 🔄 Pending | High |

---

## 📐 Architecture Targets

### File Size Limits
- **Components**: ≤150 lines (excluding imports/types)
- **Services**: ≤150 lines per file
- **Hooks**: ≤100 lines
- **Types**: Unlimited (pure definitions)

### Module Structure Pattern
```
module-name/
├── index.ts          # Public exports only
├── types.ts          # All types for this module
├── service.ts        # Core business logic (≤150 lines)
├── actions.ts        # Server actions (≤150 lines)
├── utils.ts          # Helper functions (≤100 lines)
└── providers/        # External integrations (if applicable)
    ├── factory.ts
    └── [provider].ts
```

### Component Structure Pattern
```
component-group/
├── index.ts              # Re-exports
├── types.ts              # Shared types
├── ComponentName.tsx     # Main component (≤150 lines)
├── ComponentName.hooks.ts # Custom hooks
├── ComponentName.utils.ts # Component-specific helpers
└── sub-components/
    ├── SubComponent1.tsx
    └── SubComponent2.tsx
```

---

## 🗂️ Task Details

### Task 1: Update ERD
**Status**: 🔄 Pending

Add missing tables to ERD:
- `image_generations` - AI image generation records
- `creative_chat_sessions` - Chat sessions for image/video ads
- `brand_memories` - Brand memory storage (if exists)

### Task 3: Split image-generator.tsx
**Status**: 🔄 Pending  
**Current**: ~1400 lines  
**Target**: 8-10 files, ≤150 lines each

**Proposed Split**:
```
src/components/image-ads/
├── index.ts
├── types.ts                    # All types (~50 lines)
├── ImageGenerator.tsx          # Main orchestrator (~100 lines)
├── hooks/
│   ├── useImageChat.ts         # Chat logic (~100 lines)
│   ├── useImageGeneration.ts   # Generation logic (~100 lines)
│   └── useBrandContext.ts      # Brand selection (~80 lines)
├── components/
│   ├── InitialView.tsx         # Landing state (~150 lines)
│   ├── ChatSessionView.tsx     # Split panel layout (~100 lines)
│   ├── ChatPanel.tsx           # Right chat panel (~120 lines)
│   ├── PreviewPanel.tsx        # Left preview area (~100 lines)
│   ├── ProposedCopyCard.tsx    # Proposed ad copy form (~150 lines)
│   ├── BrandPreview.tsx        # Brand logo/colors (~80 lines)
│   ├── ReferenceStrip.tsx      # Reference images (~60 lines)
│   ├── GenerationProgress.tsx  # Progress bar (~40 lines)
│   └── QuickActions.tsx        # Post-generation actions (~80 lines)
└── utils/
    ├── promptBuilder.ts        # Structured prompt (~100 lines)
    └── copyParser.ts           # Parse AI response (~60 lines)
```

### Task 4: Split video-generator.tsx
**Status**: 🔄 Pending  
**Current**: ~1150 lines  
**Target**: 7-9 files, ≤150 lines each

**Proposed Split**: Similar to image-generator structure

### Task 5-8: Fix Lint Errors
**Status**: 🔄 Pending

Files with `no-explicit-any` and unused vars:
- `src/modules/generation/actions.ts`
- `src/modules/generation/service.ts`
- `src/modules/invitations/actions.ts`
- `src/modules/organizations/actions.ts`
- `src/modules/llm/admin-actions.ts`
- `src/modules/llm/config.ts`
- `src/modules/image-generation/providers/openai.ts`
- `src/remotion/components/DynamicText.tsx`
- `src/modules/video-generation/service.ts`

---

## ✅ Completed Tasks

| Task | Completed | Notes |
|------|-----------|-------|
| Brand context enforcement | ✅ Dec 8 | Logo + colors in prompt |
| Brand requirement banner | ✅ Dec 8 | Shows when no brand selected |
| Brand preview in ProposedCopy | ✅ Dec 8 | Logo + palette display |
| Reference images preview | ✅ Dec 8 | Visible in chat panel |
| Professional system prompt | ✅ Dec 8 | Designer-grade guidance |
| Structured JSON prompt | ✅ Dec 8 | Layout/accessibility rules |

---

## 📝 Notes

- All refactors must maintain existing functionality
- Run `npm run lint && npm run build` after each major change
- Use TypeScript strict mode
- Follow existing naming conventions
- Keep backwards compatibility with existing sessions

---

*Auto-generated task list - Update status as tasks complete*
