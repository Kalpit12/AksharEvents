/**
 * Generates public/akshar-events-portal-features.pdf
 * Run: npx tsx scripts/generate-portal-features-pdf.ts
 */

import { jsPDF } from "jspdf";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

type FeatureItem = {
  title: string;
  description: string;
};

type Workflow = {
  title: string;
  steps: string[];
};

type PortalSection = {
  name: string;
  subtitle: string;
  access: string;
  overview: string;
  features: FeatureItem[];
  workflows?: Workflow[];
};

const PORTALS: PortalSection[] = [
  {
    name: "Exhibitor Portal",
    subtitle: "Company registration & event logistics",
    access: "Sign in at /authentication/exhibitor.",
    overview:
      "The Exhibitor Portal is a single dashboard where exhibiting companies manage their event registration, team, travel documents, branding artwork, and logistics for a published expo or conference.",
    features: [
      {
        title: "Overview dashboard",
        description:
          "View registration progress, team size, transport slots, meal passes, tours booked, booth assignment, event deadlines, and quick links to key tasks.",
      },
      {
        title: "6-step registration form",
        description:
          "Complete company info, booth preferences, travel & logistics, tours & transport, food selections, and final review. Auto-saves as draft; submit when ready.",
      },
      {
        title: "Additional requirements",
        description:
          "Select add-on items from the event catalog (equipment, services, branding items) with live cost estimates and PDF invoice download.",
      },
      {
        title: "Brandings",
        description:
          "Upload print-ready artwork per branding item (banners, stickers, badges & stripes, etc.). Submit for review; re-upload if rejected.",
      },
      {
        title: "Team members",
        description:
          "Add and manage team roster with roles, transport, hotel, diet, and tour preferences. Upload passport, visa, ID, and health documents.",
      },
      {
        title: "Air booking requests",
        description:
          "Request flight coordination for team members (requires passport number and passport document). Track status from pending through verified, rate sent, and paid.",
      },
      {
        title: "Bulk member upload",
        description:
          "Owners and Admins can import up to 200 team members via CSV and provision portal accounts with welcome emails.",
      },
      {
        title: "Tours & travel",
        description:
          "View shuttle, tour, and travel activity selections made during registration.",
      },
      {
        title: "Schedules & itineraries",
        description:
          "See published event schedules and organiser tour itineraries with photos, stops, and timelines.",
      },
      {
        title: "Food outings",
        description:
          "Review meal selections, dining experiences, and dietary requirements submitted during registration.",
      },
      {
        title: "Notifications",
        description:
          "Receive in-app alerts when organisers publish schedule or itinerary updates.",
      },
    ],
    workflows: [
      {
        title: "Registration",
        steps: ["Sign up", "Link to an open event", "Complete 6-step registration", "Submit"],
      },
      {
        title: "Air booking",
        steps: ["Add team members", "Upload travel documents", "Request air booking"],
      },
      {
        title: "Branding artwork",
        steps: ["Select branding items", "Upload artwork", "Submit for printing-team review"],
      },
    ],
  },
  {
    name: "Printing Portal",
    subtitle: "Booth branding artwork production",
    access: "Sign in at /authentication/printing. For Printing Staff and Admins only.",
    overview:
      "The Printing Portal manages exhibitor booth branding artwork from submission through production and installation. It is not attendee badge printing - it tracks print-ready files for banners, stickers, signage, and similar booth materials.",
    features: [
      {
        title: "Artwork review dashboard",
        description:
          "Browse all exhibitor companies and their branding submissions. Search companies, view metrics (items awaiting review, affixed, etc.), and open per-item details.",
      },
      {
        title: "Verify or reject submissions",
        description:
          "Approve submitted artwork for production or reject with a reason so exhibitors can re-upload corrected files.",
      },
      {
        title: "Production pipeline tracking",
        description:
          "Advance each item through: Verified, Sent for printing, Printing in process, Artwork delivered, Artwork affixed.",
      },
      {
        title: "View & download files",
        description:
          "Open and download original artwork files (PDF, JPG, PNG, WEBP, SVG, AI/EPS) stored securely in Cloudinary.",
      },
      {
        title: "Status history",
        description:
          "Full audit trail of every status change with timestamps and who made each update.",
      },
      {
        title: "Floor plan view",
        description:
          "Interactive booth map colour-coded by aggregate artwork status. Filter by branding item type, search booths, and jump to company details.",
      },
    ],
    workflows: [
      {
        title: "Artwork review",
        steps: ["Exhibitor uploads artwork", "Exhibitor submits", "Printing staff reviews"],
      },
      {
        title: "Approved items",
        steps: ["Advance through production stages", "Deliver to booth", "Mark as affixed"],
      },
      {
        title: "Rejected items",
        steps: ["Return to exhibitor for correction", "Exhibitor re-uploads", "Exhibitor re-submits"],
      },
    ],
  },
  {
    name: "Admin Portal (Event Master)",
    subtitle: "Expo operations & event configuration",
    access: "Sign in at /authentication/login. For platform Admins only.",
    overview:
      "Event Master is the central operations console for running an expo. Admins create and publish events, configure logistics, monitor exhibitor data, manage floor plans, coordinate flights, and plan supplies - all from one dashboard scoped to the primary published event.",
    features: [
      {
        title: "Event management",
        description:
          "Create events (expo, conference, job fair, etc.), save as draft or publish immediately. Published events appear in exhibitor signup.",
      },
      {
        title: "Exhibitor registrations",
        description:
          "Browse and search all exhibitor registrations. View company profiles, registration progress, transport, food, members, and tour selections.",
      },
      {
        title: "Team members (aggregate)",
        description:
          "Cross-exhibitor roster view with roles, transport, hotel assignments, and food preferences.",
      },
      {
        title: "Flight bookings",
        description:
          "Manage air-booking workflow: verify travellers and documents, send packages to travel agent, send rate quotes, and mark members as paid.",
      },
      {
        title: "Floor plan & booth allocation",
        description:
          "Interactive booth map. Assign exhibitors to booths, upload custom floor plan images, and sync booth numbers to exhibitor records.",
      },
      {
        title: "Supply planning",
        description:
          "Estimate water bottles, meal passes, badges, event kits, and other supplies from team counts with configurable buffers.",
      },
      {
        title: "Item master",
        description:
          "Create and manage the event supply catalog (booth packages, equipment, branding items, services) that exhibitors select from.",
      },
      {
        title: "Hotels & restaurants",
        description:
          "Configure accommodation and dining options. View exhibitor accommodation requests and meal selections.",
      },
      {
        title: "Event schedule",
        description:
          "Manage day-by-day schedule with speakers and photos. Changes sync to the public agenda and notify exhibitors.",
      },
      {
        title: "Tour & travel itineraries",
        description:
          "Build multi-day itineraries with stops and photos. Publish to exhibitors, import from Excel/CSV, and send update notifications.",
      },
      {
        title: "Tours & travel activities",
        description:
          "Create tour and travel activities with slots and pricing. Toggle visibility for exhibitor registration.",
      },
      {
        title: "Transport overview",
        description:
          "Read-only aggregate of exhibitor transport requests across all companies.",
      },
      {
        title: "Printing access",
        description:
          "Admins can also access the Printing Portal to review branding artwork alongside printing staff.",
      },
    ],
    workflows: [
      {
        title: "Event setup",
        steps: [
          "Create and publish event",
          "Configure hotels, restaurants, schedule, floor plan, and catalog",
        ],
      },
      {
        title: "Exhibitor monitoring",
        steps: ["Exhibitors register", "Admin monitors data across dashboard tabs"],
      },
      {
        title: "Flight requests",
        steps: ["Verify travellers", "Send to travel agent", "Send rate quote", "Mark as paid"],
      },
      {
        title: "Itineraries",
        steps: ["Build itineraries", "Publish to exhibitors", "Notify exhibitors"],
      },
    ],
  },
];

