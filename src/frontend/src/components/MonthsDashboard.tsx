import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Calendar,
  ChevronsRight,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AuditMonth } from "../backend.d";
import { Status } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateAuditMonth,
  useDeleteAuditMonth,
  useListAuditMonths,
  useRolloverPendingLoans,
} from "../hooks/useQueries";

interface MonthsDashboardProps {
  onSelectMonth: (month: AuditMonth) => void;
}

export function MonthsDashboard({ onSelectMonth }: MonthsDashboardProps) {
  const { login, clear, isLoggingIn, identity } = useInternetIdentity();
  const { isFetching: isActorFetching } = useActor();
  const principalStr = identity?.getPrincipal().toString();
  const queryClient = useQueryClient();
  const { data: months, isLoading } = useListAuditMonths();
  const createMutation = useCreateAuditMonth();
  const deleteMutation = useDeleteAuditMonth();
  const rolloverMutation = useRolloverPendingLoans();

  const [newMonthOpen, setNewMonthOpen] = useState(false);
  const [monthName, setMonthName] = useState("");
  const [rolloverSourceId, setRolloverSourceId] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<AuditMonth | null>(null);

  // Rollover standalone dialog: pick destination month for a source month
  const [rolloverDialogSource, setRolloverDialogSource] =
    useState<AuditMonth | null>(null);
  const [rolloverDestId, setRolloverDestId] = useState<string>("");

  const isLoggedIn = !!identity;

  // Keep for display purposes (button label). Actor readiness for mutations
  // is checked via the query cache directly in handleCreateMonth.
  const _isActorReady = isLoggedIn && !isActorFetching;

  // Sort months newest first
  const sortedMonths = months
    ? [...months].sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    : [];

  const openMonths = sortedMonths.filter((m) => m.status === Status.open);

  const handleCreateMonth = async () => {
    if (!isLoggedIn) {
      toast.error("Please log in first to create an audit month");
      setNewMonthOpen(false);
      return;
    }
    if (!monthName.trim()) {
      toast.error("Please enter a month name");
      return;
    }

    // Wait for the authenticated actor to be ready by polling the query cache
    // directly (avoids stale closure values from React state).
    const waitForAuthenticatedActor = async (
      maxWaitMs = 10000,
    ): Promise<boolean> => {
      const start = Date.now();
      while (Date.now() - start < maxWaitMs) {
        const queryState = queryClient.getQueryState(["actor", principalStr]);
        const isFetching = queryState?.fetchStatus === "fetching";
        const hasData = !!queryState?.data;
        if (!isFetching && hasData && !!identity) return true;
        await new Promise((r) => setTimeout(r, 200));
      }
      return false;
    };

    const actorReady = await waitForAuthenticatedActor();
    if (!actorReady) {
      toast.error(
        "Connection is taking longer than expected. Please try again in a moment.",
      );
      return;
    }

    try {
      const newMonth = await createMutation.mutateAsync(
        monthName.trim().toUpperCase(),
      );
      toast.success(`Audit month "${newMonth.monthName}" created`);

      // Auto-rollover if source was selected
      if (rolloverSourceId) {
        try {
          const count = await rolloverMutation.mutateAsync({
            fromMonthId: BigInt(rolloverSourceId),
            toMonthId: newMonth.id,
          });
          toast.success(
            `${Number(count)} pending loan${Number(count) !== 1 ? "s" : ""} rolled over from source month`,
          );
        } catch {
          toast.error(
            "Month created but rollover failed. Try rolling over manually.",
          );
        }
      }

      setMonthName("");
      setRolloverSourceId("");
      setNewMonthOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        msg.toLowerCase().includes("unauthorized") ||
        msg.toLowerCase().includes("not connected")
      ) {
        toast.error(
          "Connection not ready yet. Please wait a moment and try again.",
        );
      } else {
        toast.error(`Failed to create audit month${msg ? `: ${msg}` : ""}`);
      }
    }
  };

  const handleDeleteMonth = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.monthName}" deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete audit month");
    }
  };

  const handleRollover = async () => {
    if (!rolloverDialogSource || !rolloverDestId) return;
    try {
      const count = await rolloverMutation.mutateAsync({
        fromMonthId: rolloverDialogSource.id,
        toMonthId: BigInt(rolloverDestId),
      });
      toast.success(
        `${Number(count)} pending loan${Number(count) !== 1 ? "s" : ""} rolled over to destination month`,
      );
      setRolloverDialogSource(null);
      setRolloverDestId("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Rollover failed";
      toast.error(msg);
    }
  };

  // Destination options for standalone rollover: all open months except the source
  const rolloverDestOptions = openMonths.filter(
    (m) => rolloverDialogSource && m.id !== rolloverDialogSource.id,
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b border-primary/20 print-hide">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary-foreground/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-normal tracking-tight text-primary-foreground">
                Concurrent Audit Tracker
              </h1>
              <p className="text-xs text-primary-foreground/60 mt-0.5">
                Banking Compliance Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-primary-foreground/70 hidden sm:block">
                  {identity?.getPrincipal().toString().slice(0, 10)}…
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clear}
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={login}
                disabled={isLoggingIn}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                )}
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Audit Months
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select a month to manage loan entries and generate reports
            </p>
          </div>

          <Dialog open={newMonthOpen} onOpenChange={setNewMonthOpen}>
            <DialogTrigger asChild>
              <Button data-ocid="months.new_month_button" className="gap-1.5">
                <Plus className="w-4 h-4" />
                New Month
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Audit Month</DialogTitle>
                <DialogDescription>
                  {isLoggedIn
                    ? "Enter a month identifier (e.g. JAN-2026, FEB-2026)"
                    : "You must be logged in to create an audit month"}
                </DialogDescription>
              </DialogHeader>
              {!isLoggedIn ? (
                <>
                  <div className="py-4 flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <LogIn className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Login with Internet Identity to create and manage audit
                      months.
                    </p>
                    <Button
                      onClick={() => {
                        setNewMonthOpen(false);
                        login();
                      }}
                      disabled={isLoggingIn}
                      className="mt-1"
                      data-ocid="months.dialog.login_button"
                    >
                      {isLoggingIn ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <LogIn className="w-4 h-4 mr-2" />
                      )}
                      Login
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setNewMonthOpen(false)}
                      data-ocid="months.dialog.cancel_button"
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="month-name">Month Name</Label>
                      <Input
                        id="month-name"
                        data-ocid="months.dialog.input"
                        placeholder="e.g. JAN-2026"
                        value={monthName}
                        onChange={(e) => setMonthName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleCreateMonth();
                        }}
                        className="uppercase placeholder:normal-case"
                      />
                    </div>

                    {/* Optional rollover source */}
                    {openMonths.length > 0 && (
                      <div className="space-y-1.5">
                        <Label htmlFor="rollover-source">
                          Roll over pending loans from{" "}
                          <span className="text-muted-foreground font-normal">
                            (optional)
                          </span>
                        </Label>
                        <Select
                          value={rolloverSourceId}
                          onValueChange={setRolloverSourceId}
                        >
                          <SelectTrigger
                            id="rollover-source"
                            data-ocid="months.dialog.rollover_select"
                          >
                            <SelectValue placeholder="Select a month to carry forward..." />
                          </SelectTrigger>
                          <SelectContent>
                            {openMonths.map((m) => (
                              <SelectItem
                                key={m.id.toString()}
                                value={m.id.toString()}
                              >
                                {m.monthName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {rolloverSourceId && (
                          <p className="text-xs text-muted-foreground">
                            Pending CERSAI / Insurance accounts from the
                            selected month will be automatically copied into
                            this new month.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewMonthOpen(false);
                        setMonthName("");
                        setRolloverSourceId("");
                      }}
                      data-ocid="months.dialog.cancel_button"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => void handleCreateMonth()}
                      disabled={
                        createMutation.isPending ||
                        rolloverMutation.isPending ||
                        !monthName.trim()
                      }
                      data-ocid="months.dialog.confirm_button"
                    >
                      {(createMutation.isPending ||
                        rolloverMutation.isPending) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {createMutation.isPending || rolloverMutation.isPending
                        ? "Creating..."
                        : rolloverSourceId
                          ? "Create & Rollover"
                          : "Create Month"}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Months grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : sortedMonths.length === 0 ? (
          <div
            data-ocid="months.empty_state"
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              No audit months yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Create your first audit month to start tracking loan compliance
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedMonths.map((month, idx) => (
              <MonthCard
                key={month.id.toString()}
                month={month}
                index={idx + 1}
                onClick={() => onSelectMonth(month)}
                onDelete={() => setDeleteTarget(month)}
                onRollover={
                  month.status === Status.open
                    ? () => {
                        setRolloverDialogSource(month);
                        setRolloverDestId("");
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete Month Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.monthName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.monthName}</strong> and all its loan
              entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="months.delete_dialog.cancel_button"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="months.delete_dialog.confirm_button"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => void handleDeleteMonth()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Delete Month
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rollover Dialog */}
      <Dialog
        open={!!rolloverDialogSource}
        onOpenChange={(open) => {
          if (!open) {
            setRolloverDialogSource(null);
            setRolloverDestId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rollover Pending Loans</DialogTitle>
            <DialogDescription>
              Copy all pending CERSAI / Insurance accounts from{" "}
              <strong>{rolloverDialogSource?.monthName}</strong> into another
              open month.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="rollover-dest">Destination Month</Label>
            <Select value={rolloverDestId} onValueChange={setRolloverDestId}>
              <SelectTrigger
                id="rollover-dest"
                data-ocid="months.rollover_dialog.select"
              >
                <SelectValue placeholder="Select destination month..." />
              </SelectTrigger>
              <SelectContent>
                {rolloverDestOptions.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No other open months available
                  </SelectItem>
                ) : (
                  rolloverDestOptions.map((m) => (
                    <SelectItem key={m.id.toString()} value={m.id.toString()}>
                      {m.monthName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Pending accounts will be added to the destination month with their
              compliance status reset to pending, so you can update them for the
              new month.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRolloverDialogSource(null);
                setRolloverDestId("");
              }}
              data-ocid="months.rollover_dialog.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleRollover()}
              disabled={
                !rolloverDestId ||
                rolloverDestId === "__none__" ||
                rolloverMutation.isPending
              }
              data-ocid="months.rollover_dialog.confirm_button"
            >
              {rolloverMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Rollover Pending
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-auto print-hide">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function MonthCard({
  month,
  index,
  onClick,
  onDelete,
  onRollover,
}: {
  month: AuditMonth;
  index: number;
  onClick: () => void;
  onDelete: () => void;
  onRollover?: () => void;
}) {
  const isOpen = month.status === Status.open;

  return (
    <div
      data-ocid={`months.item.${index}`}
      className="relative text-left bg-card border border-border rounded-lg p-5 shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all duration-200 animate-fade-in group"
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left"
        aria-label={`Open ${month.monthName}`}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="font-display text-xl text-foreground group-hover:text-primary transition-colors">
            {month.monthName}
          </span>
          <Badge
            className={
              isOpen
                ? "bg-success text-success-text border-0 text-xs shrink-0"
                : "bg-muted text-muted-foreground border-0 text-xs shrink-0"
            }
          >
            {isOpen ? "OPEN" : "CLOSED"}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            Created{" "}
            {new Date(Number(month.createdAt) / 1_000_000).toLocaleDateString(
              "en-IN",
              { day: "2-digit", month: "short", year: "numeric" },
            )}
          </span>
        </div>
      </button>

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Rollover button */}
        {isOpen && onRollover && (
          <button
            type="button"
            data-ocid={`months.rollover_button.${index}`}
            onClick={(e) => {
              e.stopPropagation();
              onRollover();
            }}
            aria-label={`Rollover pending from ${month.monthName}`}
            title="Rollover pending loans to another month"
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        )}
        {/* Delete button */}
        <button
          type="button"
          data-ocid={`months.delete_button.${index}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete ${month.monthName}`}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
