import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import type { AuditMonth } from "./backend.d";
import { MonthDetail } from "./components/MonthDetail";
import { MonthsDashboard } from "./components/MonthsDashboard";

export default function App() {
  const [selectedMonth, setSelectedMonth] = useState<AuditMonth | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      {selectedMonth ? (
        <MonthDetail
          month={selectedMonth}
          onBack={() => setSelectedMonth(null)}
        />
      ) : (
        <MonthsDashboard onSelectMonth={setSelectedMonth} />
      )}
    </div>
  );
}
