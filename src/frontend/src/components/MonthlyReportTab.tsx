import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeftRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileBarChart2,
  FileText,
  HeartPulse,
  Loader2,
  Lock,
  Shield,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AuditMonth } from "../backend.d";
import { Status } from "../backend.d";
import {
  useClearLoansForMonth,
  useCloseAuditMonth,
  useGetMonthSummary,
  useGetPendingLoans,
} from "../hooks/useQueries";

interface MonthlyReportTabProps {
  month: AuditMonth;
}

export function MonthlyReportTab({ month }: MonthlyReportTabProps) {
  const isOpen = month.status === Status.open;
  const { data: summary, isLoading } = useGetMonthSummary(month.id);
  const { data: pendingLoans } = useGetPendingLoans(month.id);
  const clearMutation = useClearLoansForMonth();
  const closeMutation = useCloseAuditMonth();
  const [clearOpen, setClearOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const handleGeneratePDF = () => {
    window.print();
  };

  const handleClearData = async () => {
    try {
      await clearMutation.mutateAsync(month.id);
      toast.success("All loan data cleared successfully");
      setClearOpen(false);
    } catch {
      toast.error("Failed to clear loan data");
    }
  };

  const handleCloseMonth = async () => {
    try {
      await closeMutation.mutateAsync(month.id);
      toast.success(`${month.monthName} has been closed`);
      setCloseOpen(false);
    } catch {
      toast.error("Failed to close audit month");
    }
  };

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Action buttons (print-hide) */}
      <div className="flex flex-wrap items-center gap-3 print-hide">
        <Button
          onClick={handleGeneratePDF}
          data-ocid="report.generate_pdf_button"
          className="gap-1.5"
        >
          <FileText className="w-4 h-4" />
          Generate PDF
        </Button>

        {isOpen && (
          <>
            {/* Clear Data */}
            <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                  data-ocid="report.clear_data_button"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Loan Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Loan Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure? This will permanently delete{" "}
                    <strong>all loan entries</strong> for{" "}
                    <strong>{month.monthName}</strong>. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="report.clear_dialog.cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    data-ocid="report.clear_dialog.confirm_button"
                    onClick={() => void handleClearData()}
                    disabled={clearMutation.isPending}
                  >
                    {clearMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Delete All Entries
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Close Month */}
            <AlertDialog open={closeOpen} onOpenChange={setCloseOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-1.5 ml-auto"
                  data-ocid="report.close_month_button"
                >
                  <Lock className="w-4 h-4" />
                  Close Month
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Close {month.monthName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will lock all entries for{" "}
                    <strong>{month.monthName}</strong> permanently. No further
                    changes will be allowed after closing.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="report.close_dialog.cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-ocid="report.close_dialog.confirm_button"
                    onClick={() => void handleCloseMonth()}
                    disabled={closeMutation.isPending}
                  >
                    {closeMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Close Month
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      {/* Metric Cards (screen only) */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 print-hide">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 print-hide">
          <MetricCard
            label="CERSAI Applicable"
            value={Number(summary.cersaiApplicable)}
            icon={<ClipboardList className="w-4 h-4" />}
            color="info"
            dataOcid="report.cersai_applicable_card"
          />
          <MetricCard
            label="CERSAI Completed"
            value={Number(summary.cersaiCompleted)}
            icon={<CheckCircle2 className="w-4 h-4" />}
            color="success"
            dataOcid="report.cersai_completed_card"
          />
          <MetricCard
            label="CERSAI Pending"
            value={Number(summary.cersaiPending)}
            icon={<Clock className="w-4 h-4" />}
            color="warning"
            dataOcid="report.cersai_pending_card"
          />
          <MetricCard
            label="Insurance Applicable"
            value={Number(summary.insuranceApplicable)}
            icon={<ClipboardList className="w-4 h-4" />}
            color="info"
            dataOcid="report.insurance_applicable_card"
          />
          <MetricCard
            label="Insurance Completed"
            value={Number(summary.insuranceCompleted)}
            icon={<HeartPulse className="w-4 h-4" />}
            color="success"
            dataOcid="report.insurance_completed_card"
          />
          <MetricCard
            label="Insurance Pending"
            value={Number(summary.insurancePending)}
            icon={<Shield className="w-4 h-4" />}
            color="warning"
            dataOcid="report.insurance_pending_card"
          />
          <MetricCard
            label="Total Loans"
            value={Number(summary.totalLoans)}
            icon={<FileBarChart2 className="w-4 h-4" />}
            color="neutral"
            dataOcid="report.total_loans_card"
          />
        </div>
      ) : null}

      {/* Printable Report Section */}
      <div
        id="printable-report"
        className="bg-card border border-border rounded-lg"
      >
        {/* Report Header */}
        <div className="p-8 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Banking Concurrent Audit
              </p>
              <h2 className="font-display text-2xl text-foreground">
                Concurrent Audit Compliance Report
              </h2>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-lg font-semibold text-primary">
                  {month.monthName}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isOpen
                      ? "bg-success text-success-text"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isOpen ? "OPEN" : "CLOSED"}
                </span>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs text-muted-foreground">Generated on</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {generatedDate}
              </p>
            </div>
          </div>
        </div>

        {/* Report Body */}
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-full rounded" />
            ))}
          </div>
        ) : summary ? (
          <div className="p-8">
            {/* Compliance Summary Table */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full bg-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  Compliance Summary
                </h3>
              </div>
              <ComplianceSummaryTable
                summary={summary}
                pendingLoans={pendingLoans ?? []}
              />
            </div>

            <Separator className="my-6" />

            {/* Pending Loan Accounts */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-5 rounded-full bg-destructive" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  Pending Loan Accounts
                </h3>
              </div>

              {!pendingLoans || pendingLoans.length === 0 ? (
                <div
                  data-ocid="report.pending_loans.empty_state"
                  className="flex items-center justify-center py-8 rounded-md bg-muted/30 border border-border text-sm text-muted-foreground"
                >
                  No pending loans for this month.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* ── Current Month Pending ── */}
                  <PendingSubTable
                    rows={pendingLoans.filter(
                      (r) => r.broughtForwardFromMonthId === 0n,
                    )}
                    type="current"
                    indexOffset={0}
                  />

                  {/* ── Brought Forward Pending ── */}
                  {pendingLoans.some(
                    (r) => r.broughtForwardFromMonthId !== 0n,
                  ) && (
                    <PendingSubTable
                      rows={pendingLoans.filter(
                        (r) => r.broughtForwardFromMonthId !== 0n,
                      )}
                      type="bf"
                      indexOffset={
                        pendingLoans.filter(
                          (r) => r.broughtForwardFromMonthId === 0n,
                        ).length
                      }
                    />
                  )}
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Total */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg px-5 py-4">
              <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Total Loan Accounts
              </span>
              <span className="text-2xl font-bold text-primary font-display">
                {Number(summary.totalLoans)}
              </span>
            </div>
          </div>
        ) : null}

        {/* Report Footer */}
        <div className="px-8 pb-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            This report is auto-generated by the Concurrent Audit Tracker
            system.
          </p>
          <p className="text-xs text-muted-foreground sm:hidden">
            {generatedDate}
          </p>
        </div>
      </div>
    </div>
  );
}

