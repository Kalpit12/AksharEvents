import { ServerClient } from "postmark";
import { BRAND } from "./utils";

function getPostmarkClient() {
  const apiKey = process.env.POSTMARK_API_KEY;
  return apiKey ? new ServerClient(apiKey) : null;
}

function getFromAddress() {
  return process.env.POSTMARK_SENDER_EMAIL && process.env.POSTMARK_SENDER_NAME
    ? `${process.env.POSTMARK_SENDER_NAME} <${process.env.POSTMARK_SENDER_EMAIL}>`
    : process.env.EMAIL_FROM || `${BRAND.name} <noreply@aksharevents.com>`;
}

const MESSAGE_STREAM = process.env.POSTMARK_MESSAGE_STREAM || "outbound";

async function sendEmail({
  to,
  subject,
  html,
  cc,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  cc?: string;
  attachments?: { name: string; content: string; contentType: string }[];
}) {
  const postmark = getPostmarkClient();
  if (!postmark) {
    console.log(`[Email] To: ${to}${cc ? ` | Cc: ${cc}` : ""} | Subject: ${subject}`);
    if (attachments?.length) {
      console.log(`[Email] Attachments: ${attachments.map((a) => a.name).join(", ")}`);
    }
    return { success: true, id: "dev-mode" };
  }

  try {
    const result = await postmark.sendEmail({
      From: getFromAddress(),
      To: to,
      Cc: cc,
      Subject: subject,
      HtmlBody: html,
      MessageStream: MESSAGE_STREAM,
      Attachments: attachments?.map((attachment) => ({
        Name: attachment.name,
        Content: attachment.content,
        ContentType: attachment.contentType,
        ContentID: attachment.name,
      })),
    });
    return { success: true, id: result.MessageID };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email error";
    console.error(`[Email] Failed to send to ${to}:`, message);
    return { success: false, error: message };
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: `Welcome to ${BRAND.name}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0D9488;">Welcome to ${BRAND.name}, ${name}!</h1>
        <p>${BRAND.tagline}</p>
        <p>Start discovering events across Kenya and Africa. Browse career fairs, conferences, expos, and more.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" style="display: inline-block; background: #0D9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Browse Events</a>
      </div>
    `,
  });
}

export async function sendTicketConfirmation({
  to,
  name,
  eventTitle,
  bookingNumber,
  qrCodeUrl,
  totalAmount,
  currency,
}: {
  to: string;
  name: string;
  eventTitle: string;
  bookingNumber: string;
  qrCodeUrl: string;
  totalAmount: string;
  currency: string;
}) {
  return sendEmail({
    to,
    subject: `Ticket Confirmed — ${eventTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0D9488;">Your Ticket is Confirmed!</h1>
        <p>Hi ${name},</p>
        <p>Your booking for <strong>${eventTitle}</strong> has been confirmed.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p><strong>Booking #:</strong> ${bookingNumber}</p>
          <p><strong>Total:</strong> ${currency} ${totalAmount}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <img src="${qrCodeUrl}" alt="QR Code" width="200" height="200" />
          <p style="color: #6b7280; font-size: 14px;">Show this QR code at the event entrance</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings" style="display: inline-block; background: #0D9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View My Bookings</a>
      </div>
    `,
  });
}

export async function sendEventReminder({
  to,
  name,
  eventTitle,
  eventDate,
  eventUrl,
}: {
  to: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  eventUrl: string;
}) {
  return sendEmail({
    to,
    subject: `Reminder: ${eventTitle} is coming up!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0D9488;">Event Reminder</h1>
        <p>Hi ${name},</p>
        <p>Don't forget! <strong>${eventTitle}</strong> is happening on <strong>${eventDate}</strong>.</p>
        <a href="${eventUrl}" style="display: inline-block; background: #0D9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">View Event Details</a>
      </div>
    `,
  });
}

export async function sendPaymentConfirmation({
  to,
  name,
  amount,
  currency,
  invoiceNumber,
}: {
  to: string;
  name: string;
  amount: string;
  currency: string;
  invoiceNumber: string;
}) {
  return sendEmail({
    to,
    subject: `Payment Confirmation — Invoice ${invoiceNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0D9488;">Payment Received</h1>
        <p>Hi ${name},</p>
        <p>We've received your payment of <strong>${currency} ${amount}</strong>.</p>
        <p>Invoice: <strong>${invoiceNumber}</strong></p>
      </div>
    `,
  });
}

export async function sendExhibitorMemberWelcomeEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return sendEmail({ to, subject, html });
}

