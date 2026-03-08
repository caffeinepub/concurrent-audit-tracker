import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PendingLoanRow {
    id: bigint;
    sNo: bigint;
    cersaiPending: boolean;
    cersaiPendingReason: string;
    insurancePendingReason: string;
    insurancePending: boolean;
    loanNumber: string;
    borrowerName: string;
}
export interface LoanEntry {
    id: bigint;
    sNo: bigint;
    insuranceDone: boolean;
    insuranceApplicable: boolean;
    cersaiDone: boolean;
    loanType: string;
    cersaiApplicable: boolean;
    cersaiPendingReason: string;
    insurancePendingReason: string;
    auditMonthId: bigint;
    loanNumber: string;
    borrowerName: string;
}
export interface LoanEntryStatus {
    cersaiPending: bigint;
    insuranceApplicable: bigint;
    insuranceCompleted: bigint;
    totalLoans: bigint;
    cersaiApplicable: bigint;
    cersaiCompleted: bigint;
    insurancePending: bigint;
}
export interface UserProfile {
    name: string;
}
export interface AuditMonth {
    id: bigint;
    status: Status;
    createdAt: bigint;
    monthName: string;
}
export enum Status {
    closed = "closed",
    open = "open"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addLoanEntry(auditMonthId: bigint, borrowerName: string, loanType: string, loanNumber: string, cersaiApplicable: boolean, cersaiDone: boolean, cersaiPendingReason: string, insuranceApplicable: boolean, insuranceDone: boolean, insurancePendingReason: string): Promise<LoanEntry>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearLoansForMonth(auditMonthId: bigint): Promise<void>;
    closeAuditMonth(id: bigint): Promise<void>;
    createAuditMonth(monthName: string): Promise<AuditMonth>;
    /**
     * / New function to delete an audit month and all associated loan entries.
     */
    deleteAuditMonth(auditMonthId: bigint): Promise<void>;
    deleteLoanEntry(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMonthSummary(auditMonthId: bigint): Promise<LoanEntryStatus>;
    getPendingLoans(auditMonthId: bigint): Promise<Array<PendingLoanRow>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listAuditMonths(): Promise<Array<AuditMonth>>;
    listLoansByMonth(auditMonthId: bigint): Promise<Array<LoanEntry>>;
    /**
     * / New function to rollover pending loans from one month to another.
     */
    rolloverPendingLoans(fromMonthId: bigint, toMonthId: bigint): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateLoanEntry(id: bigint, borrowerName: string, loanType: string, loanNumber: string, cersaiApplicable: boolean, cersaiDone: boolean, cersaiPendingReason: string, insuranceApplicable: boolean, insuranceDone: boolean, insurancePendingReason: string): Promise<void>;
}
