---
title: "Product Brief: Fund Manager"
status: "complete"
created: "2026-04-01"
updated: "2026-04-01"
inputs: ["conversation analysis with user"]
---

# Product Brief: Fund Manager

## Executive Summary

Fund Manager is a web-based platform for managing group savings funds — a common practice in Bangladesh where circles of friends or community members contribute a fixed monthly amount into a shared pool. Today, these groups rely on scattered WhatsApp messages, paper ledgers, and personal trust to track who paid, who's late, and where the money went. As groups grow and investments enter the picture, this breaks down — disputes arise, transparency erodes, and treasurers burn out.

Fund Manager brings structure, transparency, and accountability to group savings. Every taka is logged, every decision is traceable, and every member can see exactly where the fund stands — no questions, no arguments. Members submit payment proof digitally, managers verify contributions with a click, late fines are calculated automatically, and investments are tracked transparently. The platform supports multiple independent fund groups under a single system, with configurable contribution amounts and fine rules per group.

## The Problem

Group savings (somiti/fund) is deeply embedded in Bangladeshi culture — friends, family, and colleagues pool money monthly for collective benefit. But managing these funds is a nightmare:

- **No single source of truth.** Payment records live in notebooks, spreadsheets, or someone's memory. "Did Rahim pay for March?" becomes a recurring argument.
- **Late payments are unenforceable.** Without automated tracking, fines are inconsistently applied or forgotten entirely. This breeds resentment among punctual members.
- **Treasurers are overloaded.** One person manually tracks 10+ payments monthly, chases late payers, and somehow also manages investments — with zero tooling. Fund Manager turns that weekly headache into a 10-minute verification session.
- **Investment tracking is nonexistent.** Groups invest in stocks, shares, or land, but returns and current value are opaque to members who contributed the capital.
- **Trust erodes over time.** Without transparency, suspicion grows — even among close friends. This is the #1 reason group funds collapse. The system makes disputes nearly impossible — automated fines with logged waivers mean no one can argue "I didn't know" or "the treasurer is playing favorites."

## The Solution

Fund Manager is a web application that digitizes the entire lifecycle of a group savings fund:

**For Members:**
- Submit monthly payments via bKash or bank transfer, then log the transaction with a simple form (amount, method, transaction ID, screenshot proof required)
- View personal contribution history, outstanding dues, and fine status at a glance
- See the total fund balance and investment status — full transparency without needing to ask the treasurer
- Shareable payment receipt — after submission, generate a summary card to share on WhatsApp as a confirmation and trust signal

**For Treasurers:**
- One-click verification queue — review submitted payments (with screenshot proof), approve or reject with reason
- Automatic late fine calculation — system applies configurable fine (default 100 BDT) for payments not submitted by the 15th, with ability to waive (with logged reason)
- Investment portfolio tracking — log investments (stocks, shares, land), track current value, record returns
- Monthly/yearly reports and member payment status grid (green/yellow/red) at a glance
- Treasurer handover report — one-click summary of all-time contributions, balances, fines, and investments for when the role changes hands

**For Managers:**
- Create and configure fund groups (contribution amount, fine amount, fine deadline — all per group)
- Manage group membership — add/remove members, assign Treasurer role
- Oversight of all group operations with full audit trail

**For Super Admins:**
- Manage multiple independent fund groups from a single dashboard
- Assign Managers per group
- Full audit trail across all groups — every action logged with who, what, when, and why

## What Makes This Different

This isn't a generic expense splitter like Splitwise — it's purpose-built for the **Bangladeshi group fund model** with its specific mechanics:

- **Tamper-evident audit trail** — every taka logged, every decision traceable. In a culture where fund collapses ruin friendships, this is the entire emotional pitch.
- **Payment verification workflow** — reflects the real-world process where money moves through bKash/bank first, then gets logged and verified. Not just "mark as paid."
- **Automated fine engine** — configurable deadline and fine amount per group, baked into the system. Fine based on member's submission date, not manager's verification date — no unfair penalties from slow verification.
- **Member transparency** — read-only fund balance and investment visibility removes the information asymmetry that breeds suspicion. Members see everything without asking.
- **Multi-group architecture** — one person can manage or belong to multiple fund groups with different contribution amounts. The system scales from one friend circle to many.
- **Future-ready loan module** — data model supports member loans with variable interest rates when the group is ready for it.

## Who This Serves

**Primary: The Treasurer**
The person doing the hardest job — collecting money, tracking payments, managing investments, fielding "did I pay?" questions. Fund Manager turns their weekly headache into a 10-minute verification session.

**Secondary: Fund Members**
Friends who contribute monthly and want to know their money is being tracked properly. They need a simple dashboard showing their status and the fund's health — nothing more.

**Tertiary: Manager / Super Admin**
The people who create groups, manage membership, and maintain oversight. They need configuration control and cross-group visibility.

## Success Criteria

| Metric | How to Measure | Target |
|--------|---------------|--------|
| Payment submission adoption | % of members submitting via app vs offline | 90%+ within 2 months |
| Verification turnaround | Avg hours from submission to verification | Under 48 hours |
| Fine accuracy | Manual audits of auto-calculated fines | 100% correct calculations |
| Treasurer time savings | Self-reported before/after comparison | 75%+ reduction in admin time |
| Member self-service | "Did I pay?" queries to treasurer (should drop to near-zero) | Tracked informally |

## Scope

### In Scope (MVP)

**Core (must-have for day one):**
- User registration and authentication
- Multi-group creation and management (create/join multiple groups)
- Role-based access: Super Admin, Manager, Treasurer, Member
- Monthly contribution submission (bKash/bank + transaction ID + required screenshot upload)
- Manager/Treasurer verification workflow (approve/reject with reason)
- Automatic late fine calculation (configurable amount + deadline per group)
- Fine based on submission date, not verification date
- Fine waiver with audit trail
- Member dashboard (personal contributions, fines, fund total)
- Treasurer dashboard (payment status grid, pending verifications, fund summary)
- Audit log for all financial operations
- Duplicate transaction ID detection
- Group invite link for member onboarding
- Payment rejection → member resubmission flow

**Phase 2 (shortly after MVP):**
- Investment tracking (stocks, shares, land — basic CRUD with manual value updates)
- Treasurer handover report
- Fund health indicator (collection rate at a glance)

### Out of Scope (Future)
- Loan module (variable interest, repayment schedules) — architecture supports it, not built yet
- SMS/email payment reminders and monthly digest notifications
- Mobile app (web-first, responsive design for mobile browsers in MVP)
- Payment gateway integration (direct bKash/Nagad API)
- Advanced investment analytics (ROI calculations, portfolio optimization)
- PDF/Excel report export
- Member reliability score (on-time payment history)
- Expense splitting within the group

## Vision

If Fund Manager succeeds for one friend group, it becomes the go-to platform for anyone in Bangladesh running a group fund. The natural expansion path:

1. **Personal tool** — Awolf's fund group, proving the concept with core payment tracking
2. **Full-featured tool** — Investment tracking, multi-group, handover reports
3. **Platform** — Multi-tenant SaaS with group creation, member invitations, and self-service onboarding
4. **Financial ecosystem** — Loan module, automated bKash/Nagad collection via API, partnership with microfinance organizations, and regulatory compliance

The cultural practice of group saving isn't going away — it just needs better tooling. Fund Manager is that tool.
