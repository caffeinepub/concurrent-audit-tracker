import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { LoanEntry } from "../backend.d";
import { useAddLoanEntry, useUpdateLoanEntry } from "../hooks/useQueries";

interface LoanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditMonthId: bigint;
  mode: "add" | "edit";
  initialData?: LoanEntry;
}

interface FormState {
  borrowerName: string;
  loanType: string;
  loanNumber: string;
  cersaiApplicable: boolean;
  cersaiDone: boolean;
  cersaiPendingReason: string;
  insuranceApplicable: boolean;
  insuranceDone: boolean;
  insurancePendingReason: string;
}

const emptyForm: FormState = {
  borrowerName: "",
  loanType: "",
  loanNumber: "",
  cersaiApplicable: false,
  cersaiDone: false,
  cersaiPendingReason: "",
  insuranceApplicable: false,
  insuranceDone: false,
  insurancePendingReason: "",
};

function loanToForm(loan: LoanEntry): FormState {
  return {
    borrowerName: loan.borrowerName,
    loanType: loan.loanType,
    loanNumber: loan.loanNumber,
    cersaiApplicable: loan.cersaiApplicable,
    cersaiDone: loan.cersaiDone,
    cersaiPendingReason: loan.cersaiPendingReason,
    insuranceApplicable: loan.insuranceApplicable,
    insuranceDone: loan.insuranceDone,
    insurancePendingReason: loan.insurancePendingReason,
  };
}

