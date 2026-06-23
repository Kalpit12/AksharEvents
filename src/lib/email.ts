import { Resend } from "resend";
import { BRAND } from "./utils";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || `${BRAND.name} <noreply@aksharevents.com>`;

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.log(`[Email] To: ${to} | Subject: ${subject}`);
    return { success: true, id: "dev-mode" };
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });

  if (error) {
    console.error(`[Email] Failed to send to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
  return { success: true, id: data?.id };
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
