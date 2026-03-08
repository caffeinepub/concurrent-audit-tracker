import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";

module {
  type OldLoanEntry = {
    id : Nat;
    auditMonthId : Nat;
    sNo : Nat;
    borrowerName : Text;
    loanType : Text;
    loanNumber : Text;
    cersaiApplicable : Bool;
    cersaiDone : Bool;
    insuranceApplicable : Bool;
    insuranceDone : Bool;
  };

  type OldActor = {
    nextAuditMonthId : Nat;
    nextLoanId : Nat;
    auditMonths : Map.Map<Nat, { id : Nat; monthName : Text; status : { #open; #closed }; createdAt : Int }>;
    loanEntries : Map.Map<Nat, OldLoanEntry>;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  type NewLoanEntry = {
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

  type NewActor = {
    nextAuditMonthId : Nat;
    nextLoanId : Nat;
    auditMonths : Map.Map<Nat, { id : Nat; monthName : Text; status : { #open; #closed }; createdAt : Int }>;
    loanEntries : Map.Map<Nat, NewLoanEntry>;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  public func run(old : OldActor) : NewActor {
    let newLoanEntries = Map.empty<Nat, NewLoanEntry>();

    for ((id, entry) in old.loanEntries.entries()) {
      newLoanEntries.add(
        id,
        {
          entry with
          cersaiPendingReason = "";
          insurancePendingReason = "";
        },
      );
    };
    {
      old with
      loanEntries = newLoanEntries;
    };
  };
};
