"use client";

import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { CustomSelect } from "@/components/exhibitor-portal/custom-select";
import { cn } from "@/lib/utils";
import { Hotel, Plane, Smartphone, Banknote, Bus, FileUp } from "lucide-react";

export type TravelLogisticsForm = {
  flightTicket: "no" | "one_way" | "two_way";
  visaHelp: "already_have" | "apply_myself" | "need_help";
  hotel: "yes" | "no";
  airportHotelTransfer: "yes" | "no";
  flightNumber: string;
  arrivalTime: string;
  sim: "none" | "new_sim" | "recharge_only";
  moneyExchange: "no" | "yes";
  moneyExchangeAmount: string;
  moneyExchangeCurrency: "USD" | "EUR" | "GBP";
  dailyVenueTransport: "yes" | "no";
};

export const EXCHANGE_RATES_TO_KES: Record<TravelLogisticsForm["moneyExchangeCurrency"], number> = {
  USD: 129,
  EUR: 140,
  GBP: 163,
};

export function convertToKes(amount: string, currency: TravelLogisticsForm["moneyExchangeCurrency"]): number | null {
  const value = parseFloat(amount.replace(/,/g, ""));
  if (!amount.trim() || Number.isNaN(value) || value <= 0) return null;
  return Math.round(value * EXCHANGE_RATES_TO_KES[currency]);
}

export type VisaDocumentKey =
  | "passportBioPage"
  | "passportPhoto"
  | "returnTicket"
  | "accommodationProof"
  | "employerLetter"
  | "yellowFever";

export type VisaDocuments = Record<VisaDocumentKey, File | null>;

/** Documents commonly required for Kenya Electronic Travel Authorization (eTA) — business visitors. */
export const KENYA_ETA_VISA_DOCUMENTS: {
  key: VisaDocumentKey;
  label: string;
  hint: string;
  required: boolean;
}[] = [
  {
    key: "passportBioPage",
    label: "Passport bio-data page",
    hint: "Clear scan of the photo page. Passport must be valid at least 6 months beyond your stay.",
    required: true,
  },
  {
    key: "passportPhoto",
    label: "Passport-size photograph",
    hint: "Recent colour photo on a plain background (JPEG or PNG, as per etakenya.go.ke).",
    required: true,
  },
  {
    key: "returnTicket",
    label: "Return or onward flight ticket",
    hint: "Confirmed booking showing your entry and departure from Kenya.",
    required: true,
  },
  {
    key: "accommodationProof",
    label: "Proof of accommodation",
    hint: "Hotel booking confirmation or other proof of where you will stay in Kenya.",
    required: true,
  },
  {
    key: "employerLetter",
    label: "Company / employer letter",
    hint: "Letter on company letterhead confirming your role and business purpose for visiting Kenya.",
    required: true,
  },
  {
    key: "yellowFever",
    label: "Yellow fever vaccination certificate",
    hint: "Only if you are arriving from or transiting through a yellow-fever endemic country.",
    required: false,
  },
];

export const defaultVisaDocs: VisaDocuments = {
  passportBioPage: null,
  passportPhoto: null,
  returnTicket: null,
  accommodationProof: null,
  employerLetter: null,
  yellowFever: null,
};

export const defaultTravelForm: TravelLogisticsForm = {
  flightTicket: "no",
  visaHelp: "already_have",
  hotel: "no",
  airportHotelTransfer: "no",
  flightNumber: "",
  arrivalTime: "",
  sim: "none",
  moneyExchange: "no",
  moneyExchangeAmount: "",
  moneyExchangeCurrency: "USD",
  dailyVenueTransport: "no",
};

type Props = {
  travel: TravelLogisticsForm;
  visaDocs: VisaDocuments;
  onTravelChange: (travel: TravelLogisticsForm) => void;
  onVisaDocsChange: (docs: VisaDocuments) => void;
};

