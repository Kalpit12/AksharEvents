import { BRAND } from "@/lib/utils";

export type FlightBookingPackageEmailMember = {
  name: string;
  email: string;
  phone: string;
  passportNumber: string;
};

export type FlightBookingPackageEmailParams = {
  companyName: string;
  eventTitle: string;
  travelDate: string;
  ticketCount: number;
  members: FlightBookingPackageEmailMember[];
  message?: string;
  attachmentNames?: string[];
};

const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Traveler Details — {{companyName}} ({{eventTitle}})</title>
</head>
<body style="margin: 0; padding: 0; background: #f9f6f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f9f6f0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(28, 26, 23, 0.08); border: 1px solid #e5dfd4;">
          <tr>
            <td style="background: linear-gradient(135deg, #1c1a17 0%, #2a2620 55%, #3d3830 100%); padding: 32px 32px 28px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 14px;">
                <tr>
                  <td style="width: 44px; height: 44px; background: #c5a880; border-radius: 11px; text-align: center; vertical-align: middle; font-size: 20px; font-weight: 700; color: #1c1a17;">A</td>
                </tr>
              </table>
              <p style="margin: 0 0 4px; font-size: 24px; font-weight: 700; color: #f9f6f0; letter-spacing: -0.02em;">{{brandName}}</p>
              <p style="margin: 0; font-size: 12px; color: #d9c9a8; letter-spacing: 0.04em; text-transform: uppercase;">Flight Booking Request</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px; background: #ffffff;">
              <h1 style="margin: 0 0 8px; font-size: 21px; font-weight: 700; color: #1c1a17; line-height: 1.35;">Traveler Details</h1>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #6b6560;">
                Please arrange flights for the exhibitor team below. Official identity documents are attached as PDFs.
              </p>
              <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #b3966e;">Travellers</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5dfd4; border-radius: 12px; overflow: hidden; margin: 0 0 24px;">
                <tr style="background: #efece6;">
                  <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b6560; border-bottom: 1px solid #e5dfd4;">#</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b6560; border-bottom: 1px solid #e5dfd4;">Name</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b6560; border-bottom: 1px solid #e5dfd4;">Email</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b6560; border-bottom: 1px solid #e5dfd4;">Phone</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b6560; border-bottom: 1px solid #e5dfd4;">Passport #</th>
                </tr>
                {{travellerRows}}
              </table>
              <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #b3966e;">PDF attachments</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 8px;">
                <tr>
                  <td style="background: #f9f6f0; border: 1px dashed #d9c9a8; border-radius: 12px; padding: 14px 18px;">
                    {{attachmentList}}
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #6b6560;">
                Each PDF contains sensitive personal data. Please handle confidentiality.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 22px 32px 26px; border-top: 1px solid #e5dfd4; background: #efece6;">
              <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.6; color: #6b6560; text-align: center;">
                Sent via AksharEvents
              </p>
              <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.6; color: #6b6560; text-align: center;">
                For any queries, contact us at <a href="mailto:info@aksharevents.com" style="color: #b3966e; text-decoration: none; font-weight: 600;">info@aksharevents.com</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b6560; text-align: center;">
                © {{year}} {{brandName}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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

function buildTravellerRows(members: FlightBookingPackageEmailMember[]) {
  return members
    .map(
      (member, index) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5dfd4; color: #6b6560; font-size: 13px;">${index + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5dfd4; font-weight: 600; color: #1c1a17; font-size: 13px;">${escapeHtml(member.name)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5dfd4; color: #1c1a17; font-size: 13px;">${escapeHtml(member.email)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5dfd4; color: #1c1a17; font-size: 13px;">${escapeHtml(member.phone)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5dfd4; color: #1c1a17; font-size: 13px; font-family: ui-monospace, monospace;">${escapeHtml(member.passportNumber)}</td>
      </tr>`
    )
    .join("");
}

function buildAttachmentList(attachmentNames: string[]) {
  if (attachmentNames.length === 0) {
    return `<p style="margin: 0; font-size: 13px; color: #6b6560;">One PDF per traveller will be attached when sent.</p>`;
  }
  return `<ul style="margin: 0; padding-left: 18px; color: #1c1a17; font-size: 13px; line-height: 1.8;">
    ${attachmentNames.map((name) => `<li>${escapeHtml(name)}</li>`).join("")}
  </ul>`;
}

export function flightBookingPackageEmailSubject(companyName: string, eventTitle: string) {
  return `Traveler Details — ${companyName} (${eventTitle})`;
}

export function flightBookingPackageAttachmentName(memberName: string) {
  const safe = memberName.replace(/[^\w\s-]/g, "").trim() || "Traveller";
  return `${safe} Documents.pdf`;
}

export function flightBookingPackageEmailHtml(params: FlightBookingPackageEmailParams) {
  const attachmentNames =
    params.attachmentNames ??
    params.members.map((m) => flightBookingPackageAttachmentName(m.name));

  return fillTemplate(EMAIL_TEMPLATE, {
    brandName: escapeHtml(BRAND.name),
    brandTagline: escapeHtml(BRAND.tagline),
    year: String(new Date().getFullYear()),
    companyName: escapeHtml(params.companyName),
    eventTitle: escapeHtml(params.eventTitle),
    travellerRows: buildTravellerRows(params.members),
    attachmentList: buildAttachmentList(attachmentNames),
  });
}
