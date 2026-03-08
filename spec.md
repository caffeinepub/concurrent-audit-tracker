# Concurrent Audit Tracker

## Current State
The app tracks monthly concurrent audit loan compliance. It has:
- AuditMonth records (create, list, close, delete)
- LoanEntry records per month (add, edit, delete, list)
- Monthly summary: CERSAI/Insurance applicable, completed, pending counts
- Pending loans list with borrower name, loan number, and reasons for non-compliance
- PDF report via browser print
- Clear loan data and Close Month actions

## Requested Changes (Diff)

### Add
- `rolloverPendingLoans(fromMonthId: Nat, toMonthId: Nat): async Nat` backend function that:
  - Reads all loan entries from `fromMonthId` where CERSAI is pending (applicable=true, done=false) OR Insurance is pending (applicable=true, done=false)
  - Copies those entries into `toMonthId`, preserving borrowerName, loanType, loanNumber, cersaiApplicable, insuranceApplicable, and the existing pendingReason fields
  - Sets cersaiDone=false for entries where cersai was pending; sets insuranceDone=false for entries where insurance was pending
  - Assigns sequential sNo values continuing from existing entries in the target month
  - Returns the count of rolled-over entries
- "Rollover Pending" button in MonthsDashboard next to each month card (only for OPEN months)
- Rollover dialog: user selects a target month (another OPEN month) to roll pending loans into, then confirms
- Alternatively, when creating a new month, offer an optional "Roll over pending from..." dropdown to auto-populate the new month with pending loans from a selected source month
- In MonthlyReportTab, show a "Rolled Over from [Month]" badge/note on loans that were rolled over (optional visual indicator — can be done purely frontend by tracking rollover state)

### Modify
- MonthsDashboard: Add a "Rollover" action per month card — clicking opens a dialog to pick a destination month and execute the rollover
- useQueries.ts: Add `useRolloverPendingLoans` mutation hook
- New Month creation dialog: add optional "Copy pending from previous month" dropdown so rollover can happen at month creation time

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate Motoko backend adding `rolloverPendingLoans(fromMonthId, toMonthId)` function
2. Update `backend.d.ts` with new function signature (auto-generated)
3. Add `useRolloverPendingLoans` mutation to `useQueries.ts`
4. Update `MonthsDashboard` New Month dialog to include an optional "Roll over pending from" select dropdown; after month creation, if a source month was selected, call rollover automatically
5. Add a standalone "Rollover" button on each month card (opens a dialog to pick destination month)
6. Show rollover count in success toast
