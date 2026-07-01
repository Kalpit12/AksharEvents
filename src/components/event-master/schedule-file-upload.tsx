"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, Upload } from "lucide-react";

type Props = {
  eventId: string;
  kind: "tour-travel" | "event-schedule";
  replaceItineraryId?: string | null;
  disabled?: boolean;
  onImport: (formData: FormData) => Promise<{ error?: string; message?: string }>;
};

export function ScheduleFileUpload({
  eventId,
  kind,
  replaceItineraryId,
  disabled,
  onImport,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [replaceCurrent, setReplaceCurrent] = useState(Boolean(replaceItineraryId));
  const [busy, setBusy] = useState(false);

  const handleImport = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("eventId", eventId);
      formData.set("file", file);
      if (kind === "tour-travel" && replaceCurrent && replaceItineraryId) {
        formData.set("replaceItineraryId", replaceItineraryId);
      }

      const result = await onImport(formData);
      if (result.error) {
        return result;
      }

      if (inputRef.current) inputRef.current.value = "";
      setFileName("");
      return result;
    } finally {
      setBusy(false);
    }
  };

  const title =
    kind === "tour-travel" ? "Import tour & travel schedule" : "Import event schedule";
  const hint =
    kind === "tour-travel"
      ? "Upload a yatra-style Excel with Day, Date, Time, Place columns (like Keshav Nilkanth Yatra)."
      : "Upload Excel/CSV with Title, Start, End, Location — or the same Day/Date/Time/Place travel format.";

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label
          className={cn(
            "flex min-h-10 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">
            {fileName || "Choose .xlsx, .xls, or .csv file"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="sr-only"
            disabled={disabled || busy}
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          />
        </label>
        <Button
          type="button"
          disabled={disabled || busy || !fileName}
          onClick={() => void handleImport()}
        >
          {busy ? "Importing…" : "Import file"}
        </Button>
      </div>

      {kind === "tour-travel" && replaceItineraryId ? (
        <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={replaceCurrent}
            onChange={(e) => setReplaceCurrent(e.target.checked)}
            disabled={disabled || busy}
          />
          Replace the currently selected trip instead of creating a new one
        </label>
      ) : null}
    </div>
  );
}
