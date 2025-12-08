# Pending Tasks - Admotion AI

**Last Updated:** December 8, 2025 08:00 UTC+6

This document tracks all pending tasks and improvements for the Admotion AI platform.

---

## 🔴 High Priority

### Facebook Tracking System
- [ ] Apply database migration `20251208100000_add_facebook_tracking.sql` to Supabase
- [ ] Create Facebook Developer App with Marketing API access
- [ ] Configure `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` environment variables
- [ ] Test OAuth flow end-to-end
- [ ] Add Facebook Pixel installation verification (check if pixel is firing on website)
- [ ] Implement automatic CAPI event sending from form submissions
- [ ] Add browser-side event tracking script generation

### Image Generator
- [ ] Fix JSX errors in Proposed Ad Copy block (image-generator.tsx)
- [ ] Enforce brand kit requirement before generating images
- [ ] Include brand logo in image generation prompts
- [ ] Refactor image-generator.tsx into smaller components (~1300 lines currently)

### Video Generator
- [ ] Similar refactoring needed for video-generator.tsx
- [ ] Add video thumbnail generation
- [ ] Implement video download functionality

---

## 🟡 Medium Priority

### Tracking AI Enhancements
- [ ] Add TikTok Pixel integration
- [ ] Add LinkedIn Insight Tag integration
- [ ] Implement cross-platform event deduplication
- [ ] Add real-time event monitoring dashboard
- [ ] Create automated tracking plan execution for Facebook

### Brand Optimizer
- [ ] Complete BrandPro 2.0 tab rename and reorder (Analyzer → Brand Kit → Brand Memory)
- [ ] Auto-create brand kit and brand memory on analyze
- [ ] Ensure deletion removes stored memory from Supabase storage

### UI/UX Improvements
- [ ] Fix chat rendering in image ads page
- [ ] Organize chat layout and show history properly
- [ ] Add loading skeletons to all data-fetching components
- [ ] Implement proper error boundaries

### Database & Performance
- [ ] Add database indexes for frequently queried columns
- [ ] Implement connection pooling optimization
- [ ] Add caching layer for brand kit data
- [ ] Optimize image/video generation job polling

---

## 🟢 Low Priority / Nice to Have

### Analytics & Reporting
- [ ] Create unified analytics dashboard
- [ ] Add conversion attribution reporting
- [ ] Implement A/B testing framework for ads
- [ ] Add ROI tracking and reporting

### Integrations
- [ ] Google Ads conversion import
- [ ] Shopify integration for e-commerce tracking
- [ ] WordPress plugin for easy pixel installation
- [ ] Zapier integration for workflow automation

### AI Improvements
- [ ] Train custom models on ad performance data
- [ ] Implement ad copy A/B testing suggestions
- [ ] Add competitor ad analysis
- [ ] Create AI-powered budget optimization

### Documentation
- [ ] Update ARCHITECTURE.md with Facebook tracking details
- [ ] Create API documentation with Swagger/OpenAPI
- [ ] Add developer onboarding guide
- [ ] Create video tutorials for key features

---

## 🐛 Known Bugs

### Critical
- [ ] None currently identified

### Major
- [ ] Image generator JSX parsing errors in Proposed Ad Copy section
- [ ] Some lint warnings in auth pages (unused variables)

### Minor
- [ ] Unused imports in various files (cleanup needed)
- [ ] `@remotion/zod-types` peer dependency conflict with zod v4

---

## 📋 Technical Debt

### Code Quality
- [ ] Refactor large component files (>400 lines)
- [ ] Add comprehensive unit tests for services
- [ ] Add integration tests for API routes
- [ ] Implement E2E tests with Playwright

### Security
- [ ] Audit all API routes for proper authentication
- [ ] Add rate limiting to public endpoints
- [ ] Implement CSRF protection
- [ ] Add security headers

### DevOps
- [ ] Set up CI/CD pipeline
- [ ] Add automated testing in GitHub Actions
- [ ] Implement staging environment
- [ ] Add monitoring and alerting (Sentry, etc.)

---

## 📅 Completed Recently

### December 8, 2025
- [x] Facebook Pixel and Conversions API tracking system
  - OAuth authentication
  - Pixel management and selection
  - CAPI event sending with SHA-256 hashing
  - Event mapping system
  - Event testing tools
  - Health monitoring dashboard
  - AI-driven event suggestions

### Previous
- [x] Video generation module with Sora and Veo
- [x] Image generation module with GPT-Image and Gemini
- [x] Platform-specific ad generation presets
- [x] Ad Library for AI training
- [x] Brand Kit and Brand Memory system
- [x] Google Ads MCP integration
- [x] Google Analytics MCP integration
- [x] Google Tag Manager integration

---

## 📝 Notes

### Environment Variables Needed
```env
# Facebook (NEW)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Existing
OPENAI_API_KEY=
GOOGLE_GEMINI_API_KEY=
GOOGLE_GEMINI_VEO_API_KEY=
NANO_BANANA_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Database Migrations Pending
1. `20251208100000_add_facebook_tracking.sql` - Facebook tracking tables

### File Size Concerns
- `src/components/image-ads/image-generator.tsx` - ~1300 lines (needs refactoring)
- `src/components/video-ads/video-generator.tsx` - Large file (needs refactoring)
