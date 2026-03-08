import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AuditMonth, LoanEntry } from "../backend.d";
import { Status } from "../backend.d";
import { useDeleteLoanEntry, useListLoansByMonth } from "../hooks/useQueries";
import { LoanFormDialog } from "./LoanFormDialog";

interface LoanEntriesTabProps {
  month: AuditMonth;
}

export function LoanEntriesTab({ month }: LoanEntriesTabProps) {
  const isOpen = month.status === Status.open;
  const { data: loans, isLoading } = useListLoansByMonth(month.id);
  const deleteMutation = useDeleteLoanEntry();
  const [addOpen, setAddOpen] = useState(false);
  const [editLoan, setEditLoan] = useState<LoanEntry | null>(null);

  // Separate current-month vs brought-forward loans, each sorted by sNo
  const sortedLoans = loans
    ? [...loans].sort((a, b) => Number(a.sNo) - Number(b.sNo))
    : [];

  const currentMonthLoans = sortedLoans.filter(
    (l) => l.broughtForwardFromMonthId === 0n,
  );
  const broughtForwardLoans = sortedLoans.filter(
    (l) => l.broughtForwardFromMonthId !== 0n,
  );

  const hasBroughtForward = broughtForwardLoans.length > 0;

  const handleDelete = async (loan: LoanEntry) => {
    try {
      await deleteMutation.mutateAsync({
        id: loan.id,
        auditMonthId: loan.auditMonthId,
      });
      toast.success("Loan entry deleted");
    } catch {
      toast.error("Failed to delete loan entry");
    }
  };

  const BoolBadge = ({ value }: { value: boolean }) =>
    value ? (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success-text">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Yes
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <XCircle className="w-3.5 h-3.5" />
        No
      </span>
    );

  const LoanTableRows = ({
    rows,
    indexOffset,
    sectionType,
  }: {
    rows: LoanEntry[];
    indexOffset: number;
    sectionType: "current" | "bf";
  }) => (
    <>
      {rows.map((loan, idx) => {
        const globalIdx = indexOffset + idx;
        return (
          <TableRow
            key={loan.id.toString()}
            data-ocid={`loans.item.${globalIdx + 1}`}
            className={`hover:bg-muted/30 text-sm ${
              sectionType === "bf" ? "bg-amber-50/40 dark:bg-amber-950/10" : ""
            }`}
          >
            <TableCell className="text-center font-mono text-xs text-muted-foreground">
              {Number(loan.sNo)}
            </TableCell>
            <TableCell className="font-medium">{loan.borrowerName}</TableCell>
            <TableCell>
              <Badge variant="secondary" className="text-xs font-normal">
                {loan.loanType}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-xs">
              {loan.loanNumber}
            </TableCell>
            <TableCell className="text-center">
              <BoolBadge value={loan.cersaiApplicable} />
            </TableCell>
            <TableCell className="text-center">
              <BoolBadge value={loan.cersaiDone} />
            </TableCell>
            <TableCell className="text-center">
              <BoolBadge value={loan.insuranceApplicable} />
            </TableCell>
            <TableCell className="text-center">
              <BoolBadge value={loan.insuranceDone} />
            </TableCell>
            {hasBroughtForward && (
              <TableCell className="text-center">
                {sectionType === "bf" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <ArrowLeftRight className="w-3 h-3" />
                    {loan.broughtForwardFromMonthName}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/50">—</span>
                )}
              </TableCell>
            )}
            {isOpen && (
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    data-ocid={`loans.edit_button.${globalIdx + 1}`}
                    onClick={() => setEditLoan(loan)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        data-ocid={`loans.delete_button.${globalIdx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Loan Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the entry for{" "}
                          <strong>{loan.borrowerName}</strong>? This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-ocid="loans.delete_dialog.cancel_button">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          data-ocid="loans.delete_dialog.confirm_button"
                          onClick={() => void handleDelete(loan)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          )}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            )}
          </TableRow>
        );
      })}
    </>
  );

  return (
    <div className="space-y-4">
      {/* Add button + closed notice */}
      <div className="flex items-center justify-between gap-4">
        <div>
          {!isOpen && (
            <Alert className="border-amber-200 bg-warning py-2.5">
              <AlertCircle className="h-4 w-4 text-warning-text" />
              <AlertDescription className="text-warning-text text-sm">
                This month is closed. Entries cannot be modified.
              </AlertDescription>
            </Alert>
          )}
        </div>
        {isOpen && (
          <Button
            data-ocid="loans.add_button"
            className="gap-1.5 shrink-0 ml-auto"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Loan
          </Button>
        )}
      </div>

      {/* Loan form dialogs */}
      <LoanFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        auditMonthId={month.id}
        mode="add"
      />
      {editLoan && (
        <LoanFormDialog
          open={!!editLoan}
          onOpenChange={(open) => {
            if (!open) setEditLoan(null);
          }}
          auditMonthId={month.id}
          mode="edit"
          initialData={editLoan}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded" />
          ))}
        </div>
      ) : sortedLoans.length === 0 ? (
        <div
          data-ocid="loans.empty_state"
          className="rounded-lg border border-dashed border-border py-16 flex flex-col items-center justify-center text-center"
        >
          <p className="text-sm font-medium text-foreground mb-1">
            No loan entries yet
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            {isOpen
              ? "Click 'Add Loan' to start entering loan accounts for this audit month"
              : "No entries were recorded for this audit month"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-12 text-center font-semibold text-xs uppercase tracking-wide">
                    S.No
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide min-w-[140px]">
                    Borrower Name
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide min-w-[120px]">
                    Type of Loan
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide min-w-[120px]">
                    Loan Number
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">
                    CERSAI App.
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">
                    CERSAI Done?
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">
                    Ins. App.
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">
                    Ins. Done?
                  </TableHead>
                  {hasBroughtForward && (
                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-center min-w-[110px]">
                      B/F From
                    </TableHead>
                  )}
                  {isOpen && (
                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-center w-20">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* ── Current Month Entries section header ── */}
                {hasBroughtForward && (
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableCell
                      colSpan={(hasBroughtForward ? 9 : 8) + (isOpen ? 1 : 0)}
                      className="py-2 px-4"
                    >
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                        Current Month Entries
                        <span className="ml-1 font-normal text-muted-foreground/70">
                          ({currentMonthLoans.length})
                        </span>
                      </span>
                    </TableCell>
                  </TableRow>
                )}

                {currentMonthLoans.length === 0 && hasBroughtForward ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={(hasBroughtForward ? 9 : 8) + (isOpen ? 1 : 0)}
                      className="py-4 text-center text-xs text-muted-foreground italic"
                    >
                      No new entries added this month.
                    </TableCell>
                  </TableRow>
                ) : (
                  <LoanTableRows
                    rows={currentMonthLoans}
                    indexOffset={0}
                    sectionType="current"
                  />
                )}

                {/* ── Brought Forward section header ── */}
                {hasBroughtForward && (
                  <>
                    <TableRow className="hover:bg-transparent bg-amber-50/60 dark:bg-amber-950/20">
                      <TableCell
                        colSpan={(hasBroughtForward ? 9 : 8) + (isOpen ? 1 : 0)}
                        className="py-2 px-4"
                      >
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                          <ArrowLeftRight className="w-3 h-3" />
                          Brought Forward
                          <span className="ml-1 font-normal text-amber-600/70 dark:text-amber-500/70">
                            ({broughtForwardLoans.length})
                          </span>
                        </span>
                      </TableCell>
                    </TableRow>
                    <LoanTableRows
                      rows={broughtForwardLoans}
                      indexOffset={currentMonthLoans.length}
                      sectionType="bf"
                    />
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {sortedLoans.length} loan{sortedLoans.length !== 1 ? "s" : ""} recorded
        {hasBroughtForward && (
          <span className="ml-2 text-amber-600 dark:text-amber-400">
            · {broughtForwardLoans.length} brought forward
          </span>
        )}
      </p>
    </div>
  );
}
