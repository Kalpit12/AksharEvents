"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyTicket, type TicketVerifyResult } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  CustomSelect,
} from "@/components/exhibitor-portal/custom-select";
import { toast } from "sonner";
import { Camera, CameraOff, CheckCircle, ScanLine, XCircle } from "lucide-react";

type EventOption = { id: string; title: string };

type ScanResult = TicketVerifyResult;

export function TicketScannerClient({ events }: { events: EventOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get("eventId") ?? events[0]?.id ?? "";
  const [eventId, setEventId] = useState(initialEventId);
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const containerId = "ticket-scanner-viewfinder";

  const eventOptions = events.map((e) => ({ value: e.id, label: e.title }));

  const syncEventInUrl = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set("eventId", id);
      else params.delete("eventId");
      router.replace(`/admin/scanner?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

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

  const handleVerify = useCallback(
    async (qrData: string) => {
      if (!eventId) {
        toast.error("Select an event first");
        return;
      }

      const trimmed = qrData.trim();
      if (!trimmed) return;

      setLoading(true);
      const res = await verifyTicket(trimmed, eventId);
      setLoading(false);
      setResult(res);

      if ("error" in res) toast.error(res.error);
      else if ("alreadyCheckedIn" in res && res.alreadyCheckedIn) toast.warning("Already checked in");
      else if ("exhibitor" in res && res.exhibitor) {
        if ("alreadyCheckedIn" in res && res.alreadyCheckedIn) toast.warning("Exhibitor already checked in");
        else toast.success("Exhibitor check-in successful!");
      } else toast.success("Check-in successful!");
    },
    [eventId]
  );

  const startCamera = useCallback(async () => {
    if (!eventId) {
      toast.error("Select an event before scanning");
      return;
    }

    setCameraError(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      await stopCamera();
      setCameraOn(true);

      // Viewfinder must be visible before the scanner binds to the camera stream.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          aspectRatio: 1,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.max(180, Math.floor(edge * 0.72));
            return { width: size, height: size };
          },
        },
        (decoded) => {
          void handleVerify(decoded);
        },
        () => {
          // ignore per-frame scan misses
        }
      );
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : "";
      const isPolicyBlock =
        errMessage.includes("Permissions policy") ||
        errMessage.includes("permission policy") ||
        errMessage.includes("not allowed in this document");
      const isUserDenial =
        errMessage.includes("NotAllowed") || errMessage.includes("Permission");

      const message = isPolicyBlock
        ? "Camera blocked by browser policy. Open the scanner in a new tab (full page reload), then try again."
        : isUserDenial
          ? "Camera permission denied. Allow camera access in your browser settings, then try again."
          : errMessage || "Could not access camera";
      setCameraError(message);
      toast.error(
        isPolicyBlock
          ? "Reload scanner page to enable camera"
          : "Camera unavailable — use manual entry"
      );
      await stopCamera();
    }
  }, [eventId, handleVerify, stopCamera]);

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (cameraOn) {
      void stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart camera when event changes
  }, [eventId]);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold">
        <ScanLine className="h-6 w-6 text-primary" />
        Ticket Scanner
      </h1>
      <p className="mb-6 text-muted-foreground">
        Scan visitor passes at the entrance to record check-ins.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Event</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No published events available.</p>
          ) : (
            <CustomSelect
              value={eventId}
              onChange={(value) => {
                setEventId(value);
                syncEventInUrl(value);
              }}
              options={eventOptions}
              placeholder="Select event"
            />
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Camera scan</CardTitle>
          {cameraOn ? (
            <Button type="button" variant="outline" size="sm" onClick={() => void stopCamera()}>
              <CameraOff className="h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => void startCamera()}
              disabled={!eventId || events.length === 0}
            >
              <Camera className="h-4 w-4" />
              Start camera
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            id={containerId}
            className={`overflow-hidden rounded-xl bg-muted ${cameraOn ? "min-h-[280px] w-full" : "hidden"}`}
          />
          {!cameraOn && (
            <p className="text-center text-sm text-muted-foreground">
              Point the camera at a visitor&apos;s QR code on their pass or email.
            </p>
          )}
          {cameraError && <p className="text-sm text-red-600">{cameraError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manual entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Paste QR data or booking number"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={() => void handleVerify(manualCode)}
            disabled={loading || !manualCode}
          >
            {loading ? "Verifying..." : "Verify ticket"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className={`mt-6 ${result && "error" in result ? "border-red-200" : "border-green-200"}`}>
          <CardContent className="p-6">
            {"error" in result ? (
              <div className="flex items-center gap-3 text-red-600">
                <XCircle className="h-8 w-8 shrink-0" />
                <div>
                  <p className="font-semibold">Verification failed</p>
                  <p className="text-sm">{result.error}</p>
                </div>
              </div>
            ) : "booking" in result && result.booking ? (
              <div className="flex items-start gap-3">
                <CheckCircle
                  className={`h-8 w-8 shrink-0 ${
                    "alreadyCheckedIn" in result && result.alreadyCheckedIn
                      ? "text-amber-500"
                      : "text-green-600"
                  }`}
                />
                  <div className="flex-1">
                  <p className="text-lg font-semibold">{result.booking.name}</p>
                  {result.booking.designation && (
                    <p className="text-sm font-medium text-primary">{result.booking.designation}</p>
                  )}
                  {"company" in result.booking && result.booking.company && (
                    <p className="text-sm text-muted-foreground">{result.booking.company}</p>
                  )}
                  {"booth" in result.booking && result.booking.booth && (
                    <p className="text-sm text-muted-foreground">Booth {result.booking.booth}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{result.booking.email}</p>
                    <p className="mt-1 text-sm">#{result.booking.number}</p>
                    {result.booking.tickets && (
                      <div className="mt-2 space-y-1">
                        {result.booking.tickets.map((t, i) => (
                          <Badge key={i} variant="outline">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {"alreadyCheckedIn" in result && result.alreadyCheckedIn && (
                      <Badge variant="warning" className="mt-3">
                        Already checked in
                      </Badge>
                    )}
                  </div>
                </div>
              ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
