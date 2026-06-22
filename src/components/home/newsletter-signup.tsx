"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import Ferrofluid from "@/components/ferrofluid/Ferrofluid";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await subscribeNewsletter(email);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Subscribed successfully!");
      setEmail("");
    }
  };

  return (
    <section className="relative min-h-[320px] overflow-hidden bg-espresso py-16 sm:min-h-[360px]">
      <Ferrofluid
        colors={["#1C1A17", "#C5A880", "#EFECE6"]}
        speed={0.5}
        scale={1.6}
        turbulence={1}
        fluidity={0.1}
        rimWidth={0.2}
        sharpness={2.5}
        shimmer={1.5}
        glow={2}
        flowDirection="down"
        opacity={1}
        mouseInteraction
        mouseStrength={1}
        mouseRadius={0.35}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <Mail className="h-10 w-10 text-champagne-light mx-auto mb-4" />
        <h2 className="text-2xl sm:text-3xl font-bold text-alabaster">Stay in the Loop</h2>
        <p className="mt-2 text-champagne-light/80">
          Get notified about upcoming career fairs, conferences, and exclusive events across Kenya and Africa.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-alabaster/10 border-champagne/30 text-alabaster placeholder:text-champagne-light/60 backdrop-blur-sm"
          />
          <Button type="submit" disabled={loading} className="shrink-0">
            {loading ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  );
}
