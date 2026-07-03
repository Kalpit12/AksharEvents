"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginExhibitor, registerExhibitor } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import type { OpenExhibitorEvent } from "@/lib/exhibitor-events";

type AuthMode = "signin" | "signup";

const mobileFieldClass = "mt-1.5 h-11 w-full min-w-0 text-base sm:h-10 sm:text-sm";
const mobileTextareaClass = "mt-1.5 w-full min-w-0 text-base sm:text-sm";
const mobileSelectClass = "mt-1.5 flex h-11 w-full min-w-0 rounded-lg border border-border bg-card px-3 text-base sm:h-10 sm:text-sm";

function formatEventLabel(event: OpenExhibitorEvent) {
  const dates = `${formatDate(event.startDate, "MMM d")} – ${formatDate(event.endDate, "MMM d, yyyy")}`;
  const location = event.city || event.venueName;
  return location ? `${event.title} · ${dates} · ${location}` : `${event.title} · ${dates}`;
}

export default function ExhibitorAuthForm({ openEvents }: { openEvents: OpenExhibitorEvent[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signin" ? "signin" : "signup";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await loginExhibitor(new FormData(e.currentTarget));
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Welcome back!");
    router.push("/exhibitor");
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!acceptedTerms) {
      toast.error("Please agree to the Terms and Conditions and Privacy Policy.");
      return;
    }

    setLoading(true);
    const result = await registerExhibitor(new FormData(e.currentTarget));
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if ("requiresLogin" in result && result.requiresLogin) {
      toast.success("Exhibitor account created! Please sign in.");
      setMode("signin");
      return;
    }

    toast.success("Exhibitor account created!");
    router.push("/exhibitor");
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-lg overflow-x-hidden px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
      <Card className="w-full min-w-0 border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="space-y-2 px-1 pb-3 pt-2 text-center sm:space-y-3 sm:px-6 sm:pb-4 sm:pt-6">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:h-12 sm:w-12">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <CardTitle className="text-lg sm:text-2xl">Exhibitor Portal</CardTitle>
          <CardDescription className="px-1 text-sm leading-relaxed">
            {mode === "signin"
              ? "Sign in to manage your exhibitor profile and event booths."
              : "Create your exhibitor account to showcase your company at events."}
          </CardDescription>
        </CardHeader>

        <CardContent className="min-w-0 px-1 pb-4 sm:px-6 sm:pb-6">
          <div
            className="mb-5 grid grid-cols-2 gap-2 sm:mb-6"
            role="tablist"
            aria-label="Exhibitor authentication"
          >
            <Button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              variant={mode === "signup" ? "default" : "outline"}
              className="min-h-11 w-full text-sm sm:flex-1"
              onClick={() => setMode("signup")}
            >
              Sign Up
            </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              variant={mode === "signin" ? "default" : "outline"}
              className="min-h-11 w-full text-sm sm:flex-1"
              onClick={() => setMode("signin")}
            >
              Sign In
            </Button>
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-4" autoComplete="on">
              <div className="min-w-0">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                  className={mobileFieldClass}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={mobileFieldClass}
                />
              </div>
              <Button type="submit" className="min-h-11 w-full text-base sm:text-sm" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-5 sm:space-y-6" autoComplete="on">
              <fieldset className="min-w-0 space-y-3 border-0 p-0 sm:space-y-4">
                <legend className="mb-1 text-sm font-semibold text-foreground">Event registration</legend>
                {openEvents.length === 0 ? (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
                    No events are open for exhibitor registration right now. Please check back later or contact the organizer.
                  </p>
                ) : (
                  <div className="min-w-0">
                    <Label htmlFor="eventId">Event / expo *</Label>
                    <select id="eventId" name="eventId" required className={mobileSelectClass}>
                      <option value="">Select the event you are exhibiting at</option>
                      {openEvents.map((event) => (
                        <option key={event.id} value={event.id}>
                          {formatEventLabel(event)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </fieldset>

              <fieldset className="min-w-0 space-y-3 border-0 p-0 sm:space-y-4">
                <legend className="mb-1 text-sm font-semibold text-foreground">Contact details</legend>
                <div className="min-w-0">
                  <Label htmlFor="name">Full name *</Label>
                  <Input id="name" name="name" autoComplete="name" required className={mobileFieldClass} />
                </div>
                <div className="min-w-0">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    required
                    className={mobileFieldClass}
                  />
                </div>
                <div className="min-w-0">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    placeholder="+254 7XX XXX XXX"
                    className={mobileFieldClass}
                  />
                </div>
              </fieldset>

              <fieldset className="min-w-0 space-y-3 border-0 p-0 sm:space-y-4">
                <legend className="mb-1 text-sm font-semibold text-foreground">Company details</legend>
                <div className="min-w-0">
                  <Label htmlFor="companyName">Company name *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    autoComplete="organization"
                    required
                    className={mobileFieldClass}
                  />
                </div>
                <div className="min-w-0">
                  <Label htmlFor="products">Products / services *</Label>
                  <Textarea
                    id="products"
                    name="products"
                    required
                    rows={3}
                    placeholder="One per line, e.g. Software, Cloud Services"
                    className={cn(mobileTextareaClass, "min-h-[80px] resize-y")}
                  />
                </div>
                <div className="min-w-0">
                  <Label htmlFor="description">Company description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Brief overview of your company"
                    className={cn(mobileTextareaClass, "min-h-[80px] resize-y")}
                  />
                </div>
                <div className="min-w-0">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    autoCapitalize="none"
                    placeholder="https://yourcompany.com"
                    className={mobileFieldClass}
                  />
                </div>
              </fieldset>

              <fieldset className="min-w-0 space-y-3 border-0 p-0 sm:space-y-4">
                <legend className="mb-1 text-sm font-semibold text-foreground">Account security</legend>
                <div className="min-w-0">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className={mobileFieldClass}
                  />
                </div>
                <div className="min-w-0">
                  <Label htmlFor="confirmPassword">Confirm password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className={mobileFieldClass}
                  />
                </div>
              </fieldset>

              <div className="flex items-start gap-3">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  required
                  className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary"
                />
                <Label htmlFor="acceptTerms" className="text-sm font-normal leading-relaxed text-muted-foreground">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="font-medium text-primary hover:underline">
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className="font-medium text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </Label>
              </div>

              <Button
                type="submit"
                className="min-h-11 w-full text-base sm:text-sm"
                disabled={loading || openEvents.length === 0 || !acceptedTerms}
              >
                {loading ? "Creating account..." : (
                  <>
                    <span className="sm:hidden">Create Account</span>
                    <span className="hidden sm:inline">Create Exhibitor Account</span>
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground sm:mt-5">
            <p className="leading-relaxed">
              {mode === "signin" ? (
                <>
                  New exhibitor?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-medium text-primary hover:underline"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="font-medium text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
