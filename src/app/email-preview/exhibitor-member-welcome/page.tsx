import {
  exhibitorMemberWelcomeEmailHtml,
  type ExhibitorMemberWelcomeParams,
} from "@/lib/email-templates/exhibitor-member-welcome";
import { BRAND } from "@/lib/utils";

const sampleNewAccount: ExhibitorMemberWelcomeParams = {
  name: "Jane Doe",
  email: "jane.doe@example.com",
  password: "Kx7mP2nQw9Rt",
  companyName: "Acme Industries Ltd",
  loginUrl: "https://aksharevents.com/auth/exhibitor?mode=signin",
  invitedByName: "John Smith",
};

const sampleExistingAccount: ExhibitorMemberWelcomeParams = {
  name: "Alex Kim",
  email: "alex.kim@example.com",
  companyName: "Acme Industries Ltd",
  loginUrl: "https://aksharevents.com/auth/exhibitor?mode=signin",
  invitedByName: "John Smith",
};

export default function ExhibitorMemberWelcomeEmailPreviewPage() {
  const html = exhibitorMemberWelcomeEmailHtml(sampleNewAccount);
  const existingHtml = exhibitorMemberWelcomeEmailHtml(sampleExistingAccount);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="border-b border-border bg-background px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Email preview</p>
            <h1 className="text-lg font-bold">Exhibitor member welcome</h1>
            <p className="text-sm text-muted-foreground">
              Branded credential email sent when members are added individually or via bulk CSV upload.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">{BRAND.name} · {BRAND.tagline}</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit space-y-4 rounded-xl border border-border bg-background p-4 text-sm">
          <div>
            <p className="mb-1 font-medium">Sample (new account)</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li><strong>To:</strong> {sampleNewAccount.email}</li>
              <li><strong>Company:</strong> {sampleNewAccount.companyName}</li>
              <li><strong>Includes password:</strong> Yes</li>
            </ul>
          </div>
          <div className="border-t border-border pt-4">
            <p className="mb-1 font-medium">Template file</p>
            <p className="text-xs text-muted-foreground">
              All markup lives in <code>src/lib/email-templates/exhibitor-member-welcome.html</code> (credential variants are in HTML comments at the bottom of that file).
            </p>
          </div>
          <div className="border-t border-border pt-4">
            <p className="mb-1 font-medium">Existing account variant</p>
            <p className="text-xs text-muted-foreground">
              When the email already has an {BRAND.name} account, the template omits the password block and asks them to sign in with their existing password.
            </p>
          </div>
          <div className="border-t border-border pt-4">
            <p className="mb-1 font-medium">Trigger</p>
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              <li>Add member (individual)</li>
              <li>Bulk CSV upload</li>
            </ul>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <p className="border-b border-border bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
              New account (with credentials)
            </p>
            <iframe title="New account email preview" srcDoc={html} className="h-[820px] w-full border-0" />
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <p className="border-b border-border bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
              Existing account (no password)
            </p>
            <iframe title="Existing account email preview" srcDoc={existingHtml} className="h-[720px] w-full border-0" />
          </div>
          <details className="rounded-xl border border-border bg-background p-4">
            <summary className="cursor-pointer text-sm font-medium">View HTML source</summary>
            <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs">{html}</pre>
          </details>
        </div>
      </div>
    </div>
  );
}
