import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import type { AuditMonth } from "./backend.d";
import { AppLogin } from "./components/AppLogin";
import { MonthDetail } from "./components/MonthDetail";
import { MonthsDashboard } from "./components/MonthsDashboard";

export default function App() {
  // No persistence: every new browser session always requires login
  const [authed, setAuthed] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<AuditMonth | null>(null);

  if (!authed) {
    return (
      <>
        <Toaster richColors position="top-right" />
        <AppLogin onSuccess={() => setAuthed(true)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      {selectedMonth ? (
        <MonthDetail
          month={selectedMonth}
          onBack={() => setSelectedMonth(null)}
        />
      ) : (
        <MonthsDashboard
          onSelectMonth={setSelectedMonth}
          onLogout={() => {
            setAuthed(false);
          }}
        />
      )}
    </div>
  );
}