export async function sendBookingInquiryEmail(data: {
  eventType: string;
  startDate: string;
  endDate: string;
  expectedAttendees: number;
  additionalServices?: string[];
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber?: string;
  organization: string;
  country: string;
  message: string;
}) {
  const to = process.env.INQUIRY_EMAIL || "hello@aksharevents.com";
  const fullName = `${data.title} ${data.firstName} ${data.lastName}`.trim();

  return sendEmail({
    to,
    subject: `New Booking Inquiry — ${data.eventType} (${data.organization})`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0D9488;">New Booking &amp; Inquiry</h1>
        <h2 style="font-size: 16px; margin-top: 24px;">Event Details</h2>
        <p><strong>Event type:</strong> ${data.eventType}</p>
        <p><strong>Dates:</strong> ${data.startDate} — ${data.endDate}</p>
        <p><strong>Expected attendees:</strong> ${data.expectedAttendees}</p>
        <p><strong>Additional services:</strong> ${data.additionalServices?.length ? data.additionalServices.join(", ") : "None"}</p>
        <h2 style="font-size: 16px; margin-top: 24px;">Contact</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.contactNumber || "—"}</p>
        <p><strong>Organization:</strong> ${data.organization}</p>
        <p><strong>Country:</strong> ${data.country}</p>
        <h2 style="font-size: 16px; margin-top: 24px;">Message</h2>
        <p style="white-space: pre-wrap;">${data.message}</p>
      </div>
    `,
  });
}

export async function sendFlightBookingRequestNotification({
  companyName,
  eventTitle,
  travelDate,
  ticketCount,
  memberNames,
}: {
  companyName: string;
  eventTitle: string;
  travelDate: string;
  ticketCount: number;
  memberNames: string[];
}) {
  const to =
    process.env.EVENT_MASTER_NOTIFICATION_EMAIL ||
    process.env.FLIGHT_BOOKING_CC_EMAIL ||
    process.env.POSTMARK_SENDER_EMAIL ||
    "info@aksharevents.com";
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5001"}/admin`;

  return sendEmail({
    to,
    subject: `New flight booking request — ${companyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h1 style="color: #1C1A17;">New flight booking request</h1>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Event:</strong> ${eventTitle}</p>
        <p><strong>Travel date:</strong> ${travelDate}</p>
        <p><strong>Tickets:</strong> ${ticketCount}</p>
        <p><strong>Travellers:</strong></p>
        <ul>${memberNames.map((name) => `<li>${name}</li>`).join("")}</ul>
        <p style="margin-top: 24px;">
          <a href="${adminUrl}" style="display: inline-block; background: #C5A880; color: #1C1A17; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Review in Event Master
          </a>
        </p>
      </div>
    `,
  });
}

export async function sendFlightBookingPackageEmail({
  to,
  cc,
  companyName,
  eventTitle,
  travelDate,
  ticketCount,
  members,
  message,
  attachments,
}: {
  to: string;
  cc?: string;
  companyName: string;
  eventTitle: string;
  travelDate: string;
  ticketCount: number;
  members: { name: string; email: string; phone: string; passportNumber: string }[];
  message?: string;
  attachments: { name: string; content: string; contentType: string }[];
}) {
  const rows = members
    .map(
      (member, index) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #e5dfd4;">${index + 1}</td>
        <td style="padding: 8px; border: 1px solid #e5dfd4;">${member.name}</td>
        <td style="padding: 8px; border: 1px solid #e5dfd4;">${member.email}</td>
        <td style="padding: 8px; border: 1px solid #e5dfd4;">${member.phone}</td>
        <td style="padding: 8px; border: 1px solid #e5dfd4;">${member.passportNumber}</td>
      </tr>`
    )
    .join("");

  return sendEmail({
    to,
    cc,
    subject: `Flight booking package — ${companyName} (${eventTitle})`,
    attachments,
    html: `
      <div style="font-family: sans-serif; max-width: 720px; margin: 0 auto;">
        <h1 style="color: #1C1A17;">Flight booking traveller package</h1>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Event:</strong> ${eventTitle}</p>
        <p><strong>Travel date:</strong> ${travelDate}</p>
        <p><strong>Tickets requested:</strong> ${ticketCount}</p>
        ${message ? `<p style="white-space: pre-wrap;"><strong>Note from coordinator:</strong><br/>${message}</p>` : ""}
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
          <thead>
            <tr style="background: #EFECE6;">
              <th style="padding: 8px; border: 1px solid #e5dfd4; text-align: left;">#</th>
              <th style="padding: 8px; border: 1px solid #e5dfd4; text-align: left;">Name</th>
              <th style="padding: 8px; border: 1px solid #e5dfd4; text-align: left;">Email</th>
              <th style="padding: 8px; border: 1px solid #e5dfd4; text-align: left;">Phone</th>
              <th style="padding: 8px; border: 1px solid #e5dfd4; text-align: left;">Passport #</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top: 20px; color: #6b6560; font-size: 13px;">
          Each traveller's documents are attached as a separate PDF (e.g. "Kalpit Patel Documents.pdf").
          These files contain official identity documents — please handle confidentially.
        </p>
      </div>
    `,
  });
}
