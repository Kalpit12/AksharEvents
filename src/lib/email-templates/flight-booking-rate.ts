export function flightBookingRateEmailSubject(companyName: string, travellerName: string) {
  return `Flight rate for ${travellerName} — ${companyName}`;
}

export function flightBookingRateEmailHtml({
  companyName,
  eventTitle,
  travellerName,
  travelDate,
  rateAmount,
  rateCurrency,
  rateDetails,
}: {
  companyName: string;
  eventTitle: string;
  travellerName: string;
  travelDate: string;
  rateAmount: number;
  rateCurrency: string;
  rateDetails?: string;
}) {
  const formattedAmount = `${rateCurrency} ${rateAmount.toLocaleString()}`;
  const detailsBlock = rateDetails
    ? `<p style="margin: 16px 0 0; color: #4B5563; white-space: pre-wrap;">${rateDetails}</p>`
    : "";

  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 640px; margin: 0 auto; color: #1C1A17;">
      <div style="background: #C5A880; padding: 24px 28px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 22px; color: #1C1A17;">Flight rate quote</h1>
      </div>
      <div style="background: #FAF8F5; padding: 28px; border: 1px solid #E8E2D9; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; line-height: 1.6;">
          Hello,
        </p>
        <p style="margin: 0 0 16px; line-height: 1.6;">
          Please find the flight rate for <strong>${travellerName}</strong> travelling to <strong>${eventTitle}</strong> on behalf of <strong>${companyName}</strong>.
        </p>
        <div style="margin: 24px 0; padding: 20px; background: #fff; border-radius: 10px; border: 1px solid #E8E2D9;">
          <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280;">Quoted rate</p>
          <p style="margin: 0; font-size: 28px; font-weight: 700; color: #1C1A17;">${formattedAmount}</p>
          <p style="margin: 12px 0 0; color: #4B5563;">Travel date: ${travelDate}</p>
          ${detailsBlock}
        </div>
        <p style="margin: 0; line-height: 1.6; color: #4B5563;">
          Payment is arranged outside this portal. Once payment is received, your booking will be confirmed and forwarded to the travel agent.
        </p>
        <p style="margin: 24px 0 0; line-height: 1.6;">
          Regards,<br />
          <strong>Akshar Events</strong>
        </p>
      </div>
    </div>
  `;
}
