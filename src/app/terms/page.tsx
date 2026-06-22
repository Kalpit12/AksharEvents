import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="prose dark:prose-invert mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl">Terms of Service</h1>
      <p>Last updated: June 2026</p>
      <p>By using AksharEvents, you agree to these terms.</p>
      <h2>Platform Use</h2>
      <p>AksharEvents provides an event discovery and booking platform. Users must provide accurate information and comply with applicable laws.</p>
      <h2>Ticket Purchases</h2>
      <p>Ticket purchases are subject to organizer policies. AksharEvents facilitates transactions but is not responsible for event cancellations or changes made by organizers.</p>
      <h2>Organizer Responsibilities</h2>
      <p>Event organizers are responsible for the accuracy of event information, fulfillment of tickets, and compliance with local regulations.</p>
      <h2>Limitation of Liability</h2>
      <p>AksharEvents is not liable for indirect, incidental, or consequential damages arising from platform use.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: legal@aksharevents.com</p>
    </div>
  );
}
