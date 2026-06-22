"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ContactBackground } from "@/components/contact/contact-background";
import { toast } from "sonner";
import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";

const contactDetails = [
  {
    icon: Mail,
    label: "Email",
    value: "helpdesk@maxproinfotech.com",
    href: "mailto:helpdesk@maxproinfotech.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+254 786 658 200",
    href: "tel:+254786658200",
  },
  {
    icon: MapPin,
    label: "Office",
    value: "Suite 14th – 5th floor, Parksuite Towers, Parklands Road, Nairobi, Kenya",
    href: undefined,
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon – Fri, 9:00 AM – 5:00 PM · Sat, 9:00 AM – 1:00 PM EAT",
    href: undefined,
  },
] as const;

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    toast.success("Message sent! We'll get back to you soon.");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <ContactBackground />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {/* Header */}
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-champagne-dark">
            <MessageSquare className="h-3.5 w-3.5" />
            Get in touch
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl sm:text-4xl">Contact Us</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Whether you&apos;re planning an event, need exhibitor support, or have a question — our team is here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-12">
          {/* Contact info */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {contactDetails.map((item) => {
                const Icon = item.icon;
                const content = (
                  <div className="flex gap-4 rounded-2xl border border-border/80 bg-card/70 p-5 shadow-sm backdrop-blur-sm transition-all hover:border-champagne/40 hover:bg-card/85 hover:shadow-md dark:border-champagne/15 dark:bg-card/60 dark:hover:border-champagne/35 dark:hover:bg-card/75">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-champagne/25 bg-champagne/10 text-champagne-dark dark:border-champagne/35 dark:bg-champagne/15 dark:text-champagne-light">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                );

                return item.href ? (
                  <a key={item.label} href={item.href} className="block group">
                    {content}
                  </a>
                ) : (
                  <div key={item.label}>{content}</div>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-champagne/25 bg-espresso p-6 text-alabaster dark:border-champagne/30 dark:bg-card/90 dark:shadow-inner lg:mt-8">
              <p className="text-sm font-medium text-champagne-light dark:text-champagne">Based in Nairobi</p>
              <p className="mt-2 text-sm leading-relaxed text-alabaster/75 dark:text-muted-foreground">
                AksharEvents connects organizers, exhibitors, and attendees across Kenya and Africa — from career fairs to conferences and expos.
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="border-border/80 bg-card/85 shadow-lg backdrop-blur-sm dark:border-champagne/15 dark:bg-card/75 lg:col-span-3">
            <CardHeader className="border-b border-border/60 pb-6">
              <CardTitle className="text-xl">Send a Message</CardTitle>
              <p className="text-sm text-muted-foreground">
                Fill in the form below and we&apos;ll respond within one business day.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" name="message" required rows={6} className="mt-1.5" />
                </div>
                <Button type="submit" disabled={loading} size="lg">
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
