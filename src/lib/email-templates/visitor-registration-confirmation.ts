import { formatEventDateRange, formatEventTimings, formatEventVenue } from "@/lib/event-schedule-label";
import { getPassUrl } from "@/lib/visitor-pass";
import { BRAND } from "@/lib/utils";

export type VisitorRegistrationEmailParams = {
  name: string;
  designation?: string | null;
  company?: string | null;
  eventTitle: string;
  eventSlug: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  startTime?: string | null;
  endTime?: string | null;
  venueName?: string | null;
  venueCity?: string | null;
  bookingNumber: string;
  qrCodeUrl: string;
  passLabel?: string;
  badgeDownloadUrl: string;
};

export function visitorRegistrationEmailSubject(eventTitle: string) {
  return `Registration confirmed — ${eventTitle}`;
}

export function visitorRegistrationEmailHtml(params: VisitorRegistrationEmailParams) {
  const {
    name,
    designation,
    company,
    eventTitle,
    eventSlug,
    startDate,
    endDate,
    startTime,
    endTime,
    venueName,
    venueCity,
    bookingNumber,
    qrCodeUrl,
    passLabel = "VISITOR",
    badgeDownloadUrl,
  } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:5001";
  const dateLabel = formatEventDateRange(startDate, endDate);
  const timeLabel = formatEventTimings(startTime, endTime);
  const venue = formatEventVenue(venueName, venueCity);
  const passUrl = getPassUrl(bookingNumber);
  const eventUrl = `${appUrl}/events/${eventSlug}`;

  const designationBlock = designation
    ? `<p style="margin: 4px 0 0; font-size: 15px; color: #0D9488; font-weight: 600;">${designation}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#0D9488,#16A34A);padding:28px 32px;color:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.9;">Registration confirmed</p>
          <h1 style="margin:0;font-size:24px;line-height:1.3;">You're registered for ${eventTitle}</h1>
          <p style="margin:12px 0 0;font-size:14px;opacity:0.95;">Hi ${name}, your visitor badge and QR code are ready below.</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <h2 style="margin:0 0 16px;font-size:16px;color:#111827;">Event details</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;border-radius:12px;padding:16px 20px;">
            <tr><td style="padding:6px 0;font-size:14px;color:#374151;"><strong style="color:#111827;">Event:</strong> ${eventTitle}</td></tr>
            <tr><td style="padding:6px 0;font-size:14px;color:#374151;"><strong style="color:#111827;">Date:</strong> ${dateLabel}</td></tr>
            ${timeLabel ? `<tr><td style="padding:6px 0;font-size:14px;color:#374151;"><strong style="color:#111827;">Time:</strong> ${timeLabel}</td></tr>` : ""}
            ${venue ? `<tr><td style="padding:6px 0;font-size:14px;color:#374151;"><strong style="color:#111827;">Venue:</strong> ${venue}</td></tr>` : ""}
            ${company ? `<tr><td style="padding:6px 0;font-size:14px;color:#374151;"><strong style="color:#111827;">Company:</strong> ${company}</td></tr>` : ""}
            <tr><td style="padding:6px 0;font-size:14px;color:#374151;"><strong style="color:#111827;">Pass #:</strong> ${bookingNumber}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 8px;">
          <h2 style="margin:0 0 12px;font-size:16px;color:#111827;text-align:center;">Your visitor badge</h2>
          <div style="max-width:340px;margin:0 auto;border:2px solid #C9A227;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.12);">
            <div style="background:linear-gradient(90deg,#2C1810,#4a3728);padding:16px 20px;color:#FAF7F2;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td>
                  <div style="display:inline-block;background:#C9A227;color:#2C1810;width:36px;height:36px;border-radius:8px;text-align:center;line-height:36px;font-weight:bold;font-size:18px;">A</div>
                  <span style="margin-left:10px;font-weight:bold;font-size:14px;vertical-align:middle;">${BRAND.name}</span>
                </td>
                <td align="right">
                  <span style="background:#C9A227;color:#2C1810;padding:4px 10px;border-radius:6px;font-size:10px;font-weight:bold;letter-spacing:0.05em;">${passLabel}</span>
                </td>
              </tr></table>
            </div>
            <div style="background:#f8f7f4;padding:12px 20px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">Official event badge</p>
              <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#111827;">${eventTitle}</p>
            </div>
            <div style="padding:24px 20px;text-align:center;background:white;">
              <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#9ca3af;">Name</p>
              <p style="margin:6px 0 0;font-size:22px;font-weight:bold;color:#2C1810;text-transform:uppercase;">${name}</p>
              ${designation ? `<p style="margin:16px 0 0;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#9ca3af;">Designation</p>${designationBlock}` : ""}
              <div style="margin:24px auto 0;padding:12px;border:2px solid #e5e7eb;border-radius:12px;display:inline-block;">
                <img src="${qrCodeUrl}" alt="Your entry QR code" width="200" height="200" style="display:block;"/>
              </div>
              <p style="margin:12px 0 0;font-size:11px;color:#6b7280;">Present this QR code at the entrance</p>
              <p style="margin:4px 0 0;font-family:monospace;font-size:10px;color:#9ca3af;">${bookingNumber}</p>
            </div>
            <div style="background:#2C1810;padding:8px;text-align:center;">
              <p style="margin:0;font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(201,162,39,0.6);">Powered by ${BRAND.name}</p>
            </div>
          </div>
        </td></tr>
        <tr><td style="padding:16px 32px 32px;text-align:center;">
          <a href="${passUrl}" style="display:inline-block;background:#0D9488;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:4px;">View &amp; download badge</a>
          <a href="${badgeDownloadUrl}" style="display:inline-block;background:#2C1810;color:#FAF7F2;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:4px;">Download badge (PDF)</a>
          <p style="margin:20px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
            Save this email or download your badge — you'll need it on event day.<br/>
            Your QR code and badge file are also attached to this email for offline use.<br/>
            <a href="${eventUrl}" style="color:#0D9488;">View full event details →</a>
          </p>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:11px;color:#9ca3af;text-align:center;">© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Static sample for public HTML preview file. */
export const VISITOR_REGISTRATION_EMAIL_SAMPLE: VisitorRegistrationEmailParams = {
  name: "John Doe",
  designation: "CTO",
  company: "Amirpro Infotech Ltd",
  eventTitle: "Kenya Career Expo 2026",
  eventSlug: "kenya-career-expo-2026",
  startDate: new Date("2026-07-20"),
  endDate: new Date("2026-07-22"),
  startTime: "09:00",
  endTime: "17:00",
  venueName: "KICC Convention Centre",
  venueCity: "Nairobi",
  bookingNumber: "AE-MC3X9K2A-7F3B",
  qrCodeUrl:
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=akshar-ticket-preview",
  passLabel: "VISITOR",
  badgeDownloadUrl: "http://localhost:5001/api/pass/AE-MC3X9K2A-7F3B/badge",
};
