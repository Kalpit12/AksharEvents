"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAdmin } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Calendar, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await loginAdmin(new FormData(e.currentTarget));
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl");
    const safeRedirect =
      callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : "/admin";

    toast.success("Welcome back!");
    router.push(safeRedirect);
    router.refresh();
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Calendar className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Event Master</CardTitle>
          <CardDescription>Sign in to manage events, members, and supplies</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required className="mt-1" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in to Event Master"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Exhibiting at an event?{" "}
            <Link href="/auth/exhibitor" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              <Building2 className="h-3.5 w-3.5" />
              Exhibitor portal
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
