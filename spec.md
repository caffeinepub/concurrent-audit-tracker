# Concurrent Audit Tracker

## Current State

The app has:
- Loan entry form (LoanFormDialog) with borrower name, loan type, loan number, CERSAI applicable/done, Insurance applicable/done checkboxes
- Monthly report tab showing summary counts (CERSAI completed/pending, Insurance completed/pending, total loans)
- Backend `LoanEntry` type with boolean fields but no reason fields
- `getMonthSummary` query returns aggregate counts only
- No way to record why CERSAI or Insurance is not done
- Monthly report does not list individual pending loan accounts

## Requested Changes (Diff)

### Add
- `cersaiPendingReason` (optional text) field to `LoanEntry` — shown in form when CERSAI is applicable but NOT done
- `insurancePendingReason` (optional text) field to `LoanEntry` — shown in form when Insurance is applicable but NOT done
- New backend query `getPendingLoans(auditMonthId)` returning list of `PendingLoanRow` records (borrowerName, loanNumber, cersaiPending bool, insurancePending bool, cersaiReason text, insuranceReason text) for loans where either CERSAI or Insurance is pending
- Monthly Report: a "Pending Loans" table section below the summary counts, listing Borrower Name, Loan Number, pending type(s), and reason(s)

### Modify
- `addLoanEntry` and `updateLoanEntry` backend functions to accept two new optional text parameters: `cersaiPendingReason` and `insurancePendingReason`
- `LoanEntry` type in backend to include `cersaiPendingReason : Text` and `insurancePendingReason : Text`
- `LoanFormDialog`: conditionally show a text input for "Reason for CERSAI not done" when cersaiApplicable=true AND cersaiDone=false; same for insurance
- `backend.d.ts` updated to reflect new fields

### Remove
- Nothing removed

## Implementation Plan

1. Update `main.mo`:
   - Add `cersaiPendingReason : Text` and `insurancePendingReason : Text` to `LoanEntry` type
   - Add `PendingLoanRow` type for the pending loans query result
   - Update `addLoanEntry` and `updateLoanEntry` to accept and store the two reason fields
   - Add `getPendingLoans(auditMonthId)` query returning all loans where cersaiApplicable && !cersaiDone OR insuranceApplicable && !insuranceDone
2. Update `backend.d.ts` to reflect new fields and new query
3. Update `LoanFormDialog.tsx`:
   - Add `cersaiPendingReason` and `insurancePendingReason` to FormState
   - Show a Textarea input for CERSAI reason when cersaiApplicable=true AND cersaiDone=false
   - Show a Textarea input for Insurance reason when insuranceApplicable=true AND insuranceDone=false
   - Pass reasons to addLoanEntry / updateLoanEntry mutations
4. Update `useQueries.ts`:
   - Add `useGetPendingLoans` query hook
   - Update `useAddLoanEntry` and `useUpdateLoanEntry` to pass reason fields
5. Update `MonthlyReportTab.tsx`:
   - Fetch pending loans using `useGetPendingLoans`
   - Add a "Pending Loan Accounts" section after the summary, showing a table with Borrower Name, Loan Number, Pending Type (CERSAI / Insurance / Both), and Reason columns
