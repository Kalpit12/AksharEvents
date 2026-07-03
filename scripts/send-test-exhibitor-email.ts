import { config } from "dotenv";
import path from "path";

config({ path: path.join(process.cwd(), ".env"), override: true });

async function main() {
  const {
    exhibitorMemberWelcomeEmailHtml,
    exhibitorMemberWelcomeEmailSubject,
  } = await import("../src/lib/email-templates/exhibitor-member-welcome");
  const { sendExhibitorMemberWelcomeEmail } = await import("../src/lib/email");

  const TO = process.env.TEST_EMAIL_TO || "kalpitpatel12@yahoo.com";
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5001";
  const companyName = "MaxPro Exhibits (Test)";
  const eventName = "Kenya Trade Expo 2026";

  const html = exhibitorMemberWelcomeEmailHtml({
    name: "Kalpit Patel",
    email: TO,
    password: "TestWelcome2026!",
    companyName,
    eventName,
    loginUrl: `${APP_URL}/auth/exhibitor`,
    invitedByName: "AxarEvents Admin",
  });

  const subject = exhibitorMemberWelcomeEmailSubject(eventName);

  console.log(`Sending exhibitor welcome email to ${TO}...`);
  console.log(`From: ${process.env.POSTMARK_SENDER_NAME} <${process.env.POSTMARK_SENDER_EMAIL}>`);

  const result = await sendExhibitorMemberWelcomeEmail({ to: TO, subject, html });

  if (!result.success) {
    console.error("Failed:", result.error);
    process.exit(1);
  }

  console.log("Sent successfully. Message ID:", result.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
