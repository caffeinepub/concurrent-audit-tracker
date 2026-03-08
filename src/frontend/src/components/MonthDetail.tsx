import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2 } from "lucide-react";
import type { AuditMonth } from "../backend.d";
import { Status } from "../backend.d";
import { LoanEntriesTab } from "./LoanEntriesTab";
import { MonthlyReportTab } from "./MonthlyReportTab";

interface MonthDetailProps {
  month: AuditMonth;
  onBack: () => void;
}

export function MonthDetail({ month, onBack }: MonthDetailProps) {
  const isOpen = month.status === Status.open;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b border-primary/20 print-hide">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            data-ocid="month_detail.back_button"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>
          <div className="h-4 w-px bg-primary-foreground/20" />
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-primary-foreground/60" />
            <h1 className="font-display text-xl font-normal text-primary-foreground">
              {month.monthName}
            </h1>
            <Badge
              className={
                isOpen
                  ? "bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 text-xs"
                  : "bg-primary-foreground/10 text-primary-foreground/60 border-primary-foreground/15 text-xs"
              }
            >
              {isOpen ? "OPEN" : "CLOSED"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        <Tabs defaultValue="loans" className="w-full">
          <TabsList className="mb-6 print-hide">
            <TabsTrigger
              value="loans"
              data-ocid="month_detail.loan_entries_tab"
            >
              Loan Entries
            </TabsTrigger>
            <TabsTrigger
              value="report"
              data-ocid="month_detail.monthly_report_tab"
            >
              Monthly Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="loans">
            <LoanEntriesTab month={month} />
          </TabsContent>

          <TabsContent value="report">
            <MonthlyReportTab month={month} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
