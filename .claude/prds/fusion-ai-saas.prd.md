# Fusion AI — SaaS Platform

## Problem
Mechanical engineers and makers spend hours manually writing Fusion 360 Python scripts to automate 3D modeling tasks. The Fusion 360 Python API is complex, poorly documented, and error-prone. No existing tool provides AI-powered script generation for Fusion 360. This creates a significant barrier to productivity, especially for users who know what they want to build but lack Python scripting expertise.

## Evidence
- Assumption — needs validation via user research
- The SYSTEM_PROMPT currently covers 37 features with 100% syntax validation pass rate, proving the core AI generation works
- Stress tests confirm complex assemblies (gearbox, piston, drone frame) generate valid scripts
- No known competitor offering AI-to-Fusion 360 script generation

## Users
- **Primary**: Mechanical engineers and makers/hobbyists who use Fusion 360 for 3D modeling and want to automate repetitive tasks or create complex geometry without writing Python manually
- **Secondary**: CAD freelancers who need to deliver scripts fast
- **Not for**: Users of other CAD software (SolidWorks, AutoCAD) — Fusion 360 only for now

## Hypothesis
We believe **AI-powered Fusion 360 script generator** will **eliminate hours of manual Python scripting** for **mechanical engineers and makers**.
We'll know we're right when **50 users complete at least 3 successful model generations in their first week, and 20% convert to paid plan within 30 days**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Activation (3+ gen/week) | 50 users in first month | Backend analytics |
| Paid conversion | 20% within 30 days | Stripe/webhook events |
| Monthly active users | 200 by month 3 | Auth + usage logs |
| Generation success rate | >95% valid Python | validatePython() pipeline |

## Scope

**MVP — The minimum to test the hypothesis:**

1. **Next.js frontend** — Replace Vite React with Next.js (SSR, better SEO for landing page, API routes)
2. **Auth** — Login/register (NextAuth.js or Clerk)
3. **Usage quota per tier** — Track generations per user per month
4. **Billing** — Stripe subscription (global payment)
5. **Prompt history** — Save user's generation history per account
6. **AI provider abstraction** — Support multiple AI APIs (MiMo, Anthropic, OpenAI) with easy key rotation
7. **Landing page** — Marketing page with feature showcase
8. **Admin dashboard** — User management, usage analytics, revenue tracking

**Pricing tiers:**
| Tier | Price | Quota | Features |
|---|---|---|---|
| Free | $0 | 10 gen/month | Basic generation, history |
| Pro | $9/month | 200 gen/month | Priority queue, export |
| Business | $29/month | Unlimited | Team features, API access |

**Out of scope (for now):**
- Multi-CAD support (SolidWorks, AutoCAD) — too complex, focus on Fusion 360
- Real-time collaboration — not needed for single-user CAD workflow
- Mobile app — desktop-first, CAD users work on desktop
- Autodesk Marketplace plugin — approval process too long, web-only is more agile
- Custom model training — use existing AI APIs
- Offline mode — requires AI API connection

## Architecture Decisions
- **Frontend**: Next.js (SSR for landing page, API routes for backend)
- **Backend**: Next.js API routes OR keep Express.js as separate service
- **Database**: Supabase (PostgreSQL) or PlanetScale
- **Auth**: NextAuth.js or Clerk
- **Payments**: Stripe (global, well-documented, free to integrate)
- **AI Providers**: Abstract layer supporting MiMo, Anthropic, OpenAI — easy key rotation via admin dashboard
- **Deployment**: Vercel (frontend) + Railway/Fly.io (backend if separate)
- **Target market**: Global from day one (Fusion 360 users worldwide)

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Next.js Migration | Frontend migrated from Vite to Next.js with SSR landing page | pending | — |
| 2 | Auth System | Users can register, login, and have persistent accounts | pending | — |
| 3 | Database + History | User data, prompt history, and usage tracking persisted | pending | — |
| 4 | Usage Quota | Free/Pro/Business tiers enforced with monthly limits | pending | — |
| 5 | Stripe Billing | Users can subscribe, upgrade, cancel via Stripe | pending | — |
| 6 | AI Provider Abstraction | Support multiple AI APIs with easy key rotation | pending | — |
| 7 | Landing Page | Marketing page with features, pricing, testimonials | pending | — |
| 8 | Admin Dashboard | User management, usage analytics, revenue tracking | pending | — |

## Open Questions
- [ ] Should we keep Express.js backend as separate service or migrate to Next.js API routes?
- [ ] Which auth provider — NextAuth.js (free, self-hosted) vs Clerk (managed, easier)?
- [ ] Database — Supabase (free tier, realtime) vs PlanetScale (serverless MySQL)?
- [ ] How to handle multi-tenant Fusion 360 connections? (local addin per user)
- [ ] Should we add API access for Business tier? (REST API for developers)
- [ ] Email service for transactional emails (Resend, SendGrid, or Supabase Auth)?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Autodesk blocks or restricts API access | Low | High | Web-only approach, no marketplace dependency |
| AI API costs exceed revenue | Medium | Medium | Usage quotas, cost monitoring, provider rotation |
| Fusion 360 addin compatibility breaks | Medium | Medium | Version pinning, automated testing |
| Low conversion rate (<5%) | Medium | High | A/B test pricing, improve onboarding |
| Competitor enters market | Low | Medium | Move fast, build community, 37-feature coverage is moat |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*