export function LoanFormDialog({
  open,
  onOpenChange,
  auditMonthId,
  mode,
  initialData,
}: LoanFormDialogProps) {
  const addMutation = useAddLoanEntry();
  const updateMutation = useUpdateLoanEntry();
  const isPending = addMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState<FormState>(
    mode === "edit" && initialData ? loanToForm(initialData) : emptyForm,
  );

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setForm(
        mode === "edit" && initialData ? loanToForm(initialData) : emptyForm,
      );
    }
  }, [open, mode, initialData]);

  const set = (key: keyof FormState) => (value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Clear pending reason when marking as done
      if (key === "cersaiDone" && value === true) {
        next.cersaiPendingReason = "";
      }
      if (key === "insuranceDone" && value === true) {
        next.insurancePendingReason = "";
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.borrowerName.trim()) {
      toast.error("Borrower name is required");
      return;
    }
    if (!form.loanType.trim()) {
      toast.error("Loan type is required");
      return;
    }
    if (!form.loanNumber.trim()) {
      toast.error("Loan number is required");
      return;
    }

    try {
      if (mode === "add") {
        await addMutation.mutateAsync({
          auditMonthId,
          borrowerName: form.borrowerName.trim(),
          loanType: form.loanType.trim(),
          loanNumber: form.loanNumber.trim(),
          cersaiApplicable: form.cersaiApplicable,
          cersaiDone: form.cersaiDone,
          cersaiPendingReason: form.cersaiPendingReason.trim(),
          insuranceApplicable: form.insuranceApplicable,
          insuranceDone: form.insuranceDone,
          insurancePendingReason: form.insurancePendingReason.trim(),
        });
        toast.success("Loan entry added");
      } else if (mode === "edit" && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          auditMonthId,
          borrowerName: form.borrowerName.trim(),
          loanType: form.loanType.trim(),
          loanNumber: form.loanNumber.trim(),
          cersaiApplicable: form.cersaiApplicable,
          cersaiDone: form.cersaiDone,
          cersaiPendingReason: form.cersaiPendingReason.trim(),
          insuranceApplicable: form.insuranceApplicable,
          insuranceDone: form.insuranceDone,
          insurancePendingReason: form.insurancePendingReason.trim(),
        });
        toast.success("Loan entry updated");
      }
      onOpenChange(false);
    } catch {
      toast.error(`Failed to ${mode === "add" ? "add" : "update"} loan entry`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Loan Entry" : "Edit Loan Entry"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Enter the loan account details for this audit month"
              : "Update the loan account details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {/* Borrower Name */}
          <div className="space-y-1.5">
            <Label htmlFor="borrower-name">
              Borrower Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="borrower-name"
              placeholder="e.g. Rajesh Kumar"
              value={form.borrowerName}
              onChange={(e) => set("borrowerName")(e.target.value)}
              data-ocid="loan_form.borrower_input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Loan Type */}
            <div className="space-y-1.5">
              <Label htmlFor="loan-type">
                Type of Loan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="loan-type"
                placeholder="e.g. Home Loan"
                value={form.loanType}
                onChange={(e) => set("loanType")(e.target.value)}
                data-ocid="loan_form.loan_type_input"
              />
            </div>

            {/* Loan Number */}
            <div className="space-y-1.5">
              <Label htmlFor="loan-number">
                Loan Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="loan-number"
                placeholder="e.g. HL2024001"
                value={form.loanNumber}
                onChange={(e) => set("loanNumber")(e.target.value)}
                data-ocid="loan_form.loan_number_input"
              />
            </div>
          </div>

          <Separator />

          {/* CERSAI Section */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              CERSAI Compliance
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="cersai-applicable"
                  checked={form.cersaiApplicable}
                  onCheckedChange={(checked) =>
                    set("cersaiApplicable")(!!checked)
                  }
                  data-ocid="loan_form.cersai_applicable_checkbox"
                />
                <div>
                  <Label htmlFor="cersai-applicable" className="cursor-pointer">
                    CERSAI Applicable
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Is CERSAI filing required?
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="cersai-done"
                  checked={form.cersaiDone}
                  onCheckedChange={(checked) => set("cersaiDone")(!!checked)}
                  data-ocid="loan_form.cersai_done_checkbox"
                  disabled={!form.cersaiApplicable}
                />
                <div>
                  <Label
                    htmlFor="cersai-done"
                    className={`cursor-pointer ${!form.cersaiApplicable ? "text-muted-foreground" : ""}`}
                  >
                    CERSAI Done?
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Has it been filed?
                  </p>
                </div>
              </div>
            </div>
            {/* Reason for CERSAI not done */}
            {form.cersaiApplicable && !form.cersaiDone && (
              <div className="space-y-1.5">
                <Label htmlFor="cersai-reason" className="text-sm">
                  Reason for CERSAI not done
                </Label>
                <Textarea
                  id="cersai-reason"
                  placeholder="Enter reason why CERSAI has not been completed..."
                  value={form.cersaiPendingReason}
                  onChange={(e) => set("cersaiPendingReason")(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                  data-ocid="loan_form.cersai_reason_textarea"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Insurance Section */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Insurance Compliance
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="insurance-applicable"
                  checked={form.insuranceApplicable}
                  onCheckedChange={(checked) =>
                    set("insuranceApplicable")(!!checked)
                  }
                  data-ocid="loan_form.insurance_applicable_checkbox"
                />
                <div>
                  <Label
                    htmlFor="insurance-applicable"
                    className="cursor-pointer"
                  >
                    Insurance Applicable
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Is insurance required?
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="insurance-done"
                  checked={form.insuranceDone}
                  onCheckedChange={(checked) => set("insuranceDone")(!!checked)}
                  data-ocid="loan_form.insurance_done_checkbox"
                  disabled={!form.insuranceApplicable}
                />
                <div>
                  <Label
                    htmlFor="insurance-done"
                    className={`cursor-pointer ${!form.insuranceApplicable ? "text-muted-foreground" : ""}`}
                  >
                    Insurance Done?
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Has it been completed?
                  </p>
                </div>
              </div>
            </div>
            {/* Reason for Insurance not done */}
            {form.insuranceApplicable && !form.insuranceDone && (
              <div className="space-y-1.5">
                <Label htmlFor="insurance-reason" className="text-sm">
                  Reason for Insurance not done
                </Label>
                <Textarea
                  id="insurance-reason"
                  placeholder="Enter reason why Insurance has not been completed..."
                  value={form.insurancePendingReason}
                  onChange={(e) =>
                    set("insurancePendingReason")(e.target.value)
                  }
                  rows={2}
                  className="resize-none text-sm"
                  data-ocid="loan_form.insurance_reason_textarea"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            data-ocid="loan_form.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isPending}
            data-ocid="loan_form.submit_button"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === "add" ? "Add Entry" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
