import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about AksharEvents.",
};

const faqs = [
  { q: "How do I book tickets?", a: "Browse events, select your ticket type, fill in your details, and complete checkout. Free tickets are confirmed instantly; paid tickets go through Stripe payment." },
  { q: "Can I get a refund?", a: "Ticket refund policies are set by event organizers. Generally, tickets are non-refundable but transferable to another person." },
  { q: "How do I become an event organizer?", a: "Register as an Organizer during sign-up or switch your account type. You can then create events, manage tickets, and scan QR codes at your events." },
  { q: "What payment methods are accepted?", a: "We accept card payments via Stripe, including Visa, Mastercard, and mobile money where supported." },
  { q: "How does QR ticket verification work?", a: "After booking, you receive a QR code via email and in your dashboard. Show it at the event entrance for organizers to scan and verify." },
  { q: "Is AksharEvents available outside Kenya?", a: "Yes! While based in Kenya, we support events across Africa with multi-currency support planned." },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Frequently Asked Questions</h1>
      <p className="text-muted-foreground mb-10">Everything you need to know about AksharEvents</p>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold text-lg">{faq.q}</h2>
            <p className="text-muted-foreground mt-2">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
