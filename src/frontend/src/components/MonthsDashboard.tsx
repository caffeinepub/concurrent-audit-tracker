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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Calendar,
  Loader2,
  LogIn,
  LogOut,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AuditMonth } from "../backend.d";
import { Status } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreateAuditMonth, useListAuditMonths } from "../hooks/useQueries";

interface MonthsDashboardProps {
  onSelectMonth: (month: AuditMonth) => void;
}

export function MonthsDashboard({ onSelectMonth }: MonthsDashboardProps) {
  const { login, clear, isLoggingIn, identity } = useInternetIdentity();
  const { data: months, isLoading } = useListAuditMonths();
  const createMutation = useCreateAuditMonth();

  const [newMonthOpen, setNewMonthOpen] = useState(false);
  const [monthName, setMonthName] = useState("");

  const isLoggedIn = !!identity;

  const handleCreateMonth = async () => {
    if (!monthName.trim()) {
      toast.error("Please enter a month name");
      return;
    }
    try {
      await createMutation.mutateAsync(monthName.trim().toUpperCase());
      toast.success(`Audit month "${monthName.trim().toUpperCase()}" created`);
      setMonthName("");
      setNewMonthOpen(false);
    } catch {
      toast.error("Failed to create audit month");
    }
  };

  // Sort months newest first
  const sortedMonths = months
    ? [...months].sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    : [];

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
                  Enter a month identifier (e.g. JAN-2026, FEB-2026)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="month-name">Month Name</Label>
                  <Input
                    id="month-name"
                    placeholder="e.g. JAN-2026"
                    value={monthName}
                    onChange={(e) => setMonthName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleCreateMonth();
                    }}
                    className="uppercase placeholder:normal-case"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewMonthOpen(false);
                    setMonthName("");
                  }}
                  data-ocid="months.dialog.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleCreateMonth()}
                  disabled={createMutation.isPending || !monthName.trim()}
                  data-ocid="months.dialog.confirm_button"
                >
                  {createMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Month
                </Button>
              </DialogFooter>
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
              />
            ))}
          </div>
        )}
      </main>

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
}: {
  month: AuditMonth;
  index: number;
  onClick: () => void;
}) {
  const isOpen = month.status === Status.open;

  return (
    <button
      type="button"
      data-ocid={`months.item.${index}`}
      onClick={onClick}
      className="text-left bg-card border border-border rounded-lg p-5 shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all duration-200 animate-fade-in group"
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
  );
}
