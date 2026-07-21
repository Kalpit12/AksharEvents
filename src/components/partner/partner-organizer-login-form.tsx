"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginPartnerOrganizer } from "@/lib/partner-organizer-actions";
import { partnerPath } from "@/lib/partners";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { LayoutDashboard } from "lucide-react";
import { toast } from "sonner";

export function PartnerOrganizerLoginForm({
  partnerSlug,
  partnerName,
}: {
  partnerSlug: string;
  partnerName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const dashboardPath = partnerPath(partnerSlug, "/organizer");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("partnerSlug", partnerSlug);
    const result = await loginPartnerOrganizer(formData);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Welcome to ${partnerName}`);
    router.push(dashboardPath);
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center px-4 py-10">
      <Card className="w-full border-[color-mix(in_oklab,var(--partner-primary)_25%,transparent)]">
        <CardHeader className="text-center">
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: "var(--partner-primary)" }}
          >
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">{partnerName}</CardTitle>
          <CardDescription>Organizer sign in to manage exhibitors and booth assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[var(--partner-primary)] text-white hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in to organizer dashboard"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href={partnerPath(partnerSlug)} className="font-medium text-[var(--partner-primary)] hover:underline">
              Back to {partnerName}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
