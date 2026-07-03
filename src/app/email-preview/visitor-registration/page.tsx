import {
  visitorRegistrationEmailHtml,
  VISITOR_REGISTRATION_EMAIL_SAMPLE,
} from "@/lib/email-templates/visitor-registration-confirmation";

export default function VisitorRegistrationEmailPreviewPage() {
  const html = visitorRegistrationEmailHtml(VISITOR_REGISTRATION_EMAIL_SAMPLE);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="border-b border-border bg-background px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Email preview</p>
          <h1 className="text-lg font-bold">Visitor registration confirmation</h1>
          <p className="text-sm text-muted-foreground">
            Sent when a visitor completes registration — includes event details, badge, QR code, and download links.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Static file:{" "}
            <a href="/email-previews/visitor-registration-confirmation.html" className="text-primary underline">
              /email-previews/visitor-registration-confirmation.html
            </a>
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <iframe
            title="Visitor registration email preview"
            srcDoc={html}
            className="h-[900px] w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