function generatePdf(): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeLines = (
    text: string,
    fontSize: number,
    style: "normal" | "bold" | "italic" = "normal",
    indent = 0,
    color: [number, number, number] = [60, 60, 60]
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth - indent) as string[];
    for (const line of lines) {
      ensureSpace(fontSize * 0.45 + 2);
      doc.text(line, margin + indent, y);
      y += fontSize * 0.45 + 1.5;
    }
  };

  // Cover page
  doc.setFillColor(28, 26, 23);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setTextColor(197, 168, 128);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("AKSHAR EVENTS", margin, 40);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("Portal Features Guide", margin, 58);
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(220, 220, 220);
  doc.text("Exhibitor  |  Printing  |  Admin", margin, 72);
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
    margin,
    pageHeight - 30
  );

  doc.addPage();
  y = margin;
  doc.setTextColor(60, 60, 60);

  writeLines(
    "This guide summarises the three main portals in the Akshar Events platform: what each portal is for, who can access it, and the key features available.",
    10
  );
  y += 8;

  for (const portal of PORTALS) {
    ensureSpace(30);
    writeLines(portal.name, 14, "bold", 0, [28, 26, 23]);
    writeLines(portal.subtitle, 10, "italic", 0, [100, 100, 100]);
    y += 4;

    writeLines("Access", 10, "bold", 0, [28, 26, 23]);
    writeLines(portal.access, 9);
    y += 3;

    writeLines("Overview", 10, "bold", 0, [28, 26, 23]);
    writeLines(portal.overview, 9);
    y += 3;

    writeLines("Key features", 10, "bold", 0, [28, 26, 23]);
    y += 1;
    for (const feature of portal.features) {
      ensureSpace(12);
      writeLines(`- ${feature.title}`, 9, "bold", 0, [28, 26, 23]);
      writeLines(feature.description, 9, "normal", 4);
      y += 1;
    }

    if (portal.workflows?.length) {
      y += 2;
      writeLines("Typical workflows", 10, "bold", 0, [28, 26, 23]);
      y += 2;
      for (const workflow of portal.workflows) {
        ensureSpace(10);
        writeLines(workflow.title, 9, "bold", 0, [28, 26, 23]);
        workflow.steps.forEach((step, index) => {
          writeLines(`${index + 1}. ${step}`, 9, "normal", 4);
        });
        y += 3;
      }
    }

    y += 10;
  }

  // Role summary page
  ensureSpace(40);
  writeLines("Role summary", 14, "bold", 0, [28, 26, 23]);
  y += 4;

  const roles = [
    ["Exhibitor Owner / Admin / Staff", "Exhibitor Portal - manage company registration, team, and logistics"],
    ["Printing Staff", "Printing Portal - review and track booth branding artwork"],
    ["Platform Admin", "Event Master + Printing Portal - full event operations and artwork review"],
  ];

  for (const [role, access] of roles) {
    ensureSpace(10);
    writeLines(role, 9, "bold", 0, [28, 26, 23]);
    writeLines(access, 9, "normal", 4);
    y += 2;
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Akshar Events Portal Features - Page ${i - 1} of ${totalPages - 1}`, margin, pageHeight - 10);
  }

  return Buffer.from(doc.output("arraybuffer"));
}

const outDir = join(process.cwd(), "public");
const outPath = join(outDir, "akshar-events-portal-features.pdf");

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, generatePdf());
console.log(`PDF written to ${outPath}`);
