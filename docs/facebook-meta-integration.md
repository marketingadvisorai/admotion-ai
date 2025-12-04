# Meta Business Integration Plan

This document outlines how to connect our Business Manager to partner Business Managers, request Page access, and use the Graph/Marketing APIs (including Insights and Reels Ads). It also lists exactly what we need from you to proceed.

## What we need from you
- Business info: Primary Business Manager ID (our BM) and the partner BM IDs we must connect to; confirmation you are an admin in our BM.
- App details: App ID/secret and access to the Meta app in the same BM; approved domains/redirect URIs; whether the app is in Live mode.
- Permissions to pursue in App Review: `ads_read`, `ads_management` (if we need to create/edit ads), `business_management`, `pages_show_list`, `pages_read_engagement`, `pages_read_user_content`, `pages_manage_metadata`, `pages_manage_ads` (for boosting via Pages), `pages_manage_posts`/`instagram_basic`/`instagram_content_publish` if we need publishing, and `leads_retrieval` if we will pull leads.
- Assets to target: Ad Account IDs (act_<id>), Page IDs, Instagram Business Account IDs, Pixels/Conversions API details, Catalog IDs (if any), and which assets should be shared with which partner.
- Roles and contacts: Admin contact in each partner BM who can accept partner/asset share requests; which people should have access in the UI.
- Security/compliance: Data retention limits, logging requirements, encryption expectations, and where we may store tokens/data.

## Key APIs and surfaces
- Graph API: Core surface; versioned (v24.0). Used for Pages, Business objects, and insights.
- Marketing API: Ad accounts, campaigns/ads, Insights (`/{ad_account_id}/insights`), creatives (including Reels Ads), and Webhooks.
- Pages API: Page access tokens, Page insights (`/{page_id}/insights`), Page conversations, and publishing (if needed).
- Reels Ads: Built via Marketing API creatives with Reels placement; requires Instagram actor ID and ad account permissions.
- Insights refs: Marketing insights docs, Graph insights docs, Page insights metrics. Use the smallest field set needed to reduce cost/latency.

## Access models to choose
- User-based tokens (recommended for initial “lower access”): Users grant scopes via OAuth. Flow: short-lived user token -> long-lived user token -> Page tokens -> insights/ads read. Needs App Review for non-standard scopes.
- System User tokens (server-to-server, for production scale): Requires Business verification, app in Live mode, and `business_management`. Create a System User under our BM, assign assets/roles, generate token with required permissions. Longer lived but tied to BM assets only.

## Connecting Business Managers (partner access)
- BM-to-BM is done via Partner sharing: In Business Settings → Users → Partners → Add → Give a partner access to your assets → enter partner BM ID → choose assets (Ad Accounts, Pages, Pixels, Catalogs) and permissions. Partner admin must accept.
- If automated, use Business endpoints (`/{business-id}/partners`, `/{business-id}/partner_integrations`) but Meta often expects manual partner approval. Keep a named admin contact to accept promptly.
- For shared Pages: After partner is added, grant Page access (at least `Partial access` with `View performance` for read-only; add `Create/manage` for publishing/ads).
- For shared Ad Accounts: Grant `Ad account analyst` for read-only insights; `Advertiser`/`Admin` if we need to create ads.

## Page access and tokens (minimal path)
1) OAuth login with scopes: `pages_show_list`, `pages_read_engagement`, `pages_read_user_content`, `pages_manage_metadata`, `ads_read`, `business_management` (if we must list assets across BM). Add `pages_manage_posts`/`pages_manage_ads` only if publishing/boosting is required.  
2) Exchange the code for a short-lived user token, then for a long-lived user token.  
3) Call `GET /me/accounts` (or `/{user-id}/accounts`) to fetch Pages + Page access tokens.  
4) Store Page tokens securely; map Page ID to BM/Ad Account. Rotate when users revoke access.  
5) For Instagram insights tied to a Page, also read `instagram_business_account` from the Page object.

## Marketing Insights basics
- Ad Account insights: `GET https://graph.facebook.com/v24.0/act_<AD_ACCOUNT_ID>/insights?fields=impressions,clicks,spend,actions,action_values,cpc,cpm,ctr&time_range[since]=YYYY-MM-DD&time_range[until]=YYYY-MM-DD&level=ad` (add `breakdowns=age,gender,device` sparingly).
- Page insights: `GET /<PAGE_ID>/insights?metric=page_impressions,page_engaged_users,page_video_views` (ensure scopes above).  
- Rate limits: Respect `X-App-Usage`/`X-Page-Usage`; batch requests where safe; prefer async jobs for larger date ranges.

## Reels Ads creative notes
- Use Marketing API `adcreatives` with Reels placement (e.g., `publisher_platforms=['instagram']`, `instagram_positions=['reels']`).  
- `object_story_spec` needs `instagram_actor_id` (linked to the Page) and video asset ID uploaded via `advideo`.  
- Requires ad account permission + `ads_management`; asset sharing must include the IG account.

## Recommended architecture
- Identity/Consent service: Handles OAuth, token exchange, and permission prompts; records granted scopes and user who granted them.
- Asset linker: Maps user → Page(s) → Ad Accounts/Pixels/Catalogs; records which BM owns each asset and whether access is partner-shared or direct.
- Token vault: Encrypts long-lived user/Page tokens and System User tokens; rotates and monitors revocations.
- Data pipeline: Background workers to pull Insights (Ad Account + Page) on schedules; backfills in day-sized slices; retries with rate-limit backoff.
- API gateway: Thin wrapper to call Graph/Marketing API with version pinning (v24.0), logging request IDs, and feature-flagging new scopes.
- Webhooks (optional but recommended): Subscribe to `page`, `ads` changes to reduce polling; requires reachable callback URL and verification token.

## Permission strategy (“start low, grow”)
- Phase 1 (read-only): Request only `ads_read`, `pages_show_list`, `pages_read_engagement`, `pages_read_user_content`, `pages_manage_metadata`. Use user tokens. Gain App Review for these if needed.
- Phase 2 (server-to-server): Add `business_management` and move to System User tokens for stability. Use partner sharing to bind assets.
- Phase 3 (publishing/ads creation): Add `pages_manage_posts`, `pages_manage_ads`, `ads_management`, `instagram_content_publish` only if required by roadmap.

## Operational considerations
- Versioning: Pin to v24.0 and set a quarterly bump routine. Watch deprecations in changelogs.  
- Error handling: Handle 190/102 (token issues), 200 (permission), 613 (rate limit), 17/32 (throttle), and expired sessions.  
- Compliance: Store tokens encrypted; minimum retention for raw event data per client agreement; honor user deletions/revocations.  
- Auditability: Log Graph `x-fb-trace-id`/`x-fb-rev` per request; keep request/response samples for debugging.

## Next steps checklist
- Provide the items in **What we need from you**.  
- Decide if initial rollout is user-token only (recommended) or if we should set up a System User now.  
- Identify partner BM admins and target assets to share.  
- Confirm which scopes to submit for App Review in Phase 1.  
- Once confirmed, we will script onboarding (OAuth, token exchange, asset mapping) and create sample Insight pulls against a test Ad Account/Page.
