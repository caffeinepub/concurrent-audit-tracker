import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  public type Status = { #open; #closed };

  public type LoanEntryStatus = {
    cersaiCompleted : Nat;
    cersaiPending : Nat;
    insuranceCompleted : Nat;
    insurancePending : Nat;
    totalLoans : Nat;
  };

  public type PendingLoanRow = {
    id : Nat;
    sNo : Nat;
    borrowerName : Text;
    loanNumber : Text;
    cersaiPending : Bool;
    cersaiPendingReason : Text;
    insurancePending : Bool;
    insurancePendingReason : Text;
  };

  public type AuditMonth = {
    id : Nat;
    monthName : Text;
    status : Status;
    createdAt : Int;
  };

  public type LoanEntry = {
    id : Nat;
    auditMonthId : Nat;
    sNo : Nat;
    borrowerName : Text;
    loanType : Text;
    loanNumber : Text;
    cersaiApplicable : Bool;
    cersaiDone : Bool;
    cersaiPendingReason : Text;
    insuranceApplicable : Bool;
    insuranceDone : Bool;
    insurancePendingReason : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  public type OldActor = {
    nextAuditMonthId : Nat;
    nextLoanId : Nat;
    auditMonths : Map.Map<Nat, AuditMonth>;
    loanEntries : Map.Map<Nat, LoanEntry>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public type NewActor = OldActor;

  public func run(old : OldActor) : NewActor {
    old;
  };
};
