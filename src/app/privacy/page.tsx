import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="prose dark:prose-invert mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl">Privacy Policy</h1>
      <p>Last updated: June 2026</p>
      <p>AksharEvents (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.</p>
      <h2>Information We Collect</h2>
      <p>We collect information you provide directly: name, email, phone number, payment details, and event preferences. We also collect usage data through cookies and analytics.</p>
      <h2>How We Use Your Information</h2>
      <ul>
        <li>Process ticket bookings and payments</li>
        <li>Send event confirmations and reminders</li>
        <li>Provide personalized event recommendations</li>
        <li>Improve our platform and services</li>
      </ul>
      <h2>Data Security</h2>
      <p>We implement industry-standard security measures including encryption, secure payment processing via Stripe, and role-based access controls.</p>
      <h2>Contact</h2>
      <p>For privacy inquiries, contact us at privacy@aksharevents.com</p>
    </div>
  );
}
