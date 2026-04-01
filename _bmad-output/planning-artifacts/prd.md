---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success']
inputDocuments: ['product-brief-fund-manager.md', 'product-brief-fund-manager-distillate.md']
workflowType: 'prd'
documentCounts:
  briefs: 2
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: web_app
  domain: fintech
  complexity: high
  projectContext: greenfield
designReference: 'Dashboard UI with dark sidebar, white content area, summary cards, revenue chart, transaction table'
---

# Product Requirements Document - Fund Manager

**Author:** Awolf
**Date:** 2026-04-01

## Executive Summary

Fund Manager is a web-based group savings management platform built for the Bangladeshi "somiti" model — where circles of friends or community members contribute a fixed monthly amount into a shared pool. The platform replaces notebooks, spreadsheets, and WhatsApp-based tracking with a structured system where every taka is logged, every payment is verified with proof, and every member can see exactly where the fund stands.

The core workflow mirrors how group funds actually operate: members pay via bKash or bank transfer, submit a payment form with transaction ID and screenshot proof, and a designated treasurer verifies each contribution. Late fines are auto-calculated based on configurable per-group rules. The system supports multiple independent fund groups, four distinct roles (Super Admin, Manager, Treasurer, Member), and maintains a tamper-evident audit trail across all financial operations.

The platform targets a gap with no known purpose-built solution: informal group savings in Bangladesh are culturally widespread but managed entirely through trust and manual processes. Fund Manager exists because group funds don't collapse from malice — they collapse from opacity. Make every taka visible and traceable, and trust takes care of itself.

### What Makes This Special

- **Purpose-built for the somiti model** — not a generic expense splitter adapted to fit. The payment verification workflow (pay externally → submit proof → treasurer verifies) reflects exactly how these groups work in practice.
- **Tamper-evident audit trail** — every contribution, fine, waiver, and investment is logged with who, what, when, and why. In a culture where fund mismanagement ruins friendships, this is the core value proposition.
- **Automated fine engine** — configurable deadline and amount per group, calculated on member submission date (not verification date), eliminating both manual tracking burden and unfair penalties.
- **Member transparency** — read-only visibility into fund balance, payment status, and investments removes the information asymmetry that breeds suspicion.
- **Multi-group architecture** — users can manage or belong to multiple fund groups with different contribution amounts, scaling from one friend circle to many.

## Project Classification

| Attribute | Value |
|-----------|-------|
| **Project Type** | Web Application (SPA, responsive) |
| **Domain** | Fintech — group fund management |
| **Complexity** | High — financial data integrity, RBAC across multi-group, audit requirements, future regulatory considerations |
| **Project Context** | Greenfield — new build, no existing codebase |
| **Design Direction** | Dark sidebar navigation, white content area, summary stat cards, data charts, transaction tables (per reference UI) |

## Success Criteria

### User Success

- **Members never ask "did I pay?"** — the dashboard answers it instantly with full payment history, status, and fine visibility
- **Treasurer's monthly workload drops to under 15 minutes** — verification queue replaces manual tracking, chasing, and record-keeping
- **Zero disputes** about payment status, fines, or fund balance — automated calculations and audit trail eliminate ambiguity
- **90%+ members submitting payments through the system** within 2 months of launch (vs paying externally and not logging it)

### Business Success

- **Full adoption by Awolf's primary fund group (10+ members)** as proof of concept
- **All monthly contributions tracked digitally** — no parallel paper/WhatsApp records needed
- **System becomes the single source of truth** — group decisions reference Fund Manager data, not personal memory
- **Platform stable enough to onboard a second fund group** within 6 months

### Technical Success

- **100% fine calculation accuracy** — zero tolerance for financial computation errors
- **99% uptime during payment windows** (1st–15th of each month is critical; brief downtime outside this window is acceptable)
- **Page load under 2 seconds** on average Bangladeshi mobile connections (3G/4G)
- **Screenshot uploads handled reliably** — no lost payment proof
- **Complete audit trail** — every financial operation logged, no gaps
- **Data isolation between groups** — no cross-group data leakage

### Measurable Outcomes

| Metric | Target | Measurement |
|--------|--------|-------------|
| Payment submission adoption | 90%+ via app | % of contributions submitted digitally vs offline |
| Verification turnaround | < 48 hours | Avg time from submission to treasurer action |
| Fine accuracy | 100% | Automated test suite + monthly manual audit |
| Treasurer time | < 15 min/month | Self-reported comparison to manual process |
| Payment disputes | Zero | Count of contested payments/fines per quarter |
| System uptime | 99% (1st–15th critical) | Monitoring during payment windows |

## Product Scope

### MVP — Minimum Viable Product

- User registration and authentication (email/password)
- Multi-group creation, configuration, and management
- Role-based access control: Super Admin, Manager, Treasurer, Member
- Group invite link for member onboarding
- Monthly contribution submission form (month, amount, bKash/bank, transaction ID, screenshot — required)
- Treasurer verification workflow (approve/reject with reason)
- Payment rejection → member resubmission flow
- Duplicate transaction ID detection
- Automatic late fine calculation (configurable amount + deadline per group, based on submission date)
- Fine waiver with mandatory reason (audit logged)
- Member dashboard: personal contributions, fines, fund total balance
- Treasurer dashboard: payment status grid (green/yellow/red), pending verification queue, fine summary, fund balance
- Manager dashboard: group config, membership management, treasurer assignment
- Super Admin dashboard: all groups overview, manager assignment, cross-group audit logs
- Full audit log for all financial operations
- Responsive web design for mobile browsers

### Growth Features (Post-MVP)

- Investment tracking: stocks, shares, land (CRUD with manual value updates)
- Treasurer handover report (one-click summary for role transitions)
- Fund health indicator (collection rate at a glance — red/amber/green)
- WhatsApp share button on payment receipts
- Monthly summary notifications/digest to members
- Nagad payment method support alongside bKash
- PDF/Excel report export

### Vision (Future)

- Loan module with variable interest rates and repayment schedules
- Direct bKash/Nagad API integration (pay without leaving the app)
- SMS/email payment reminders (auto-ping on the 10th)
- Member reliability score (on-time payment history)
- Advanced investment analytics (ROI, portfolio performance)
- Multi-tenant SaaS with self-service group creation
- Partnership with microfinance organizations (B2B angle)
