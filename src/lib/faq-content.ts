export type FaqItem = {
  q: string;
  a: string;
};

export type FaqSection = {
  id: string;
  title: string;
  description: string;
  faqs: FaqItem[];
};

export const faqSections: FaqSection[] = [
  {
    id: "general",
    title: "General",
    description: "Event discovery, ticketing, and platform basics.",
    faqs: [
      {
        q: "What is Axar Events?",
        a: "Axar Events is Kenya's premier event discovery and booking platform. Attendees can browse and book tickets for career fairs, conferences, expos, and networking events. Organisers can create events, manage registrations, and verify tickets with QR codes.",
      },
      {
        q: "How do I book tickets?",
        a: "Browse events on the Events page, select your ticket type, fill in your details, and complete checkout. Free tickets are confirmed instantly; paid tickets are processed securely through Stripe.",
      },
      {
        q: "Can I get a refund?",
        a: "Refund policies are set by each event organiser. In most cases, tickets are non-refundable but may be transferable to another person. Check the event page or contact the organiser for specific terms.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept card payments via Stripe, including Visa and Mastercard. Mobile money support is available where configured for an event.",
      },
      {
        q: "How does QR ticket verification work?",
        a: "After booking, you receive a QR code by email and in your dashboard. Present it at the event entrance for organisers to scan and verify your entry.",
      },
      {
        q: "How do I become an event organiser?",
        a: "Register as an Organiser during sign-up or switch your account type in settings. You can then create events, manage ticket types, and scan QR codes at your events.",
      },
      {
        q: "Is Axar Events available outside Kenya?",
        a: "Yes. While based in Kenya, the platform supports events across Africa, with multi-currency support planned for broader use.",
      },
    ],
  },
  {
    id: "exhibitor",
    title: "Exhibitor Portal",
    description: "Registration, team management, and expo logistics for exhibiting companies.",
    faqs: [
      {
        q: "How do I access the Exhibitor Portal?",
        a: "Sign up or sign in at /auth/exhibitor. After linking your company to a published expo or conference, you are taken to the Exhibitor Portal dashboard at /exhibitor.",
      },
      {
        q: "Who can use the Exhibitor Portal?",
        a: "Exhibiting companies and their team members. Roles include Owner, Admin, and Staff. Owners and Admins can manage registration, team members, and bulk uploads; Staff have access based on permissions set by the company.",
      },
      {
        q: "How does exhibitor registration work?",
        a: "Complete the 6-step registration form: company info, booth preferences, travel and logistics, tours and transport, food selections, and final review. Your progress auto-saves as a draft until you submit.",
      },
      {
        q: "How do I add team members?",
        a: "Open the Team members tab to add roster entries with roles, transport, hotel, diet, and tour preferences. Upload passport, visa, ID, and health documents as required. Owners and Admins can also bulk-import up to 200 members via CSV.",
      },
      {
        q: "How do I request flight bookings for my team?",
        a: "Add team members with passport details and upload passport documents, then submit an air booking request from the portal. Track status from pending through verified, rate sent, and paid.",
      },
      {
        q: "How do I submit booth branding artwork?",
        a: "Go to the Brandings tab, select each branding item (banners, stickers, signage, etc.), upload print-ready files, and submit for review. If artwork is rejected, you will see the reason and can re-upload corrected files.",
      },
      {
        q: "What are additional requirements?",
        a: "Additional requirements let you select add-on items from the event catalog—equipment, services, and branding items—with live cost estimates. You can download a PDF invoice for your selections.",
      },
      {
        q: "Where do I see event schedules and tour itineraries?",
        a: "Published event schedules appear in the Schedules tab. Organiser tour itineraries with stops, photos, and timelines are also shown there. You receive in-app notifications when organisers publish updates.",
      },
      {
        q: "How do I view my booth assignment?",
        a: "Your assigned booth and hall appear on the Overview dashboard once the organiser allocates your company on the floor plan. Check back if your booth is not yet assigned.",
      },
    ],
  },
];