export function TravelLogisticsFields({ travel, visaDocs, onTravelChange, onVisaDocsChange }: Props) {
  const set = <K extends keyof TravelLogisticsForm>(key: K, value: TravelLogisticsForm[K]) => {
    onTravelChange({ ...travel, [key]: value });
  };

  const setDoc = (key: keyof VisaDocuments, file: File | null) => {
    onVisaDocsChange({ ...visaDocs, [key]: file });
  };

  return (
    <div className="space-y-6">
      <QuestionSection number={1} title="Flight ticket" icon={Plane}>
        <p className="mb-3 text-sm text-muted-foreground">Do you want a flight ticket?</p>
        <RadioOptions
          name="flightTicket"
          value={travel.flightTicket}
          onChange={(v) => set("flightTicket", v as TravelLogisticsForm["flightTicket"])}
          options={[
            { value: "no", label: "No — I will arrange my own" },
            { value: "one_way", label: "Yes — One-way" },
            { value: "two_way", label: "Yes — Two-way (return)" },
          ]}
        />
      </QuestionSection>

      <QuestionSection number="1a" title="Kenya travel authorization (eTA)" icon={FileUp} sub>
        <p className="mb-1 text-sm text-muted-foreground">
          Do you need help applying for Kenya&apos;s Electronic Travel Authorization (eTA)?
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          All international visitors must obtain an eTA before travel via{" "}
          <a
            href="https://www.etakenya.go.ke"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            etakenya.go.ke
          </a>
          . Apply at least 3 days before departure.
        </p>
        <RadioOptions
          name="visaHelp"
          value={travel.visaHelp}
          onChange={(v) => set("visaHelp", v as TravelLogisticsForm["visaHelp"])}
          options={[
            { value: "already_have", label: "No — I already have an eTA / authorization" },
            { value: "apply_myself", label: "No — I will apply by myself" },
            { value: "need_help", label: "Yes — I need help with my eTA application" },
          ]}
        />
        {travel.visaHelp === "need_help" && (
          <div className="mt-4 rounded-xl border border-dashed border-champagne bg-champagne/10/50 p-4 dark:border-champagne/20 dark:bg-champagne/10">
            <p className="text-sm font-medium text-foreground">Upload documents for your Kenya eTA</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Our team will use these to assist with your application. The event host invitation letter
              will be provided separately where required.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {KENYA_ETA_VISA_DOCUMENTS.map((doc) => (
                <DocUpload
                  key={doc.key}
                  label={doc.label}
                  hint={doc.hint}
                  required={doc.required}
                  file={visaDocs[doc.key]}
                  onChange={(f) => setDoc(doc.key, f)}
                />
              ))}
            </div>
          </div>
        )}
      </QuestionSection>

      <QuestionSection number={2} title="Hotel / accommodation" icon={Hotel}>
        <p className="mb-3 text-sm text-muted-foreground">Do you want hotel or accommodation services?</p>
        <RadioOptions
          name="hotel"
          value={travel.hotel}
          onChange={(v) => set("hotel", v as TravelLogisticsForm["hotel"])}
          options={[
            { value: "yes", label: "Yes — I need accommodation" },
            { value: "no", label: "No — I have my own arrangements" },
          ]}
        />
      </QuestionSection>

      {travel.hotel === "yes" && (
        <QuestionSection number="2a" title="Airport ↔ hotel transfer" icon={Bus} sub>
          <p className="mb-3 text-sm text-muted-foreground">
            Do you need logistics from the airport to the hotel and vice versa?
          </p>
          <RadioOptions
            name="airportHotelTransfer"
            value={travel.airportHotelTransfer}
            onChange={(v) => set("airportHotelTransfer", v as TravelLogisticsForm["airportHotelTransfer"])}
            options={[
              { value: "yes", label: "Yes — Airport pickup & drop-off" },
              { value: "no", label: "No — I will arrange my own transport" },
            ]}
          />
          {travel.airportHotelTransfer === "yes" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="flightNumber">Flight number</Label>
                <Input
                  id="flightNumber"
                  value={travel.flightNumber}
                  onChange={(e) => set("flightNumber", e.target.value)}
                  placeholder="e.g. KQ 101"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="arrivalTime">Time of arrival</Label>
                <Input
                  id="arrivalTime"
                  type="datetime-local"
                  value={travel.arrivalTime}
                  onChange={(e) => set("arrivalTime", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          )}
        </QuestionSection>
      )}

      <QuestionSection number={3} title="SIM card" icon={Smartphone}>
        <p className="mb-3 text-sm text-muted-foreground">
          Do you need a SIM (recharged), or do you already have a SIM but need a recharge?
        </p>
        <RadioOptions
          name="sim"
          value={travel.sim}
          onChange={(v) => set("sim", v as TravelLogisticsForm["sim"])}
          options={[
            { value: "none", label: "No — I don't need a SIM" },
            { value: "new_sim", label: "Yes — I need a new SIM (recharged)" },
            { value: "recharge_only", label: "I have a SIM — I only need a recharge" },
          ]}
        />
      </QuestionSection>

      <QuestionSection number={4} title="Money exchange" icon={Banknote}>
        <p className="mb-3 text-sm text-muted-foreground">Do you need money exchange?</p>
        <RadioOptions
          name="moneyExchange"
          value={travel.moneyExchange}
          onChange={(v) => set("moneyExchange", v as TravelLogisticsForm["moneyExchange"])}
          options={[
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" },
          ]}
        />
        {travel.moneyExchange === "yes" && (
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex-1 space-y-3">
              <div>
                <Label htmlFor="moneyCurrency">Currency</Label>
                <div className="mt-1.5">
                  <CustomSelect
                    id="moneyCurrency"
                    value={travel.moneyExchangeCurrency}
                    onChange={(v) => set("moneyExchangeCurrency", v as TravelLogisticsForm["moneyExchangeCurrency"])}
                    options={[
                      { value: "USD", label: "USD — US Dollar" },
                      { value: "EUR", label: "EUR — Euro" },
                      { value: "GBP", label: "GBP — British Pound" },
                    ]}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="moneyAmount">Amount to exchange</Label>
                <Input
                  id="moneyAmount"
                  type="number"
                  min={0}
                  step="any"
                  value={travel.moneyExchangeAmount}
                  onChange={(e) => set("moneyExchangeAmount", e.target.value)}
                  placeholder="e.g. 500"
                  className="mt-1.5"
                />
              </div>
            </div>
            {(() => {
              const kes = convertToKes(travel.moneyExchangeAmount, travel.moneyExchangeCurrency);
              const rate = EXCHANGE_RATES_TO_KES[travel.moneyExchangeCurrency];
              return (
                <div className="min-w-[200px] rounded-xl border border-champagne/30 bg-champagne/10/80 p-4 dark:border-champagne/20 dark:bg-champagne/15">
                  <p className="text-xs font-medium uppercase tracking-wide text-champagne-dark dark:text-champagne-light">Estimated value</p>
                  {kes != null ? (
                    <>
                      <p className="mt-2 text-2xl font-bold text-espresso dark:text-champagne-light">
                        KES {kes.toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {travel.moneyExchangeAmount} {travel.moneyExchangeCurrency} × {rate} KES (indicative rate)
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Enter an amount to see the KES equivalent</p>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </QuestionSection>

      <QuestionSection number={5} title="Daily venue transport" icon={Bus}>
        <p className="mb-3 text-sm text-muted-foreground">
          Do you need logistics from your accommodation to the venue and back daily?
        </p>
        <RadioOptions
          name="dailyVenueTransport"
          value={travel.dailyVenueTransport}
          onChange={(v) => set("dailyVenueTransport", v as TravelLogisticsForm["dailyVenueTransport"])}
          options={[
            { value: "yes", label: "Yes — Daily shuttle to venue & return" },
            { value: "no", label: "No — I will arrange my own transport" },
          ]}
        />
      </QuestionSection>
    </div>
  );
}

function QuestionSection({
  number,
  title,
  icon: Icon,
  sub,
  children,
}: {
  number: number | string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  sub?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-border p-4", sub && "ml-0 sm:ml-4 border-l-4 border-l-primary")}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-champagne/15 px-1.5 text-xs font-semibold text-espresso dark:bg-champagne/15 dark:text-champagne-light">
          {number}
        </span>
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      {children}
    </section>
  );
}

function RadioOptions({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
            value === opt.value
              ? "border-primary bg-champagne/10 text-espresso dark:bg-champagne/10 dark:text-champagne-light"
              : "border-border hover:bg-muted/50"
          )}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="mt-0.5 accent-primary"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function DocUpload({
  label,
  hint,
  required,
  file,
  onChange,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/80 p-3">
      <Label className="text-xs font-semibold">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
        {!required ? <span className="font-normal text-muted-foreground"> (if applicable)</span> : null}
      </Label>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="mt-2 text-xs"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {file && <p className="mt-1 truncate text-[11px] text-primary">{file.name}</p>}
    </div>
  );
}

export function visaDocumentSummaryRows(visaDocs: VisaDocuments): [string, string][] {
  return KENYA_ETA_VISA_DOCUMENTS.map((doc) => [
    doc.label,
    visaDocs[doc.key] ? visaDocs[doc.key]!.name : doc.required ? "Not uploaded" : "Not uploaded (optional)",
  ]);
}

export function visaDocNamesFromFiles(
  visaDocs: VisaDocuments
): import("@/components/exhibitor-portal/registration-types").SavedRegistrationData["visaDocNames"] {
  return {
    passportBioPage: visaDocs.passportBioPage?.name ?? null,
    passportPhoto: visaDocs.passportPhoto?.name ?? null,
    returnTicket: visaDocs.returnTicket?.name ?? null,
    accommodationProof: visaDocs.accommodationProof?.name ?? null,
    employerLetter: visaDocs.employerLetter?.name ?? null,
    yellowFever: visaDocs.yellowFever?.name ?? null,
  };
}

export function formatTravelSummary(travel: TravelLogisticsForm, visaDocs: VisaDocuments) {
  const flightLabels = { no: "No", one_way: "One-way", two_way: "Two-way" };
  const visaLabels = {
    already_have: "Already have eTA",
    apply_myself: "Applying myself",
    need_help: "Need help",
  };
  const simLabels = { none: "Not needed", new_sim: "New SIM (recharged)", recharge_only: "Recharge only" };

  return [
    ["Flight ticket", flightLabels[travel.flightTicket]],
    ["Kenya eTA assistance", visaLabels[travel.visaHelp]],
    ...(travel.visaHelp === "need_help" ? visaDocumentSummaryRows(visaDocs) : []),
    ["Hotel / accommodation", travel.hotel === "yes" ? "Yes" : "No"],
    ...(travel.hotel === "yes"
      ? [
          ["Airport ↔ hotel transfer", travel.airportHotelTransfer === "yes" ? "Yes" : "No"],
          ...(travel.airportHotelTransfer === "yes"
            ? [
                ["Flight number", travel.flightNumber || "—"],
                ["Time of arrival", travel.arrivalTime ? new Date(travel.arrivalTime).toLocaleString() : "—"],
              ]
            : []),
        ]
      : []),
    ["SIM", simLabels[travel.sim]],
    [
      "Money exchange",
      travel.moneyExchange === "yes"
        ? (() => {
            const kes = convertToKes(travel.moneyExchangeAmount, travel.moneyExchangeCurrency);
            const base = travel.moneyExchangeAmount
              ? `${travel.moneyExchangeAmount} ${travel.moneyExchangeCurrency}`
              : "Yes (amount not specified)";
            return kes != null ? `${base} ≈ KES ${kes.toLocaleString()}` : base;
          })()
        : "No",
    ],
    ["Daily venue transport", travel.dailyVenueTransport === "yes" ? "Yes" : "No"],
  ] as [string, string][];
}
