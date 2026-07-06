"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkBoothKioskSession,
  checkInAtKiosk,
  lockBoothKiosk,
  unlockBoothKiosk,
  type KioskCheckInResult,
} from "@/lib/booth-kiosk-actions";
import { BoothKioskRegisterForm } from "@/components/booth/booth-kiosk-register-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Calendar,
  Camera,
  CameraOff,
  CheckCircle,
  IdCard,
  Lock,
  MapPin,
  ScanLine,
  XCircle,
} from "lucide-react";

export type BoothKioskEventInfo = {
  title: string;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  venueName: string | null;
  venueCity: string | null;
};

export type BoothKioskRegistrationInfo = {
  ticketTypeId: string;
  ticketName: string;
  ticketTier: string;
  ticketPrice: number;
  available: boolean;
};

type BoothTab = "register" | "scan";

type Props = {
  eventSlug: string;
  eventId: string;
  event: BoothKioskEventInfo;
  registration: BoothKioskRegistrationInfo;
};

const RESET_DELAY_MS = 5000;

export function BoothKioskClient({ eventSlug, eventId, event, registration }: Props) {
  const [tab, setTab] = useState<BoothTab>("register");
  const [unlocked, setUnlocked] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<KioskCheckInResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const containerId = "booth-kiosk-scanner";

  const dateRange = `${formatDate(event.startDate, "d MMM yyyy")} – ${formatDate(event.endDate, "d MMM yyyy")}`;
  const location = event.venueCity ?? event.venueName ?? "Kenya";

  useEffect(() => {
    void checkBoothKioskSession(eventSlug, eventId).then((res) => {
      setUnlocked(res.unlocked);
      setCheckingSession(false);
    });
  }, [eventSlug, eventId]);

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
      const trimmed = qrData.trim();
      if (!trimmed) return;

      setLoading(true);
      const res = await checkInAtKiosk(eventSlug, eventId, trimmed);
      setLoading(false);
      setResult(res);

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      if (res.alreadyCheckedIn) {
        toast.warning("Already checked in");
      } else {
        toast.success("Visitor checked in!");
      }

      window.setTimeout(() => {
        setResult(null);
        setManualCode("");
      }, RESET_DELAY_MS);
    },
    [eventSlug, eventId]
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      await stopCamera();
      setCameraOn(true);
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
      toast.error("Camera unavailable — use manual entry");
      await stopCamera();
    }
  }, [handleScan, stopCamera]);

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (tab !== "scan" && cameraOn) {
      void stopCamera();
    }
  }, [tab, cameraOn, stopCamera]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlocking(true);
    const res = await unlockBoothKiosk(eventSlug, eventId, password);
    setUnlocking(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    setUnlocked(true);
    setPassword("");
    toast.success("Unlocked");
  };

  const handleLock = async () => {
    await stopCamera();
    await lockBoothKiosk(eventSlug);
    setUnlocked(false);
    setResult(null);
  };

  const switchTab = (next: BoothTab) => {
    setTab(next);
    if (next !== "scan") {
      void stopCamera();
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <header className="mb-4 rounded-2xl border border-champagne/40 bg-gradient-to-r from-card to-muted/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Event</p>
          <h1 className="mt-1 text-lg font-bold leading-tight">{event.title}</h1>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {dateRange}
            </p>
            <p className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {location}
            </p>
          </div>
        </header>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-primary" />
              Staff password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Enter the on-site password from your event organizer to register visitors or check in
              passes.
            </p>
            <form onSubmit={handleUnlock} className="space-y-4">
              <Input
                type="password"
                placeholder="Staff password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="text-base"
              />
              <Button type="submit" className="w-full" disabled={unlocking || !password}>
                {unlocking ? "Unlocking…" : "Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:max-w-5xl">
      <header className="mb-4 rounded-2xl border border-champagne/40 bg-gradient-to-r from-card to-muted/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">On-site</p>
            <h1 className="mt-1 text-lg font-bold leading-tight">{event.title}</h1>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {dateRange}
              </p>
              <p className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {location}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void handleLock()}>
            <Lock className="h-4 w-4" />
            Lock
          </Button>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => switchTab("register")}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            tab === "register"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <IdCard className="h-4 w-4" />
          Register
        </button>
        <button
          type="button"
          onClick={() => switchTab("scan")}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            tab === "scan"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ScanLine className="h-4 w-4" />
          Check in
        </button>
      </div>

      {tab === "register" ? (
        registration.available ? (
          <BoothKioskRegisterForm
            eventSlug={eventSlug}
            eventId={eventId}
            eventTitle={event.title}
            eventBadge={{
              title: event.title,
              startDate: event.startDate,
              endDate: event.endDate,
              venueName: event.venueName,
              venueCity: event.venueCity,
            }}
            ticketName={registration.ticketName}
            ticketTier={registration.ticketTier}
            ticketPrice={registration.ticketPrice}
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Visitor registration is not open for this event yet.
            </CardContent>
          </Card>
        )
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Camera</CardTitle>
              {cameraOn ? (
                <Button type="button" variant="outline" size="sm" onClick={() => void stopCamera()}>
                  <CameraOff className="h-4 w-4" />
                  Stop
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={() => void startCamera()}>
                  <Camera className="h-4 w-4" />
                  Start
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                id={containerId}
                className={`overflow-hidden rounded-xl bg-muted ${cameraOn ? "min-h-[260px] w-full" : "hidden"}`}
              />
              {!cameraOn && (
                <p className="text-center text-sm text-muted-foreground">
                  Point the camera at the visitor&apos;s QR code on their pass or email.
                </p>
              )}
              {cameraError && <p className="text-sm text-red-600">{cameraError}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manual entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Paste QR data or booking number"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="text-base"
              />
              <Button
                className="w-full"
                onClick={() => void handleScan(manualCode)}
                disabled={loading || !manualCode.trim()}
              >
                {loading ? "Checking in…" : "Check in visitor"}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card
              className={`border-2 ${"error" in result ? "border-red-200" : "border-green-200"}`}
            >
              <CardContent className="p-5">
                {"error" in result ? (
                  <div className="flex items-center gap-3 text-red-600">
                    <XCircle className="h-8 w-8 shrink-0" />
                    <div>
                      <p className="font-semibold">Could not check in</p>
                      <p className="text-sm">{result.error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <CheckCircle
                      className={`h-8 w-8 shrink-0 ${
                        result.alreadyCheckedIn ? "text-amber-500" : "text-green-600"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold">{result.visitor.name}</p>
                      {result.visitor.designation && (
                        <p className="text-sm font-medium text-primary">{result.visitor.designation}</p>
                      )}
                      {result.visitor.company && (
                        <p className="text-sm text-muted-foreground">{result.visitor.company}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{result.visitor.email}</p>
                      <p className="mt-1 font-mono text-xs">#{result.visitor.bookingNumber}</p>
                      {result.alreadyCheckedIn ? (
                        <Badge variant="warning" className="mt-3">
                          Already checked in
                        </Badge>
                      ) : (
                        <Badge className="mt-3 bg-green-100 text-green-800 hover:bg-green-100">
                          Checked in
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
