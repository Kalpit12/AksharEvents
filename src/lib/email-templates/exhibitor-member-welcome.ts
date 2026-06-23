import fs from "fs";
import path from "path";
import { BRAND } from "@/lib/utils";

export type ExhibitorMemberWelcomeParams = {
  name: string;
  email: string;
  password?: string;
  companyName: string;
  loginUrl: string;
  invitedByName?: string;
};

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "src/lib/email-templates/exhibitor-member-welcome.html"
);

let cachedSource: string | null = null;

function readTemplateSource() {
  if (!cachedSource) {
    cachedSource = fs.readFileSync(TEMPLATE_PATH, "utf-8");
  }
  return cachedSource;
}

function extractSection(source: string, section: string) {
  const marker = `<!--template:${section}\n`;
  const start = source.indexOf(marker);
  if (start === -1) {
    const altMarker = `<!--template:${section}`;
    const altStart = source.indexOf(altMarker);
    if (altStart === -1) return "";
    const contentStart = source.indexOf("\n", altStart) + 1;
    const end = source.indexOf("\n-->", contentStart);
    return end === -1 ? "" : source.slice(contentStart, end).trim();
  }
  const contentStart = start + marker.length;
  const end = source.indexOf("\n-->", contentStart);
  return end === -1 ? "" : source.slice(contentStart, end).trim();
}

function getMainTemplate(source: string) {
  const fromMarker = extractSection(source, "email");
  if (fromMarker) return fromMarker;
  const idx = source.indexOf("<!--template:");
  return (idx === -1 ? source : source.slice(0, idx)).trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fillTemplate(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template
  );
}

export function exhibitorMemberWelcomeEmailHtml({
  name,
  email,
  password,
  companyName,
  loginUrl,
  invitedByName,
}: ExhibitorMemberWelcomeParams) {
  const source = readTemplateSource();
  const isNewAccount = Boolean(password);

  const credentialsTemplate = extractSection(
    source,
    isNewAccount ? "credentials-new" : "credentials-existing"
  );

  const credentialsBlock = fillTemplate(credentialsTemplate, {
    email: escapeHtml(email),
    password: escapeHtml(password ?? ""),
    brandName: BRAND.name,
  });

  return fillTemplate(getMainTemplate(source), {
    brandName: BRAND.name,
    brandTagline: BRAND.tagline,
    name: escapeHtml(name),
    companyName: escapeHtml(companyName),
    loginUrl: escapeHtml(loginUrl),
    year: String(new Date().getFullYear()),
    invitedByLine: invitedByName
      ? `<strong>${escapeHtml(invitedByName)}</strong> has added you`
      : "You have been added",
    credentialsBlock,
  }).trim();
}

export function exhibitorMemberWelcomeEmailSubject(companyName: string) {
  return `Welcome to ${companyName} — Your ${BRAND.name} exhibitor access`;
}
