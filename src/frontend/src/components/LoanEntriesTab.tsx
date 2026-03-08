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

  // Sort by sNo ascending
  const sortedLoans = loans
    ? [...loans].sort((a, b) => Number(a.sNo) - Number(b.sNo))
    : [];

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
                  {isOpen && (
                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-center w-20">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLoans.map((loan, idx) => (
                  <TableRow
                    key={loan.id.toString()}
                    data-ocid={`loans.item.${idx + 1}`}
                    className="hover:bg-muted/30 text-sm"
                  >
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {Number(loan.sNo)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {loan.borrowerName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal"
                      >
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
                    {isOpen && (
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            data-ocid={`loans.edit_button.${idx + 1}`}
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
                                data-ocid={`loans.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Loan Entry
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the entry for{" "}
                                  <strong>{loan.borrowerName}</strong>? This
                                  action cannot be undone.
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
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {sortedLoans.length} loan{sortedLoans.length !== 1 ? "s" : ""} recorded
      </p>
    </div>
  );
}
