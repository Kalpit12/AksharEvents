"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  scanExhibitorBoothVisitor,
  type ExhibitorBoothScanResult,
} from "@/lib/exhibitor-booth-visit-actions";
import type { ExhibitorBoothVisitRecord } from "@/lib/exhibitor-booth-visits";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import {
  Camera,
  CameraOff,
  CheckCircle,
  Download,
  IdCard,
  ScanLine,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/exhibitor-portal/exhibitor-portal-ui";

type Props = {
  eventExhibitorId: string | null;
  visitorCount: number;
  records: ExhibitorBoothVisitRecord[];
  boothLabel: string | null;
  companyName: string;
};

type ScanStatus =
  | { kind: "success"; visitor: ExhibitorBoothVisitRecord }
  | { kind: "duplicate"; visitor: ExhibitorBoothVisitRecord }
  | { kind: "error"; message: string };

const SCAN_COOLDOWN_MS = 5000;
const SCANNER_CONTAINER_ID = "exhibitor-booth-scanner";

function normalizeScanKey(qrData: string) {
  const trimmed = qrData.trim();
  if (!trimmed) return "";
  try {
    const payload = JSON.parse(trimmed) as { booking?: string };
    if (payload.booking) return payload.booking.trim();
  } catch {
    // use raw value
  }
  return trimmed;
}

function visitorFromScanResult(
  result: Extract<ExhibitorBoothScanResult, { success: true }>
): ExhibitorBoothVisitRecord {
  return {
    id: `scan-${result.visitor.bookingNumber}`,
    bookingNumber: result.visitor.bookingNumber,
    attendeeName: result.visitor.name,
    attendeeEmail: result.visitor.email,
    attendeeCompany: result.visitor.company,
    attendeeDesignation: result.visitor.designation,
    scannedAt: result.visitor.scannedAt,
  };
}

function exportBoothVisitorsExcel(
  records: ExhibitorBoothVisitRecord[],
  companyName: string,
  boothLabel: string | null
) {
  const rows = records.map((row) => ({
    Name: row.attendeeName,
    Email: row.attendeeEmail,
    Company: row.attendeeCompany ?? "",
    Designation: row.attendeeDesignation ?? "",
    "Booking #": row.bookingNumber,
    "Checked in": formatDate(row.scannedAt, "d MMM yyyy HH:mm"),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Booth visitors");

  const safeCompany = companyName.replace(/[^\w.-]+/g, "_").slice(0, 40);
  const boothPart = boothLabel ? `_${boothLabel.replace(/[^\w.-]+/g, "_")}` : "";
  const filename = `booth-visitors_${safeCompany}${boothPart}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function ExhibitorBoothCheckInsPanel({
  eventExhibitorId,
  visitorCount,
  records: initialRecords,
  boothLabel,
  companyName,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState(initialRecords);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const lastHandledRef = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (row) =>
        row.attendeeName.toLowerCase().includes(q) ||
        row.attendeeEmail.toLowerCase().includes(q) ||
        row.attendeeCompany?.toLowerCase().includes(q) ||
        row.bookingNumber.toLowerCase().includes(q)
    );
  }, [query, records]);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      setCameraOn(false);
      return;
    }
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      // ignore teardown errors
    }
    scannerRef.current = null;
    setCameraOn(false);
  }, []);

  const handleScan = useCallback(
    async (qrData: string) => {
      if (!eventExhibitorId) {
        setScanStatus({ kind: "error", message: "Select your event before scanning visitors." });
        return;
      }

      const scanKey = normalizeScanKey(qrData);
      if (!scanKey) return;

      const now = Date.now();
      const last = lastHandledRef.current;
      if (last && last.key === scanKey && now - last.at < SCAN_COOLDOWN_MS) {
        return;
      }

      if (processingRef.current) return;
      processingRef.current = true;
      setLoading(true);

      const res = await scanExhibitorBoothVisitor(eventExhibitorId, qrData);
      setLoading(false);
      processingRef.current = false;

      if ("error" in res) {
        lastHandledRef.current = { key: scanKey, at: Date.now() };
        setScanStatus({ kind: "error", message: res.error });
        return;
      }

      lastHandledRef.current = { key: scanKey, at: Date.now() };
      const visitor = visitorFromScanResult(res);

      if (res.alreadyScanned) {
        setScanStatus({ kind: "duplicate", visitor });
      } else {
        setScanStatus({ kind: "success", visitor });
        setRecords((prev) => {
          if (prev.some((row) => row.bookingNumber === visitor.bookingNumber)) {
            return prev;
          }
          return [visitor, ...prev];
        });
        router.refresh();
      }
    },
    [eventExhibitorId, router]
  );

  const startCamera = useCallback(async () => {
    if (!eventExhibitorId) {
      setScanStatus({ kind: "error", message: "Select your event before scanning visitors." });
      return;
    }

    setCameraError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      await stopCamera();
      setCameraOn(true);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const scanner = new Html5Qrcode(SCANNER_CONTAINER_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 8,
          aspectRatio: 1,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.max(180, Math.floor(edge * 0.72));
            return { width: size, height: size };
          },
        },
        (decoded) => {
          void handleScan(decoded);
        },
        () => {}
      );
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : "";
      const message =
        errMessage.includes("NotAllowed") || errMessage.includes("Permission")
          ? "Camera permission denied. Allow camera access or use manual entry."
          : errMessage || "Could not access camera";
      setCameraError(message);
      await stopCamera();
    }
  }, [eventExhibitorId, handleScan, stopCamera]);

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error("No visitors to export");
      return;
    }
    exportBoothVisitorsExcel(filtered, companyName, boothLabel);
    toast.success("Excel file downloaded");
  };

  const totalCount = Math.max(visitorCount, records.length);

  return (
    <div className="space-y-4">
      <Panel title="Booth visitor check-ins" icon={IdCard}>
        <p className="text-sm text-muted-foreground">
          Scan visitor badges at your booth{boothLabel ? ` (${boothLabel})` : ""}. Each visitor is
          recorded once — repeat scans show as already checked in.
        </p>
      </Panel>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-5 w-5 text-primary" />
            Scan visitor badge
          </CardTitle>
          {cameraOn ? (
            <Button type="button" variant="outline" size="sm" onClick={() => void stopCamera()}>
              <CameraOff className="h-4 w-4" />
              Stop camera
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={() => void startCamera()} disabled={!eventExhibitorId}>
              <Camera className="h-4 w-4" />
              Start camera
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {scanStatus && (
            <div
              className={`rounded-xl border-2 p-4 ${
                scanStatus.kind === "error"
                  ? "border-red-200 bg-red-50"
                  : scanStatus.kind === "duplicate"
                    ? "border-amber-200 bg-amber-50"
                    : "border-green-200 bg-green-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {scanStatus.kind === "error" ? (
                  <XCircle className="h-7 w-7 shrink-0 text-red-600" />
                ) : (
                  <CheckCircle
                    className={`h-7 w-7 shrink-0 ${
                      scanStatus.kind === "duplicate" ? "text-amber-600" : "text-green-600"
                    }`}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {scanStatus.kind === "error"
                      ? "Could not check in"
                      : scanStatus.kind === "duplicate"
                        ? "Already checked in at this booth"
                        : "Checked in successfully"}
                  </p>
                  {scanStatus.kind === "error" ? (
                    <p className="mt-1 text-sm text-red-700">{scanStatus.message}</p>
                  ) : (
                    <>
                      <p className="mt-1 text-lg font-semibold">{scanStatus.visitor.attendeeName}</p>
                      {scanStatus.visitor.attendeeDesignation && (
                        <p className="text-sm font-medium text-primary">
                          {scanStatus.visitor.attendeeDesignation}
                        </p>
                      )}
                      {scanStatus.visitor.attendeeCompany && (
                        <p className="text-sm text-muted-foreground">
                          {scanStatus.visitor.attendeeCompany}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">{scanStatus.visitor.attendeeEmail}</p>
                      <p className="mt-1 font-mono text-xs">#{scanStatus.visitor.bookingNumber}</p>
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setScanStatus(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          <div
            id={SCANNER_CONTAINER_ID}
            className={`overflow-hidden rounded-xl bg-muted ${cameraOn ? "min-h-[260px] w-full" : "hidden"}`}
          />
          {!cameraOn && (
            <p className="text-center text-sm text-muted-foreground">
              Point the camera at the visitor&apos;s QR code on their badge or email.
            </p>
          )}
          {cameraError && <p className="text-sm text-red-600">{cameraError}</p>}

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">Manual entry</p>
            <Input
              placeholder="Paste QR data or booking number"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="text-base"
            />
            <Button
              className="w-full"
              onClick={() => void handleScan(manualCode)}
              disabled={loading || !manualCode.trim() || !eventExhibitorId}
            >
              {loading ? "Checking in…" : "Check in visitor"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Visitors at your booth</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              {totalCount} total
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={filtered.length === 0}
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              Download Excel
            </Button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, company, or booking #"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {totalCount === 0
              ? "No booth visitors recorded yet. Scan a visitor badge above."
              : "No matches for your search."}
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Visitor</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Designation</th>
                    <th className="px-4 py-3 font-medium">Booking</th>
                    <th className="px-4 py-3 font-medium">Checked in</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.attendeeName}</p>
                        <p className="text-xs text-muted-foreground">{row.attendeeEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.attendeeCompany ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.attendeeDesignation ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{row.bookingNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(row.scannedAt, "d MMM yyyy HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {filtered.map((row) => (
                <article key={row.id} className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{row.attendeeName}</p>
                      <p className="truncate text-sm text-muted-foreground">{row.attendeeEmail}</p>
                    </div>
                    <Badge className="shrink-0 bg-green-100 text-green-800 hover:bg-green-100">
                      Checked in
                    </Badge>
                  </div>
                  <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Company
                      </dt>
                      <dd>{row.attendeeCompany ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Designation
                      </dt>
                      <dd>{row.attendeeDesignation ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Booking
                      </dt>
                      <dd className="font-mono text-xs">{row.bookingNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Checked in
                      </dt>
                      <dd>{formatDate(row.scannedAt, "d MMM yyyy HH:mm")}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
