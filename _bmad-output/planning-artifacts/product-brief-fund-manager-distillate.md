---
title: "Product Brief Distillate: Fund Manager"
type: llm-distillate
source: "product-brief-fund-manager.md"
created: "2026-04-01"
purpose: "Token-efficient context for downstream PRD creation"
---

# Fund Manager — Product Brief Distillate

## Domain Context
- Bangladeshi group savings culture ("somiti" / "fund") — friends/family/colleagues pool fixed monthly amounts
- Extremely common practice, almost entirely managed manually (notebooks, WhatsApp, spreadsheets, trust)
- Primary currency: BDT (Bangladeshi Taka)
- Primary payment rails: bKash (dominant MFS), bank transfers, Nagad (secondary MFS)

## User & Role Model
- **Super Admin**: System owner (Awolf). Manages the platform, creates/oversees multiple groups, assigns Managers. Full audit access across all groups.
- **Manager**: Creates/owns a fund group. Configures group settings (contribution amount, fine rules). Manages membership. Assigns Treasurer.
- **Treasurer**: Operational role within a group. Verifies payments, applies/waives fines, tracks investments, generates reports. The primary daily user.
- **Member (Individual)**: Contributes monthly, submits payment proof, views personal dashboard and fund totals. Read-only on fund-level data.
- A single user can hold different roles across different groups (e.g., Manager in one group, Member in another)

## Core Payment Flow (Critical Path)
- Member pays externally via bKash or bank transfer
- Member logs payment in Fund Manager: month, amount, payment method, transaction ID, screenshot (required)
- Status: PENDING
- Treasurer reviews: approves (VERIFIED) or rejects with reason (REJECTED)
- Rejected → member can resubmit with corrected info
- Duplicate transaction ID detection prevents fraud/mistakes

## Fine Engine Rules
- Configurable per group (default: 100 BDT fine, 15th of month deadline)
- Fine applies based on **submission date in system**, NOT manager verification date — prevents unfair penalties from slow verification
- Fine accumulates per missed month (miss 3 months = 3x contribution + 3x fine)
- Treasurer can waive fines with mandatory reason (logged in audit trail)
- Auto-calculated by system, not manual

## Group Configuration (Per Group)
- Monthly contribution amount (default 1000 BDT, configurable)
- Fine amount (default 100 BDT, configurable)
- Fine deadline day (default 15th, configurable)
- Member onboarding via shareable invite link

## Investment Tracking (Phase 2)
- Three asset types: stocks, shares, land
- Stocks/shares: company, units, buy price, current value, buy/sell dates, profit/loss
- Land: location, purchase price, documents, estimated current value, ownership %
- All investments track: amount from fund, date, status (Active/Sold/Matured), returns, who approved
- Current value updated manually by Treasurer
- Visible to all group members (read-only)

## Loan Module (Future — Not MVP)
- Architecture should support it from day one (data model ready)
- Borrower must be a group member
- Variable interest rate (monthly/annual, simple/compound — configurable)
- Repayment schedule tracking
- Status flow: Requested → Approved → Active → Repaid → Defaulted
- Approval by Manager/Treasurer, Super Admin override

## Dashboard Requirements
- **Member dashboard**: personal contributions history, pending payments, fines (outstanding/paid/waived), total fund balance (read-only)
- **Treasurer dashboard**: current month payment status grid (green/yellow/red per member), pending verification queue, fine summary, fund balance, monthly/yearly reports
- **Manager dashboard**: group configuration, membership management, Treasurer assignment, all Treasurer capabilities
- **Super Admin dashboard**: all groups overview, Manager assignment, cross-group audit logs, system configuration

## Key Technical Decisions Surfaced
- Screenshot upload is REQUIRED — needs file storage infrastructure (S3 or equivalent)
- Fine auto-calculation needs a scheduled job/cron (runs daily or on submission check)
- Multi-group from day one — requires proper data isolation, role resolution per group
- Audit log: every financial operation logged with who, what, when, why — tamper-evident
- Web platform, responsive design for mobile browsers (no native app in MVP)

## Suggested Features (From Review — Not Yet Confirmed for Scope)
- WhatsApp share button on payment receipt (trust signal + distribution)
- Treasurer handover report (one-click summary when role changes) — Phase 2
- Fund health indicator (red/amber/green collection rate) — Phase 2
- Monthly summary notification/digest to members
- Configurable Nagad support alongside bKash
- Member reliability score (on-time payment history) — future
- Expense splitting within the group — future

## Rejected / Out of Scope Decisions
- No direct bKash/Nagad API integration in MVP — members pay externally, log in system
- No mobile native app — responsive web only
- No SMS/email reminders in MVP
- No loan module in MVP (but data model supports it)
- No PDF/Excel export in MVP
- No multi-currency support
- No advanced investment analytics (ROI, portfolio optimization)

## Competitive Landscape Notes
- Splitwise: expense splitting, not group fund management. No verification workflow, no fines, no investments.
- No known purpose-built Bangladeshi group fund management tool in the market
- Microfinance orgs (BRAC, Grameen) run similar programs at institutional scale — potential future B2B angle
- bKash/Nagad API ecosystem actively seeking fintech integrations — future partnership opportunity

## Open Questions for PRD
- Authentication method: email/password? Phone/OTP? Social login?
- Should members see other members' payment status, or only their own + fund total?
- What happens when a member leaves mid-cycle? Forfeit, partial refund, or group decides?
- Should there be a group chat or announcement feature, or rely on external WhatsApp?
- Investment decision approval workflow — does it need voting/consensus, or Manager/Treasurer decides?

## Success Signals
- Treasurer time savings (target: 75%+ reduction in admin work)
- Payment submission adoption (target: 90%+ within 2 months)
- Verification turnaround (target: under 48 hours)
- Fine accuracy (target: 100% correct auto-calculations)
- Member self-service ("did I pay?" queries to treasurer drop to near-zero)
