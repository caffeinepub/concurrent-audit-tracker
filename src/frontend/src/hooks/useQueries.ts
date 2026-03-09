import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AuditMonth,
  LoanEntry,
  LoanEntryStatus,
  PendingLoanRow,
  backendInterface,
} from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ── Audit Months ────────────────────────────────────────────────────────────

export function useListAuditMonths() {
  const { actor, isFetching } = useActor();
  return useQuery<AuditMonth[]>({
    queryKey: ["auditMonths"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAuditMonths();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateAuditMonth() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (monthName: string) => {
      // Get the freshest actor from the query cache at call time using the
      // current principal, to avoid using a stale anonymous actor captured
      // at hook render time.
      const principalStr = identity?.getPrincipal().toString();
      const freshActor = queryClient.getQueryData<backendInterface>([
        "actor",
        principalStr,
      ]);
      const actorToUse = freshActor ?? actor;
      if (!actorToUse) throw new Error("Not connected");
      return actorToUse.createAuditMonth(monthName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auditMonths"] });
    },
  });
}

export function useCloseAuditMonth() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.closeAuditMonth(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auditMonths"] });
    },
  });
}

export function useDeleteAuditMonth() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteAuditMonth(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auditMonths"] });
    },
  });
}

// ── Loan Entries ─────────────────────────────────────────────────────────────

export function useListLoansByMonth(auditMonthId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<LoanEntry[]>({
    queryKey: ["loans", auditMonthId?.toString()],
    queryFn: async () => {
      if (!actor || auditMonthId === null) return [];
      return actor.listLoansByMonth(auditMonthId);
    },
    enabled: !!actor && !isFetching && auditMonthId !== null,
  });
}

export function useGetMonthSummary(auditMonthId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<LoanEntryStatus>({
    queryKey: ["monthSummary", auditMonthId?.toString()],
    queryFn: async () => {
      if (!actor || auditMonthId === null)
        return {
          cersaiPending: BigInt(0),
          cersaiCompleted: BigInt(0),
          cersaiApplicable: BigInt(0),
          insuranceCompleted: BigInt(0),
          insurancePending: BigInt(0),
          insuranceApplicable: BigInt(0),
          totalLoans: BigInt(0),
        };
      return actor.getMonthSummary(auditMonthId);
    },
    enabled: !!actor && !isFetching && auditMonthId !== null,
  });
}

export function useAddLoanEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      auditMonthId: bigint;
      borrowerName: string;
      loanType: string;
      loanNumber: string;
      cersaiApplicable: boolean;
      cersaiDone: boolean;
      cersaiPendingReason: string;
      insuranceApplicable: boolean;
      insuranceDone: boolean;
      insurancePendingReason: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addLoanEntry(
        params.auditMonthId,
        params.borrowerName,
        params.loanType,
        params.loanNumber,
        params.cersaiApplicable,
        params.cersaiDone,
        params.cersaiApplicable && !params.cersaiDone
          ? params.cersaiPendingReason
          : "",
        params.insuranceApplicable,
        params.insuranceDone,
        params.insuranceApplicable && !params.insuranceDone
          ? params.insurancePendingReason
          : "",
      );
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["loans", variables.auditMonthId.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["monthSummary", variables.auditMonthId.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["pendingLoans", variables.auditMonthId.toString()],
      });
    },
  });
}

export function useUpdateLoanEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      auditMonthId: bigint;
      borrowerName: string;
      loanType: string;
      loanNumber: string;
      cersaiApplicable: boolean;
      cersaiDone: boolean;
      cersaiPendingReason: string;
      insuranceApplicable: boolean;
      insuranceDone: boolean;
      insurancePendingReason: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateLoanEntry(
        params.id,
        params.borrowerName,
        params.loanType,
        params.loanNumber,
        params.cersaiApplicable,
        params.cersaiDone,
        params.cersaiApplicable && !params.cersaiDone
          ? params.cersaiPendingReason
          : "",
        params.insuranceApplicable,
        params.insuranceDone,
        params.insuranceApplicable && !params.insuranceDone
          ? params.insurancePendingReason
          : "",
      );
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["loans", variables.auditMonthId.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["monthSummary", variables.auditMonthId.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["pendingLoans", variables.auditMonthId.toString()],
      });
    },
  });
}

export function useDeleteLoanEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: bigint; auditMonthId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteLoanEntry(params.id);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["loans", variables.auditMonthId.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["monthSummary", variables.auditMonthId.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["pendingLoans", variables.auditMonthId.toString()],
      });
    },
  });
}

export function useGetPendingLoans(auditMonthId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<PendingLoanRow[]>({
    queryKey: ["pendingLoans", auditMonthId?.toString()],
    queryFn: async () => {
      if (!actor || auditMonthId === null) return [];
      return actor.getPendingLoans(auditMonthId);
    },
    enabled: !!actor && !isFetching && auditMonthId !== null,
  });
}

export function useClearLoansForMonth() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (auditMonthId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.clearLoansForMonth(auditMonthId);
    },
    onSuccess: (_data, auditMonthId) => {
      void queryClient.invalidateQueries({
        queryKey: ["loans", auditMonthId.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["monthSummary", auditMonthId.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["pendingLoans", auditMonthId.toString()],
      });
    },
  });
}

export function useRolloverPendingLoans() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { fromMonthId: bigint; toMonthId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.rolloverPendingLoans(params.fromMonthId, params.toMonthId);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["loans", variables.toMonthId.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["monthSummary", variables.toMonthId.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["pendingLoans", variables.toMonthId.toString()],
      });
    },
  });
}
