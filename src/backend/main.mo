import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

import Migration "migration";
(with migration = Migration.run)
actor {
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

  module AuditMonth {
    public func compare(a : AuditMonth, b : AuditMonth) : Order.Order {
      Int.compare(b.createdAt, a.createdAt);
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var nextAuditMonthId = 1;
  var nextLoanId = 1;

  let auditMonths = Map.empty<Nat, AuditMonth>();
  let loanEntries = Map.empty<Nat, LoanEntry>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createAuditMonth(monthName : Text) : async AuditMonth {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create audit months");
    };
    let id = nextAuditMonthId;
    nextAuditMonthId += 1;
    let month : AuditMonth = {
      id;
      monthName;
      status = #open;
      createdAt = Time.now();
    };
    auditMonths.add(id, month);
    month;
  };

  public query ({ caller }) func listAuditMonths() : async [AuditMonth] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list audit months");
    };
    auditMonths.values().toArray().sort();
  };

  public shared ({ caller }) func closeAuditMonth(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can close audit months");
    };
    switch (auditMonths.get(id)) {
      case (null) { Runtime.trap("Audit Month not found") };
      case (?month) {
        if (month.status == #closed) {
          Runtime.trap("Month is already closed");
        };
        let updatedMonth = {
          id = month.id;
          monthName = month.monthName;
          status = #closed;
          createdAt = month.createdAt;
        };
        auditMonths.add(id, updatedMonth);
      };
    };
  };

  public shared ({ caller }) func addLoanEntry(
    auditMonthId : Nat,
    borrowerName : Text,
    loanType : Text,
    loanNumber : Text,
    cersaiApplicable : Bool,
    cersaiDone : Bool,
    cersaiPendingReason : Text,
    insuranceApplicable : Bool,
    insuranceDone : Bool,
    insurancePendingReason : Text,
  ) : async LoanEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create loan entries");
    };
    switch (auditMonths.get(auditMonthId)) {
      case (null) { Runtime.trap("Audit Month not found") };
      case (?month) {
        if (month.status == #closed) {
          Runtime.trap("Month is closed");
        };
        let sNo = loanEntries.values().toArray().filter(
          func(entry) { entry.auditMonthId == auditMonthId }
        ).size() + 1;
        let id = nextLoanId;
        nextLoanId += 1;
        let entry : LoanEntry = {
          id;
          auditMonthId;
          sNo;
          borrowerName;
          loanType;
          loanNumber;
          cersaiApplicable;
          cersaiDone;
          cersaiPendingReason;
          insuranceApplicable;
          insuranceDone;
          insurancePendingReason;
        };
        loanEntries.add(id, entry);
        entry;
      };
    };
  };

  public shared ({ caller }) func updateLoanEntry(
    id : Nat,
    borrowerName : Text,
    loanType : Text,
    loanNumber : Text,
    cersaiApplicable : Bool,
    cersaiDone : Bool,
    cersaiPendingReason : Text,
    insuranceApplicable : Bool,
    insuranceDone : Bool,
    insurancePendingReason : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update loan entries");
    };
    switch (loanEntries.get(id)) {
      case (null) { Runtime.trap("Loan Entry not found") };
      case (?entry) {
        switch (auditMonths.get(entry.auditMonthId)) {
          case (null) { Runtime.trap("Audit Month not found") };
          case (?month) {
            if (month.status == #closed) {
              Runtime.trap("Month is closed");
            };
            let updatedEntry = {
              id = entry.id;
              auditMonthId = entry.auditMonthId;
              sNo = entry.sNo;
              borrowerName;
              loanType;
              loanNumber;
              cersaiApplicable;
              cersaiDone;
              cersaiPendingReason;
              insuranceApplicable;
              insuranceDone;
              insurancePendingReason;
            };
            loanEntries.add(id, updatedEntry);
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteLoanEntry(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete loan entries");
    };
    switch (loanEntries.get(id)) {
      case (null) { Runtime.trap("Loan entry not found") };
      case (?entry) {
        switch (auditMonths.get(entry.auditMonthId)) {
          case (null) { Runtime.trap("Audit Month not found") };
          case (?month) {
            if (month.status == #closed) {
              Runtime.trap("Month is closed");
            };
            loanEntries.remove(id);
          };
        };
      };
    };
  };

  public query ({ caller }) func listLoansByMonth(auditMonthId : Nat) : async [LoanEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list loans by months");
    };

    let filtered = loanEntries.values().toArray().filter(
      func(entry) { entry.auditMonthId == auditMonthId }
    );
    filtered.sort(
      func(a, b) { Nat.compare(a.sNo, b.sNo) }
    );
  };

  public shared ({ caller }) func clearLoansForMonth(auditMonthId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear loans per month");
    };
    switch (auditMonths.get(auditMonthId)) {
      case (null) { Runtime.trap("Audit Month not found") };
      case (?month) {
        if (month.status == #closed) {
          Runtime.trap("Month is closed");
        };
        let keysToRemove = loanEntries.keys().toArray().filter(
          func(id) {
            switch (loanEntries.get(id)) {
              case (null) { false };
              case (?entry) { entry.auditMonthId == auditMonthId };
            };
          }
        );
        keysToRemove.values().forEach(
          func(id) {
            loanEntries.remove(id);
          }
        );
      };
    };
  };

  public query ({ caller }) func getMonthSummary(auditMonthId : Nat) : async LoanEntryStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get month summaries");
    };

    let entries = loanEntries.values().toArray().filter(
      func(entry) { entry.auditMonthId == auditMonthId }
    );
    var cersaiCompleted = 0;
    var cersaiPending = 0;
    var insuranceCompleted = 0;
    var insurancePending = 0;

    entries.values().forEach(
      func(entry) {
        if (entry.cersaiApplicable) {
          if (entry.cersaiDone) {
            cersaiCompleted += 1;
          } else {
            cersaiPending += 1;
          };
        };
        if (entry.insuranceApplicable) {
          if (entry.insuranceDone) {
            insuranceCompleted += 1;
          } else {
            insurancePending += 1;
          };
        };
      }
    );

    {
      cersaiCompleted;
      cersaiPending;
      insuranceCompleted;
      insurancePending;
      totalLoans = entries.size();
    };
  };

  public query ({ caller }) func getPendingLoans(auditMonthId : Nat) : async [PendingLoanRow] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get month pending loans");
    };
    let entries = loanEntries.values().toArray().filter(
      func(entry) { entry.auditMonthId == auditMonthId }
    );
    entries.sort(
      func(a, b) { Nat.compare(a.sNo, b.sNo) }
    ).map(
      func(entry) {
        {
          id = entry.id;
          sNo = entry.sNo;
          borrowerName = entry.borrowerName;
          loanNumber = entry.loanNumber;
          cersaiPending = entry.cersaiApplicable and not entry.cersaiDone;
          cersaiPendingReason = entry.cersaiPendingReason;
          insurancePending = entry.insuranceApplicable and not entry.insuranceDone;
          insurancePendingReason = entry.insurancePendingReason;
        };
      }
    ).filter(
      func(row) {
        row.cersaiPending or row.insurancePending;
      }
    );
  };

  /// New function to delete an audit month and all associated loan entries.
  public shared ({ caller }) func deleteAuditMonth(auditMonthId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete audit months");
    };

    // Check if the audit month exists
    switch (auditMonths.get(auditMonthId)) {
      case (null) { Runtime.trap("Audit Month not found") };
      case (?_month) {
        // Remove the audit month
        auditMonths.remove(auditMonthId);

        // Find and remove all associated loan entries
        let keysToRemove = loanEntries.keys().toArray().filter(
          func(id) {
            switch (loanEntries.get(id)) {
              case (null) { false };
              case (?entry) { entry.auditMonthId == auditMonthId };
            };
          }
        );
        keysToRemove.values().forEach(
          func(id) {
            loanEntries.remove(id);
          }
        );
      };
    };
  };
};
