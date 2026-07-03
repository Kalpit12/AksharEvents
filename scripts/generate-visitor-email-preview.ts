import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import {
  visitorRegistrationEmailHtml,
  VISITOR_REGISTRATION_EMAIL_SAMPLE,
} from "../src/lib/email-templates/visitor-registration-confirmation";

const outDir = join(process.cwd(), "public", "email-previews");
mkdirSync(outDir, { recursive: true });

const html = visitorRegistrationEmailHtml(VISITOR_REGISTRATION_EMAIL_SAMPLE);
const outPath = join(outDir, "visitor-registration-confirmation.html");
writeFileSync(outPath, html, "utf8");

console.log(`Wrote ${outPath}`);
