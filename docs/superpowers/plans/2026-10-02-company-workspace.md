# Company Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure multi-company income/expense workspace with owner/admin roles and in-app invitations.

**Architecture:** Keep company finance in dedicated MongoDB collections. Centralize role decisions in a pure permission module and enforce membership inside every Server Action. Render a protected App Router page backed by a responsive client workspace.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Mongoose, Better Auth, Tailwind CSS, Lucide React.

## Global Constraints

- Personal finance data must remain separate.
- Owners manage companies and admins; admins manage finance records only.
- Invitations are accepted or rejected inside the app; no email is sent.
- The UI follows the existing DailyM dark/lime design.

---

### Task 1: Permission rules

**Files:** Create `src/lib/company-permissions.ts`; test `tests/company-permissions.test.mjs`.

- [ ] Write failing tests for owner/admin capabilities and company period filtering.
- [ ] Run the focused test and confirm missing-module failure.
- [ ] Implement role and period helpers.
- [ ] Run the focused test and confirm pass.

### Task 2: Company persistence and actions

**Files:** Create `src/models/Company*.ts`; create `src/actions/company.ts`.

- [ ] Add separate company, member, invitation, account, category and transaction schemas with indexes.
- [ ] Add authenticated workspace reads and company creation.
- [ ] Add owner-only invitations, responses, admin removal and company deletion.
- [ ] Add member finance CRUD with account/category ownership validation.

### Task 3: Company page

**Files:** Create `src/app/company/page.tsx`; create `src/components/company/CompanyWorkspace.tsx`; modify `src/components/dashboard/DashboardView.tsx`.

- [ ] Add protected company route and dashboard navigation.
- [ ] Add company selector, creation state and incoming invitations.
- [ ] Add summary cards, date filters, transaction form/history, accounts, categories and admin management.
- [ ] Ensure 44px touch targets, visible labels, loading feedback and responsive layout.

### Task 4: Verification

**Files:** All files above.

- [ ] Run focused permission tests.
- [ ] Run TypeScript and production build.
- [ ] Run `git diff --check` and review the final diff.
