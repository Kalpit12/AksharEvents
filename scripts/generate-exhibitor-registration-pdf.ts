/**
 * Generates public/exhibitor-registration-questions.pdf
 * Run: npx tsx scripts/generate-exhibitor-registration-pdf.ts
 */

import { jsPDF } from "jspdf";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

type Question = {
  label: string;
  type: string;
  options?: string[];
  followUp?: string[];
};

type Section = {
  step: number;
  title: string;
  questions: Question[];
};

const SECTIONS: Section[] = [
  {
    step: 1,
    title: "Company information",
    questions: [
      { label: "Company / organisation name", type: "Text" },
      {
        label: "Industry / sector",
        type: "Select",
        options: [
          "Technology",
          "Agriculture",
          "Finance & fintech",
          "Health & pharma",
          "Education",
          "Manufacturing",
          "Logistics",
          "Media & creative",
          "Government",
          "Other",
        ],
      },
      { label: "Contact person (full name)", type: "Text" },
      { label: "Job title", type: "Text" },
      { label: "Email address", type: "Email" },
      { label: "Phone number", type: "Text" },
      {
        label: "Country of origin",
        type: "Select",
        options: ["Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia", "South Africa", "Nigeria", "Ghana", "Other"],
      },
      { label: "Number of staff attending", type: "Number (1–50)" },
      { label: "Brief company description", type: "Long text" },
    ],
  },
  {
    step: 2,
    title: "Event preferences & requirements",
    questions: [
      {
        label: "Booth size preference",
        type: "Select",
        options: [
          "Standard 9m² (included)",
          "Medium 18m² (+KES 50,000)",
          "Large 27m² (+KES 100,000)",
          "Premium corner 36m² (+KES 180,000)",
        ],
      },
      {
        label: "Booth setup date",
        type: "Select",
        options: ["Jun 22 (full day)", "Jun 22 afternoon only", "Jun 23 morning (limited)"],
      },
      {
        label: "What sessions or workshops will your team attend?",
        type: "Multi-select",
        options: [
          "Opening keynote",
          "AI & innovation panel",
          "B2B networking",
          "Fintech workshop",
          "Agritech showcase",
          "Awards gala",
          "Startup pitch",
          "Closing ceremony",
        ],
      },
      {
        label: "Do you need AV / presentation equipment?",
        type: "Select",
        options: ["No", "Yes — projector & screen", "Yes — TV display", "Yes — full AV setup"],
      },
      {
        label: "Power requirements",
        type: "Select",
        options: ["Standard 2 outlets", "4 outlets", "6 outlets (high-draw)", "Generator backup needed"],
      },
      { label: "Special accessibility or setup requirements", type: "Long text" },
    ],
  },
  {
    step: 3,
    title: "Travel & logistics",
    questions: [
      {
        label: "Do you want a flight ticket?",
        type: "Select",
        options: ["No — I will arrange my own", "Yes — One-way", "Yes — Two-way (return)"],
      },
      {
        label: "Do you need visa application help?",
        type: "Select",
        options: [
          "No — I already have a visa",
          "No — I will apply by myself",
          "Yes — I need help with my visa application",
        ],
        followUp: [
          "If yes: Upload passport",
          "If yes: Upload national ID",
          "If yes: Upload yellow fever certificate",
        ],
      },
      {
        label: "Do you want hotel or accommodation services?",
        type: "Select",
        options: ["Yes — I need accommodation", "No — I have my own arrangements"],
        followUp: [
          "If yes: Do you need logistics from the airport to the hotel and vice versa?",
          "  Options: Yes — Airport pickup & drop-off | No — I will arrange my own transport",
        ],
      },
      {
        label: "Do you need a SIM (recharged), or do you already have a SIM but need a recharge?",
        type: "Select",
        options: [
          "No — I don't need a SIM",
          "Yes — I need a new SIM (recharged)",
          "I have a SIM — I only need a recharge",
        ],
      },
      {
        label: "Do you need money exchange?",
        type: "Select",
        options: ["No", "Yes"],
        followUp: ["If yes: How much would you like to exchange? (KES or specify currency in notes)"],
      },
      {
        label: "Do you need logistics from your accommodation to the venue and back daily?",
        type: "Select",
        options: ["Yes — Daily shuttle to venue & return", "No — I will arrange my own transport"],
      },
    ],
  },
  {
    step: 4,
    title: "Tours & travel arrangements",
    questions: [
      {
        label: "Airport pickup required?",
        type: "Select",
        options: ["No", "Yes — JKIA arrival", "Yes — Wilson Airport"],
      },
      { label: "Arrival date", type: "Date" },
      {
        label: "Daily venue shuttle",
        type: "Multi-select",
        options: ["Morning shuttle (07:30)", "Evening return (18:30)"],
      },
      {
        label: "Optional tours — select all your team will join",
        type: "Multi-select",
        options: [
          "Nairobi National Park safari (Jun 26 · 06:00 AM · KES 3,500/person)",
          "Nairobi city heritage tour (Jun 24 · 05:30 PM · KES 2,000/person)",
          "Karen Blixen Museum & Giraffe Centre (Jun 25 · 03:00 PM · KES 2,500/person)",
          "Ngong Hills day hike (Jun 27 morning · KES 1,800/person)",
        ],
      },
      {
        label: "Departure date & airport drop-off",
        type: "Select",
        options: ["No — own arrangements", "Yes — Jun 27 afternoon", "Yes — Jun 28"],
      },
      {
        label: "Vehicle preference",
        type: "Select",
        options: ["Standard minibus", "Safari van", "Private car", "No preference"],
      },
    ],
  },
  {
    step: 5,
    title: "Food outings & dining",
    questions: [
      {
        label: "Which team meals will your group attend?",
        type: "Multi-select",
        options: ["Welcome dinner (Jun 22)", "Daily venue lunches", "Gala dinner (Jun 26)", "Farewell lunch (Jun 27)"],
      },
      {
        label: "Optional dining experiences — select all of interest",
        type: "Multi-select",
        options: [
          "Carnivore Restaurant outing",
          "Rooftop sundowner (Jun 24)",
          "Street food market tour",
          "Coffee farm experience",
          "Private team dinner",
        ],
      },
      {
        label: "Dietary requirements — select if your team needs vegetarian meals",
        type: "Multi-select",
        options: ["Vegetarian"],
      },
      { label: "Allergies to note", type: "Text" },
      {
        label: "Preferred meal style",
        type: "Select",
        options: ["Buffet", "Plated service", "Family style", "No preference"],
      },
      { label: "Any special food requests or notes for the organiser?", type: "Long text" },
    ],
  },
  {
    step: 6,
    title: "Review & submit",
    questions: [
      {
        label: "Review all answers from steps 1–5, then submit registration",
        type: "Confirmation",
        options: ["Submit registration"],
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

  const writeLines = (text: string, fontSize: number, style: "normal" | "bold" | "italic" = "normal", indent = 0) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", style);
    const lines = doc.splitTextToSize(text, contentWidth - indent) as string[];
    for (const line of lines) {
      ensureSpace(fontSize * 0.45 + 2);
      doc.text(line, margin + indent, y);
      y += fontSize * 0.45 + 1.5;
    }
  };

  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, pageWidth, 42, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Exhibitor Registration Form", margin, 22);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Axar Events — Exhibitor Portal", margin, 32);
  doc.setTextColor(60, 60, 60);
  y = 52;

  writeLines(
    "This document lists every question in the exhibitor registration form (6 steps) as shown in the Exhibitor Dashboard.",
    10
  );
  y += 4;
  writeLines(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, 9, "italic");
  y += 8;

  for (const section of SECTIONS) {
    ensureSpace(20);
    doc.setDrawColor(13, 148, 136);
    doc.setFillColor(240, 253, 250);
    doc.roundedRect(margin, y - 4, contentWidth, 10, 2, 2, "FD");
    writeLines(`Step ${section.step}: ${section.title}`, 12, "bold");
    y += 4;

    section.questions.forEach((q, index) => {
      ensureSpace(14);
      writeLines(`${index + 1}. ${q.label}`, 10, "bold");
      writeLines(`   Type: ${q.type}`, 9, "italic", 2);

      if (q.options?.length) {
        writeLines("   Options:", 9, "normal", 2);
        for (const opt of q.options) {
          writeLines(`   • ${opt}`, 9, "normal", 4);
        }
      }

      if (q.followUp?.length) {
        writeLines("   Follow-up:", 9, "normal", 2);
        for (const fu of q.followUp) {
          writeLines(`   • ${fu}`, 9, "normal", 4);
        }
      }

      y += 2;
    });

    y += 6;
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Axar Events Exhibitor Portal — Page ${i} of ${totalPages}`, margin, pageHeight - 10);
  }

  return Buffer.from(doc.output("arraybuffer"));
}

const outDir = join(process.cwd(), "public");
const outPath = join(outDir, "exhibitor-registration-questions.pdf");

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, generatePdf());
console.log(`PDF written to ${outPath}`);