function PendingSubTable({
  rows,
  type,
  indexOffset,
}: {
  rows: import("../backend.d").PendingLoanRow[];
  type: "current" | "bf";
  indexOffset: number;
}) {
  const isBF = type === "bf";

  const getReasonText = (row: import("../backend.d").PendingLoanRow) => {
    if (row.cersaiPending && row.insurancePending) {
      const cr = row.cersaiPendingReason.trim();
      const ir = row.insurancePendingReason.trim();
      if (cr && ir) return `CERSAI: ${cr} | Insurance: ${ir}`;
      if (cr) return `CERSAI: ${cr}`;
      if (ir) return `Insurance: ${ir}`;
      return "-";
    }
    if (row.cersaiPending) return row.cersaiPendingReason.trim() || "-";
    if (row.insurancePending) return row.insurancePendingReason.trim() || "-";
    return "-";
  };

  return (
    <div>
      {/* Sub-section heading */}
      <div
        className={`flex items-center gap-2 mb-2.5 px-1 ${
          isBF ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
        }`}
      >
        {isBF ? (
          <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Clock className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="text-xs font-semibold uppercase tracking-widest">
          {isBF ? "Brought Forward Pending" : "Current Month Pending"}
        </span>
        <span className="text-xs font-normal opacity-60">({rows.length})</span>
      </div>

      {rows.length === 0 ? (
        <div
          data-ocid="report.pending_loans.empty_state"
          className="flex items-center justify-center py-5 rounded-md bg-muted/20 border border-dashed border-border text-xs text-muted-foreground italic"
        >
          No current month pending loans.
        </div>
      ) : (
        <div
          data-ocid={
            isBF
              ? "report.bf_pending_loans_table"
              : "report.current_pending_loans_table"
          }
          className={`overflow-x-auto rounded-md border ${
            isBF ? "border-amber-200 dark:border-amber-800/40" : "border-border"
          }`}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className={`border-b ${
                  isBF
                    ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40"
                    : "bg-muted/50 border-border"
                }`}
              >
                <th className="py-2.5 px-4 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground w-12">
                  S.No
                </th>
                <th className="py-2.5 px-4 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Borrower Name
                </th>
                <th className="py-2.5 px-4 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Loan Number
                </th>
                <th className="py-2.5 px-4 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground w-28">
                  Pending
                </th>
                {isBF && (
                  <th className="py-2.5 px-4 text-left font-semibold text-xs uppercase tracking-wide text-amber-600 dark:text-amber-400 min-w-[120px]">
                    B/F From Month
                  </th>
                )}
                <th className="py-2.5 px-4 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const pendingLabel =
                  row.cersaiPending && row.insurancePending
                    ? "Both"
                    : row.cersaiPending
                      ? "CERSAI"
                      : "Insurance";

                return (
                  <tr
                    key={row.id.toString()}
                    data-ocid={`report.pending_loans.item.${indexOffset + idx + 1}`}
                    className={`border-b last:border-0 transition-colors ${
                      isBF
                        ? "bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 border-amber-100 dark:border-amber-900/30"
                        : "hover:bg-muted/20 border-border"
                    }`}
                  >
                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                      {indexOffset + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {row.borrowerName}
                    </td>
                    <td className="py-3 px-4 text-foreground font-mono text-xs">
                      {row.loanNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          pendingLabel === "Both"
                            ? "bg-destructive/15 text-destructive"
                            : pendingLabel === "CERSAI"
                              ? "bg-warning/20 text-warning-text"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                        }`}
                      >
                        {pendingLabel}
                      </span>
                    </td>
                    {isBF && (
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <ArrowLeftRight className="w-3 h-3" />
                          {row.broughtForwardFromMonthName}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-4 text-muted-foreground text-xs max-w-xs">
                      {getReasonText(row)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ComplianceSummaryTable({
  summary,
  pendingLoans,
}: {
  summary: import("../backend.d").LoanEntryStatus;
  pendingLoans: import("../backend.d").PendingLoanRow[];
}) {
  // Previous month pending = brought-forward loans
  const prevInsurancePending = pendingLoans.filter(
    (r) => r.broughtForwardFromMonthId !== 0n && r.insurancePending,
  ).length;
  const prevCersaiPending = pendingLoans.filter(
    (r) => r.broughtForwardFromMonthId !== 0n && r.cersaiPending,
  ).length;

  // Count brought-forward loans that are insurance/CERSAI applicable
  // (these should NOT appear in "eligible during the month" row)
  const bfInsuranceApplicable = pendingLoans.filter(
    (r) => r.broughtForwardFromMonthId !== 0n && r.insurancePending,
  ).length;
  const bfCersaiApplicable = pendingLoans.filter(
    (r) => r.broughtForwardFromMonthId !== 0n && r.cersaiPending,
  ).length;

  // Current month eligible = total applicable minus brought-forward applicable
  const currentMonthInsuranceEligible = Math.max(
    0,
    Number(summary.insuranceApplicable) - bfInsuranceApplicable,
  );
  const currentMonthCersaiEligible = Math.max(
    0,
    Number(summary.cersaiApplicable) - bfCersaiApplicable,
  );

  const rows = [
    {
      sNo: 1,
      details:
        "No. of accounts pending for Insurance/CERSAI registration for the previous month",
      insurance: prevInsurancePending,
      cersai: prevCersaiPending,
      ocid: "report.summary_table.row.1",
    },
    {
      sNo: 2,
      details:
        "No. of accounts eligible for Insurance/CERSAI registration during the month",
      insurance: currentMonthInsuranceEligible,
      cersai: currentMonthCersaiEligible,
      ocid: "report.summary_table.row.2",
    },
    {
      sNo: 3,
      details: "No. of accounts completed",
      insurance: Number(summary.insuranceCompleted),
      cersai: Number(summary.cersaiCompleted),
      ocid: "report.summary_table.row.3",
    },
    {
      sNo: 4,
      details: "No. of accounts pending",
      insurance: Number(summary.insurancePending),
      cersai: Number(summary.cersaiPending),
      ocid: "report.summary_table.row.4",
    },
  ];

  return (
    <div
      data-ocid="report.summary_table"
      className="overflow-x-auto rounded-md border border-border"
    >
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#0ea5e9] text-white">
            <th className="border border-[#0ea5e9]/60 py-2.5 px-4 text-center font-semibold text-xs uppercase tracking-wide w-14">
              S.No.
            </th>
            <th className="border border-[#0ea5e9]/60 py-2.5 px-4 text-center font-semibold text-xs uppercase tracking-wide">
              Details
            </th>
            <th className="border border-[#0ea5e9]/60 py-2.5 px-4 text-center font-semibold text-xs uppercase tracking-wide w-36">
              Insurance
            </th>
            <th className="border border-[#0ea5e9]/60 py-2.5 px-4 text-center font-semibold text-xs uppercase tracking-wide w-36">
              CERSAI
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.sNo}
              data-ocid={row.ocid}
              className={`border-b border-border last:border-0 ${
                idx % 2 === 0 ? "bg-white dark:bg-background" : "bg-muted/30"
              }`}
            >
              <td className="border border-border py-3 px-4 text-center text-muted-foreground font-mono text-xs align-middle">
                {row.sNo}
              </td>
              <td className="border border-border py-3 px-4 text-foreground align-middle leading-snug">
                {row.details}
              </td>
              <td className="border border-border py-3 px-4 text-center font-bold text-foreground font-display text-base align-middle">
                {row.insurance}
              </td>
              <td className="border border-border py-3 px-4 text-center font-bold text-foreground font-display text-base align-middle">
                {row.cersai}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
  dataOcid,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "success" | "warning" | "neutral" | "info";
  dataOcid: string;
}) {
  const colorClasses = {
    success: "bg-success text-success-text",
    warning: "bg-warning text-warning-text",
    neutral: "bg-secondary text-secondary-foreground",
    info: "bg-primary/10 text-primary",
  };

  return (
    <div
      data-ocid={dataOcid}
      className="bg-card border border-border rounded-lg p-4 shadow-xs"
    >
      <div
        className={`w-7 h-7 rounded-md flex items-center justify-center mb-2.5 ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground font-display">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-tight">
        {label}
      </p>
    </div>
  );
}
