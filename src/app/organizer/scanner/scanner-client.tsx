"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyTicket } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { ScanLine, CheckCircle, XCircle } from "lucide-react";

export default function ScannerClient() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") || "";
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<{
    success?: boolean;
    alreadyCheckedIn?: boolean;
    error?: string;
    booking?: {
      number: string;
      name: string;
      email: string;
      tickets?: string[];
      checkedInAt?: Date | null;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (qrData: string) => {
    if (!eventId) {
      toast.error("Please select an event first");
      return;
    }

    setLoading(true);
    const res = await verifyTicket(qrData, eventId);
    setLoading(false);
    setResult(res);

    if (res.error) toast.error(res.error);
    else if (res.alreadyCheckedIn) toast.warning("Already checked in");
    else toast.success("Check-in successful!");
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <ScanLine className="h-6 w-6 text-primary" />
        Ticket Scanner
      </h1>
      <p className="text-muted-foreground mb-6">Scan or enter QR code to verify tickets</p>

      {!eventId && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-800">
            Add <code>?eventId=YOUR_EVENT_ID</code> to the URL to start scanning.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manual Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Paste QR code data or booking number"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={() => handleVerify(manualCode)}
            disabled={loading || !manualCode}
          >
            {loading ? "Verifying..." : "Verify Ticket"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className={`mt-6 ${result.error ? "border-red-200" : "border-green-200"}`}>
          <CardContent className="p-6">
            {result.error ? (
              <div className="flex items-center gap-3 text-red-600">
                <XCircle className="h-8 w-8" />
                <div>
                  <p className="font-semibold">Verification Failed</p>
                  <p className="text-sm">{result.error}</p>
                </div>
              </div>
            ) : result.booking && (
              <div className="flex items-start gap-3">
                <CheckCircle className={`h-8 w-8 ${result.alreadyCheckedIn ? "text-amber-500" : "text-green-600"}`} />
                <div className="flex-1">
                  <p className="font-semibold text-lg">{result.booking.name}</p>
                  <p className="text-sm text-muted-foreground">{result.booking.email}</p>
                  <p className="text-sm mt-1">#{result.booking.number}</p>
                  {result.booking.tickets && (
                    <div className="mt-2 space-y-1">
                      {result.booking.tickets.map((t, i) => (
                        <Badge key={i} variant="outline">{t}</Badge>
                      ))}
                    </div>
                  )}
                  {result.alreadyCheckedIn && (
                    <Badge variant="warning" className="mt-3">Already Checked In</Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
