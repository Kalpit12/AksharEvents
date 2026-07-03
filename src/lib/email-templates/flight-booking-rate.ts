import { BRAND } from "@/lib/utils";
import { flightBookingShortEventName } from "@/lib/email-templates/flight-booking-package";

export type FlightBookingRateTraveller = {
  name: string;
  email: string;
  travelDate: string;
};

export type FlightBookingRateEmailParams = {
  companyName: string;
  eventTitle: string;
  travellers: FlightBookingRateTraveller[];
  rateAmountPerPerson: number;
  rateCurrency: string;
  rateDetails?: string;
};

const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AxarEvents: Flight rate quote ({{shortEventName}})</title>
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
              <p style="margin: 0; font-size: 12px; color: #d9c9a8; letter-spacing: 0.04em; text-transform: uppercase;">Flight Rate Quote</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px; background: #ffffff;">
              <h1 style="margin: 0 0 8px; font-size: 21px; font-weight: 700; color: #1c1a17; line-height: 1.35;">Flight rate quote</h1>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #6b6560;">
                Please find the quoted flight rates for your team travelling to <strong style="color: #1c1a17;">{{eventTitle}}</strong> on behalf of <strong style="color: #1c1a17;">{{companyName}}</strong>.
              </p>

              <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #b3966e;">Travellers ({{travellerCount}})</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5dfd4; border-radius: 12px; overflow: hidden; margin: 0 0 24px;">
                <tr style="background: #efece6;">
                  <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b6560; border-bottom: 1px solid #e5dfd4;">#</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b6560; border-bottom: 1px solid #e5dfd4;">Name</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b6560; border-bottom: 1px solid #e5dfd4;">Email</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b6560; border-bottom: 1px solid #e5dfd4;">Travel date</th>
                </tr>
                {{travellerRows}}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="background: #f9f6f0; border: 1px solid #e5dfd4; border-radius: 12px; padding: 20px 22px;">
                    <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #b3966e;">Rate per person</p>
                    <p style="margin: 0 0 14px; font-size: 28px; font-weight: 700; color: #1c1a17; line-height: 1.2;">{{perPersonRate}}</p>
                    <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #b3966e;">Combined total ({{travellerCount}} travellers)</p>
                    <p style="margin: 0; font-size: 20px; font-weight: 700; color: #1c1a17;">{{totalRate}}</p>
                    {{detailsBlock}}
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6b6560;">
                The amounts above are quoted <strong style="color: #1c1a17;">per person</strong>. Please confirm acceptance so we can proceed with your booking.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 22px 32px 26px; border-top: 1px solid #e5dfd4; background: #efece6;">
              <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.6; color: #6b6560; text-align: center;">
                Sent via AxarEvents
              </p>
              <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.6; color: #6b6560; text-align: center;">
                For any queries, contact us at <a href="mailto:info@axarevents.com" style="color: #b3966e; text-decoration: none; font-weight: 600;">info@axarevents.com</a>
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

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString()}`;
}

function buildTravellerRows(travellers: FlightBookingRateTraveller[]) {
  return travellers
    .map(
      (traveller, index) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5dfd4; color: #6b6560; font-size: 13px;">${index + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5dfd4; font-weight: 600; color: #1c1a17; font-size: 13px;">${escapeHtml(traveller.name)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5dfd4; color: #1c1a17; font-size: 13px;">${escapeHtml(traveller.email)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5dfd4; color: #1c1a17; font-size: 13px;">${escapeHtml(traveller.travelDate)}</td>
      </tr>`
    )
    .join("");
}

export function flightBookingRateEmailSubject(companyName: string, travellerCount: number) {
  const label = travellerCount === 1 ? "1 traveller" : `${travellerCount} travellers`;
  return `Flight rate quote (${label}) — ${companyName}`;
}

export function flightBookingRateEmailHtml(params: FlightBookingRateEmailParams) {
  const total = params.rateAmountPerPerson * params.travellers.length;
  const detailsBlock = params.rateDetails?.trim()
    ? `<p style="margin: 16px 0 0; padding-top: 14px; border-top: 1px solid #e5dfd4; font-size: 13px; line-height: 1.6; color: #4b5563; white-space: pre-wrap;">${escapeHtml(params.rateDetails.trim())}</p>`
    : "";

  return fillTemplate(EMAIL_TEMPLATE, {
    brandName: escapeHtml(BRAND.name),
    year: String(new Date().getFullYear()),
    companyName: escapeHtml(params.companyName),
    eventTitle: escapeHtml(params.eventTitle),
    shortEventName: escapeHtml(flightBookingShortEventName(params.eventTitle)),
    travellerCount: String(params.travellers.length),
    travellerRows: buildTravellerRows(params.travellers),
    perPersonRate: escapeHtml(formatMoney(params.rateAmountPerPerson, params.rateCurrency)),
    totalRate: escapeHtml(formatMoney(total, params.rateCurrency)),
    detailsBlock,
  });
}
