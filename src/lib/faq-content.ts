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

export const faqIntro =
  "Aligned with the current AxarEvents platform — visitor registration, exhibitor portal, Event Master, and partner white-label sites.";

export const faqSections: FaqSection[] = [
  {
    id: "general",
    title: "General",
    description: "Platform overview and how AxarEvents works.",
    faqs: [
      {
        q: "What is AxarEvents?",
        a: "AxarEvents is an event discovery and registration platform for Kenya and Africa. Visitors can find events and get a digital visitor badge. Exhibiting companies use the Exhibitor Portal for registration, booths, travel, and add-on services. AxarEvents also provides professional event planning and management services.",
      },
      {
        q: "What kinds of events can I find?",
        a: "Career fairs, university events, conferences, business and technology expos, networking events, workshops, cultural festivals, corporate events, and other published events on the platform.",
      },
      {
        q: "How do I find and register for an event?",
        a: "Browse Events on the AxarEvents website (or a partner site such as a TechHub Africa page). Open the event you want, then use Get my visitor badge to fill in your details and complete registration.",
      },
      {
        q: "Is AxarEvents an event organiser?",
        a: "AxarEvents is both a platform and an event management company. Some events are run by AxarEvents; others are published for partners or clients. Day-to-day event operations for expos are managed in Event Master by the AxarEvents team.",
      },
      {
        q: "Do I need an account to register as a visitor?",
        a: "You can complete visitor registration and receive your badge/QR code by email without creating a full attendee account. An exhibitor account is required only if you are exhibiting and need the Exhibitor Portal.",
      },
      {
        q: "Is AxarEvents available outside Kenya?",
        a: "Yes. The platform is based in Kenya and supports events across Africa. Partner white-label sites can also host registrations under a partner brand.",
      },
    ],
  },
  {
    id: "visitor-badges",
    title: "Visitor badges & registration",
    description: "Getting your badge, check-in, and confirmation emails.",
    faqs: [
      {
        q: "How do I get my visitor badge?",
        a: "Open the event page and select Get my visitor badge. Enter your details, complete registration, and you will receive a confirmation email with your digital badge and QR code.",
      },
      {
        q: "Will I receive confirmation after registering?",
        a: "Yes. After a successful registration (and payment when required), you receive a confirmation email with your visitor pass / QR code.",
      },
      {
        q: "How do I check in at the event?",
        a: "Present your visitor badge QR code at the registration desk or entry. Staff scan the QR code to verify entry. Exhibitors may also scan visitor badges at booths where booth check-in is enabled.",
      },
      {
        q: "Can I cancel or transfer my registration?",
        a: "Cancellation and transfer rules depend on the event. Check the event page or contact AxarEvents / the event organiser for that event's policy.",
      },
      {
        q: "What if I do not receive my confirmation email?",
        a: "Check spam/junk folders first. If it still does not arrive, contact AxarEvents through the Contact Us page with your name, email, and event title.",
      },
    ],
  },
  {
    id: "event-information",
    title: "Event information",
    description: "Registration status, venues, and schedules.",
    faqs: [
      {
        q: "How do I know if registration is still open?",
        a: "Each published event page shows whether registration is available. If registration is closed, that will be reflected on the event page.",
      },
      {
        q: "Where is the event held?",
        a: "Venue name, city, and related details appear on the event listing and event page when provided.",
      },
      {
        q: "Can I see schedules and agendas?",
        a: "Where organisers publish schedules, they appear on the event experience and in the Exhibitor Portal Schedules area for exhibitors.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    description: "Fees, Stripe, HDFC, and exhibitor booth payments.",
    faqs: [
      {
        q: "Are there registration fees?",
        a: "Some events are free; others require payment. Fees are set per event and shown on the event registration flow.",
      },
      {
        q: "How do I pay on the main AxarEvents website?",
        a: "Paid visitor tickets on the main AxarEvents site are processed securely via Stripe (card payments such as Visa and Mastercard).",
      },
      {
        q: "How do I pay on a partner white-label site?",
        a: "Partner sites (for example /p/techhub-africa) use HDFC SmartGateway for paid visitor bookings when payment is required.",
      },
      {
        q: "How do exhibitors pay for booths?",
        a: "Booth payments are typically arranged offline or as directed by the organiser. On partner sites, the partner organiser confirms payment manually in the organiser dashboard. After payment is confirmed, login credentials for AxarEvents can be emailed so the exhibitor can access additional services.",
      },
    ],
  },
  {
    id: "exhibitors",
    title: "Exhibitors",
    description: "Exhibitor Portal, booths, team, branding, and travel.",
    faqs: [
      {
        q: "How do I become an exhibitor?",
        a: "On the main AxarEvents platform, create or sign in to an exhibitor account at /auth/exhibitor, then complete your company registration for an open expo. On partner white-label sites, booths are often booked by phone or offline; the partner organiser adds your company manually and sends a booth reservation email.",
      },
      {
        q: "How do I access the Exhibitor Portal?",
        a: "Sign in at /auth/exhibitor. After your company is linked to an event, open /exhibitor to manage registration, team, booth, travel, branding, and add-ons.",
      },
      {
        q: "Who can use the Exhibitor Portal?",
        a: "Exhibiting companies and their team members. Roles include Owner, Admin, and Staff. Owners and Admins manage registration, members, and uploads; Staff access depends on permissions.",
      },
      {
        q: "How does exhibitor registration work?",
        a: "Complete the multi-step registration form (company information, preferences, travel and logistics, tours/transport, food, and review). Progress can be saved as a draft until you submit.",
      },
      {
        q: "How do I choose or view my booth?",
        a: "In the Exhibitor Portal, open Floor plan & booth to select an available stand when self-selection is enabled. After reservation and payment verification, your booth number appears on Overview. On partner sites using manual booking, the organiser assigns the booth and emails reservation details.",
      },
      {
        q: "How do I add team members?",
        a: "Use the Team members area to add people with roles and preferences, and upload documents as required. Owners/Admins can also bulk-import members via CSV where available.",
      },
      {
        q: "What additional services can exhibitors request?",
        a: "Depending on the event configuration, services may include booth-related items, furniture and equipment, branding artwork, air booking, hotels, tours, food, SIM packs, and airport or venue transfers. These are managed through the Exhibitor Portal after login.",
      },
      {
        q: "How do I submit booth branding artwork?",
        a: "Open Brandings in the Exhibitor Portal, choose each branding item, upload print-ready files, and submit for review. If artwork is rejected, you can re-upload after correcting it.",
      },
      {
        q: "How do I request flight bookings?",
        a: "Add travellers with passport details and documents, then submit an air booking request from the portal. Status can be tracked through the booking workflow.",
      },
      {
        q: "Can international companies exhibit?",
        a: "Yes, when the event allows it. Eligibility and travel requirements are defined by the event organiser.",
      },
    ],
  },
  {
    id: "partner-organisers",
    title: "Partner organisers & Event Master",
    description: "White-label sites, organiser dashboard, and operations.",
    faqs: [
      {
        q: "What is a partner white-label site?",
        a: "Partners can have a branded public site at /p/[partner-slug] (for example TechHub Africa) with their logo and colours, listing events and visitor registration under their brand while bookings are powered by AxarEvents.",
      },
      {
        q: "What can a partner organiser do?",
        a: "Partner organisers sign in on their partner site organiser login, then use the organiser dashboard to add exhibitors manually, assign booths, confirm payments, and send login credentials emails for AxarEvents additional services.",
      },
      {
        q: "How are events managed operationally?",
        a: "Expo operations (exhibitors, floor plan, payment verification, flights, check-ins, and related tools) are managed in Event Master by authorised AxarEvents administrators.",
      },
      {
        q: "Can my organisation list or promote an event?",
        a: "Yes — contact AxarEvents. Event publishing and promotion are arranged with the AxarEvents team rather than fully self-serve public organiser publishing.",
      },
    ],
  },
  {
    id: "event-management",
    title: "Event management services",
    description: "Professional planning and logistics from AxarEvents.",
    faqs: [
      {
        q: "Does AxarEvents plan and manage events?",
        a: "Yes. AxarEvents offers end-to-end event planning and management for corporate events, conferences, expos, career fairs, university events, networking events, festivals, and private celebrations.",
      },
      {
        q: "What facility and logistics services do you provide?",
        a: "Services can include booths and facility management, ushers, food, air booking, tourist SIM packs, airport pick-up and drop-off, cuisine experiences, and transfers to/from the event location. Availability depends on the event package.",
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    description: "Who to contact for events and technical help.",
    faqs: [
      {
        q: "Who do I contact about an event?",
        a: "For schedules, venue, refunds, or special requests, use the contact details on the event page or Contact Us. Partner-site visitors can also use the partner contact email shown on that site.",
      },
      {
        q: "Who do I contact for technical issues?",
        a: "For account access, badge/email problems, or platform errors, contact AxarEvents through the Contact Us page.",
      },
      {
        q: "How do I contact AxarEvents?",
        a: "Use the Contact Us page on axarevents.com. We assist with platform questions, exhibitor access, and technical support.",
      },
    ],
  },
  {
    id: "privacy-security",
    title: "Privacy & security",
    description: "How your information is protected and shared.",
    faqs: [
      {
        q: "Is my personal information secure?",
        a: "Yes. AxarEvents takes reasonable measures to protect personal information and uses it in line with our Privacy Policy.",
      },
      {
        q: "Will my information be shared with organisers?",
        a: "Information needed to manage your registration or exhibition is shared with the event organiser / AxarEvents operations team as required to run the event.",
      },
    ],
  },
  {
    id: "why-axarevents",
    title: "Why use AxarEvents?",
    description: "What makes the platform different.",
    faqs: [
      {
        q: "Why should I use AxarEvents?",
        a: "AxarEvents combines event discovery, visitor badge registration, exhibitor operations (booths, teams, travel, branding, and add-ons), partner white-label sites, and professional event management — so attendees register easily and organisers deliver successful events.",
      },
    ],
  },
];
