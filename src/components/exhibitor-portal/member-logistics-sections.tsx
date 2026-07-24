"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { CustomSelect } from "@/components/exhibitor-portal/custom-select";
import { Panel } from "@/components/exhibitor-portal/exhibitor-portal-ui";
import {
  convertToKes,
  DocUpload,
  EXCHANGE_RATES_TO_KES,
  KENYA_ETA_VISA_DOCUMENTS,
  defaultVisaDocs,
  type VisaDocumentKey,
  type VisaDocuments,
} from "@/components/exhibitor-portal/registration-travel-step";
import {
  defaultMemberAccommodationLogistics,
  defaultMemberAirportLogistics,
  defaultMemberAirportVisaDocNames,
  defaultMemberExpoLogistics,
  defaultMemberTourLogistics,
  type MemberAccommodationLogistics,
  type MemberAirportLogistics,
  type MemberExpoLogistics,
  type MemberTourLogistics,
  type TeamMember,
} from "@/components/exhibitor-portal/types";
import type { EventActivityOption } from "@/lib/event-activity-types";
import {
  formatHotelOptionLabel,
  type EventHotelOption,
  type EventRestaurantOption,
} from "@/lib/event-config-types";
import type { SerializedTourTravelItinerary } from "@/lib/itinerary-types";
import { cn } from "@/lib/utils";
import {
  Banknote,
  Bus,
  Check,
  ForkKnife,
  Hotel,
  MapPin,
  Plane,
  Smartphone,
  Users,
} from "lucide-react";

type TourSelectOption = {
  id: string;
  title: string;
  description: string | null;
};

function MemberPicker({
  members,
  selectedId,
  onSelect,
  isDone,
}: {
  members: TeamMember[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isDone: (m: TeamMember) => boolean;
}) {
  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        Add team members under Your Booth first, then complete this section for each person.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {members.map((m) => {
        const done = isDone(m);
        const active = selectedId === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
              active
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-foreground hover:border-primary/40"
            )}
          >
            <span className="font-medium">
              {m.fn} {m.ln}
            </span>
            {done ? (
              <Check className={cn("h-3.5 w-3.5", active ? "text-white" : "text-emerald-600")} />
            ) : (
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  active ? "bg-white/70" : "bg-amber-400"
                )}
              />
            )}
          </button>
        );
      })}
    </div>
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

function QuestionBlock({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      {children}
    </section>
  );
}

function useSelectedMember(members: TeamMember[]) {
  const [selectedId, setSelectedId] = useState<string | null>(members[0]?.id ?? null);
  const selected = useMemo(
    () => members.find((m) => m.id === selectedId) ?? members[0] ?? null,
    [members, selectedId]
  );
  return { selectedId: selected?.id ?? null, setSelectedId, selected };
}

export function AirportLogisticsSection({
  members,
  onUpdateMember,
}: {
  members: TeamMember[];
  onUpdateMember: (memberId: string, patch: Partial<TeamMember>) => void;
}) {
  const { selectedId, setSelectedId, selected } = useSelectedMember(members);
  const logistics: MemberAirportLogistics =
    selected?.airportLogistics ?? defaultMemberAirportLogistics();
  const [visaFilesByMember, setVisaFilesByMember] = useState<Record<string, VisaDocuments>>({});

  const visaDocs: VisaDocuments =
    (selected && visaFilesByMember[selected.id]) || defaultVisaDocs;
  const visaDocNames = logistics.visaDocNames ?? defaultMemberAirportVisaDocNames();

  const setLogistics = (next: MemberAirportLogistics) => {
    if (!selected) return;
    onUpdateMember(selected.id, { airportLogistics: next });
  };

  const set = <K extends keyof MemberAirportLogistics>(key: K, value: MemberAirportLogistics[K]) => {
    setLogistics({ ...logistics, [key]: value, answered: false });
  };

  const setVisaDoc = (key: VisaDocumentKey, file: File | null) => {
    if (!selected) return;
    const nextFiles: VisaDocuments = { ...visaDocs, [key]: file };
    setVisaFilesByMember((current) => ({ ...current, [selected.id]: nextFiles }));
    setLogistics({
      ...logistics,
      visaDocNames: {
        ...visaDocNames,
        [key]: file?.name ?? null,
      },
      answered: false,
    });
  };

  const requiredEtaDocsReady =
    logistics.visaHelp !== "need_help" ||
    KENYA_ETA_VISA_DOCUMENTS.filter((d) => d.required).every(
      (d) => Boolean(visaDocs[d.key] || visaDocNames[d.key])
    );

  const markComplete = () => {
    if (!requiredEtaDocsReady) return;
    setLogistics({ ...logistics, answered: true });
  };

  return (
    <div className="space-y-5">
      <Panel title="Airport pick up & drop off" icon={Plane}>
        <p className="mb-4 text-sm text-muted-foreground">
          <strong className="font-semibold text-foreground">Select each team member individually</strong>,
          then tick / answer the flight, transfer, SIM, and money-exchange questions below.
        </p>
        <MemberPicker
          members={members}
          selectedId={selectedId}
          onSelect={setSelectedId}
          isDone={(m) => Boolean(m.airportLogistics?.answered)}
        />
      </Panel>

      {selected && (
        <Panel title={`${selected.fn} ${selected.ln}`} icon={Users}>
          <div className="space-y-5">
            <QuestionBlock title="Flight ticket" icon={Plane}>
              <p className="mb-3 text-sm text-muted-foreground">Do you need a flight ticket?</p>
              <RadioOptions
                name={`flightTicket-${selected.id}`}
                value={logistics.flightTicket}
                onChange={(v) => set("flightTicket", v as MemberAirportLogistics["flightTicket"])}
                options={[
                  { value: "no", label: "No — I will arrange my own" },
                  { value: "one_way", label: "Yes — One-way" },
                  { value: "two_way", label: "Yes — Two-way (return)" },
                ]}
              />
            </QuestionBlock>

            <QuestionBlock title="Kenya travel authorization (eTA)" icon={Plane}>
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
                name={`visaHelp-${selected.id}`}
                value={logistics.visaHelp}
                onChange={(v) => {
                  const visaHelp = v as MemberAirportLogistics["visaHelp"];
                  setLogistics({
                    ...logistics,
                    visaHelp,
                    visaDocNames:
                      visaHelp === "need_help"
                        ? logistics.visaDocNames ?? defaultMemberAirportVisaDocNames()
                        : defaultMemberAirportVisaDocNames(),
                    answered: false,
                  });
                  if (visaHelp !== "need_help") {
                    setVisaFilesByMember((current) => {
                      const next = { ...current };
                      delete next[selected.id];
                      return next;
                    });
                  }
                }}
                options={[
                  { value: "already_have", label: "No — I already have an eTA / authorization" },
                  { value: "apply_myself", label: "No — I will apply by myself" },
                  { value: "need_help", label: "Yes — I need help with my eTA application" },
                ]}
              />
              {logistics.visaHelp === "need_help" && (
                <div className="mt-4 rounded-xl border border-dashed border-champagne bg-champagne/10 p-4 dark:border-champagne/20">
                  <p className="text-sm font-medium text-foreground">
                    Upload documents for Kenya entry / eTA
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Required for travellers coming to Kenya from anywhere. Our team will use these to
                    assist with the eTA application. The event host invitation letter will be provided
                    separately where required.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {KENYA_ETA_VISA_DOCUMENTS.map((doc) => (
                      <DocUpload
                        key={doc.key}
                        label={doc.label}
                        hint={doc.hint}
                        required={doc.required}
                        file={visaDocs[doc.key]}
                        fileName={visaDocNames[doc.key]}
                        onChange={(f) => setVisaDoc(doc.key, f)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </QuestionBlock>

            <QuestionBlock title="Airport ↔ hotel transfer" icon={Bus}>
              <p className="mb-3 text-sm text-muted-foreground">
                Do you need logistics from the airport to the hotel and vice versa?
              </p>
              <RadioOptions
                name={`airportTransfer-${selected.id}`}
                value={logistics.airportHotelTransfer}
                onChange={(v) =>
                  set("airportHotelTransfer", v as MemberAirportLogistics["airportHotelTransfer"])
                }
                options={[
                  { value: "yes", label: "Yes — Airport pickup & drop-off" },
                  { value: "no", label: "No — I will arrange my own transport" },
                ]}
              />
              {logistics.airportHotelTransfer === "yes" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Flight number</Label>
                    <Input
                      value={logistics.flightNumber}
                      onChange={(e) => set("flightNumber", e.target.value)}
                      placeholder="e.g. KQ 101"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Time of arrival</Label>
                    <Input
                      type="datetime-local"
                      value={logistics.arrivalTime}
                      onChange={(e) => set("arrivalTime", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              )}
            </QuestionBlock>

            <QuestionBlock title="SIM card" icon={Smartphone}>
              <p className="mb-3 text-sm text-muted-foreground">
                Do you need a SIM (recharged), or do you already have a SIM but need a recharge?
              </p>
              <RadioOptions
                name={`sim-${selected.id}`}
                value={logistics.sim}
                onChange={(v) => set("sim", v as MemberAirportLogistics["sim"])}
                options={[
                  { value: "none", label: "No — I don't need a SIM" },
                  { value: "new_sim", label: "Yes — I need a new SIM (recharged)" },
                  { value: "recharge_only", label: "I have a SIM — I only need a recharge" },
                ]}
              />
            </QuestionBlock>

            <QuestionBlock title="Money exchange" icon={Banknote}>
              <p className="mb-3 text-sm text-muted-foreground">Do you need money exchange?</p>
              <RadioOptions
                name={`money-${selected.id}`}
                value={logistics.moneyExchange}
                onChange={(v) => set("moneyExchange", v as MemberAirportLogistics["moneyExchange"])}
                options={[
                  { value: "no", label: "No" },
                  { value: "yes", label: "Yes" },
                ]}
              />
              {logistics.moneyExchange === "yes" && (
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label>Currency</Label>
                      <div className="mt-1.5">
                        <CustomSelect
                          value={logistics.moneyExchangeCurrency}
                          onChange={(v) =>
                            set(
                              "moneyExchangeCurrency",
                              v as MemberAirportLogistics["moneyExchangeCurrency"]
                            )
                          }
                          options={[
                            { value: "USD", label: "USD — US Dollar" },
                            { value: "EUR", label: "EUR — Euro" },
                            { value: "GBP", label: "GBP — British Pound" },
                          ]}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Amount to exchange</Label>
                      <Input
                        type="number"
                        min={0}
                        value={logistics.moneyExchangeAmount}
                        onChange={(e) => set("moneyExchangeAmount", e.target.value)}
                        placeholder="e.g. 500"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  {(() => {
                    const kes = convertToKes(
                      logistics.moneyExchangeAmount,
                      logistics.moneyExchangeCurrency
                    );
                    const rate = EXCHANGE_RATES_TO_KES[logistics.moneyExchangeCurrency];
                    return (
                      <div className="min-w-[200px] rounded-xl border border-champagne/30 bg-champagne/10 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-champagne-dark">
                          Estimated value
                        </p>
                        {kes != null ? (
                          <>
                            <p className="mt-2 text-2xl font-bold">KES {kes.toLocaleString()}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {logistics.moneyExchangeAmount} {logistics.moneyExchangeCurrency} ×{" "}
                              {rate} KES
                            </p>
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">Enter an amount</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </QuestionBlock>

            <div className="flex justify-end">
              <Button
                onClick={markComplete}
                disabled={!requiredEtaDocsReady}
                className="gap-1.5"
              >
                <Check className="h-4 w-4" />
                {logistics.answered ? "Saved for this member" : "Mark complete for this member"}
              </Button>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

export function AccommodationSection({
  members,
  hotels,
  onUpdateMember,
}: {
  members: TeamMember[];
  hotels: EventHotelOption[];
  onUpdateMember: (memberId: string, patch: Partial<TeamMember>) => void;
}) {
  const { selectedId, setSelectedId, selected } = useSelectedMember(members);
  const logistics: MemberAccommodationLogistics =
    selected?.accommodationLogistics ??
    defaultMemberAccommodationLogistics();

  const hotelOptions = useMemo(
    () =>
      hotels
        .filter((h) => h.isActive)
        .map((h) => ({
          value: formatHotelOptionLabel(h),
          label: formatHotelOptionLabel(h),
          description: h.description,
        })),
    [hotels]
  );

  const setLogistics = (next: MemberAccommodationLogistics) => {
    if (!selected) return;
    onUpdateMember(selected.id, {
      accommodationLogistics: next,
      hotel: next.needHotel === "yes" ? next.hotel : selected.hotel,
    });
  };

  const set = <K extends keyof MemberAccommodationLogistics>(
    key: K,
    value: MemberAccommodationLogistics[K]
  ) => {
    setLogistics({ ...logistics, [key]: value, answered: false });
  };

  return (
    <div className="space-y-5">
      <Panel title="Accommodation" icon={Hotel}>
        <p className="mb-4 text-sm text-muted-foreground">
          <strong className="font-semibold text-foreground">Select each team member individually</strong>,
          then tick / answer the accommodation questions below.
        </p>
        <MemberPicker
          members={members}
          selectedId={selectedId}
          onSelect={setSelectedId}
          isDone={(m) => Boolean(m.accommodationLogistics?.answered)}
        />
      </Panel>

      {selected && (
        <Panel title={`${selected.fn} ${selected.ln}`} icon={Users}>
          <div className="space-y-5">
            <QuestionBlock title="Hotel / accommodation" icon={Hotel}>
              <p className="mb-3 text-sm text-muted-foreground">
                Do you want hotel or accommodation services?
              </p>
              <RadioOptions
                name={`needHotel-${selected.id}`}
                value={logistics.needHotel}
                onChange={(v) => {
                  const needHotel = v as MemberAccommodationLogistics["needHotel"];
                  setLogistics({
                    ...logistics,
                    needHotel,
                    hotel: needHotel === "yes" ? logistics.hotel : "",
                    answered: false,
                  });
                }}
                options={[
                  { value: "yes", label: "Yes — I need accommodation" },
                  { value: "no", label: "No — I have my own arrangements" },
                ]}
              />
            </QuestionBlock>

            {logistics.needHotel === "yes" && (
              <QuestionBlock title="Preferred hotel" icon={Hotel}>
                {hotelOptions.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                    No hotels are listed for this event yet.
                  </p>
                ) : (
                  <CustomSelect
                    value={logistics.hotel || ""}
                    onChange={(v) => set("hotel", v)}
                    options={hotelOptions.map(({ value, label }) => ({ value, label }))}
                    placeholder="Select hotel…"
                  />
                )}
              </QuestionBlock>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  if (logistics.needHotel === "yes" && hotelOptions.length > 0 && !logistics.hotel) {
                    return;
                  }
                  setLogistics({ ...logistics, answered: true });
                }}
                disabled={logistics.needHotel === "yes" && hotelOptions.length > 0 && !logistics.hotel}
                className="gap-1.5"
              >
                <Check className="h-4 w-4" />
                {logistics.answered ? "Saved for this member" : "Mark complete for this member"}
              </Button>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

export function FoodOutingsSection({
  restaurants,
  selected,
  onChange,
  onMarkComplete,
  isComplete,
}: {
  restaurants: EventRestaurantOption[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  onMarkComplete: () => void;
  isComplete: boolean;
}) {
  const activeRestaurants = useMemo(
    () => restaurants.filter((r) => r.isActive),
    [restaurants]
  );

  const restaurantOptions = useMemo(
    () =>
      activeRestaurants.map((restaurant) => {
        const label = [restaurant.name, restaurant.cuisine, restaurant.location]
          .filter(Boolean)
          .join(" · ");
        return { id: restaurant.id, value: label, label, description: restaurant.description };
      }),
    [activeRestaurants]
  );

  const availableOptions = useMemo(
    () => restaurantOptions.filter((opt) => !selected.has(opt.value)),
    [restaurantOptions, selected]
  );

  const selectedLabels = useMemo(() => {
    const known = new Set(restaurantOptions.map((o) => o.value));
    return [...selected].filter((label) => known.has(label) || restaurantOptions.some((o) => o.label.startsWith(label)));
  }, [restaurantOptions, selected]);

  return (
    <div className="space-y-5">
      <Panel title="Food outings" icon={ForkKnife}>
        <p className="mb-4 text-sm text-muted-foreground">
          Select restaurant outings from the dropdown — no manual entry.
        </p>

        {restaurantOptions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            No restaurants are listed for this event yet.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Add restaurant</Label>
              <div className="mt-1.5">
                <CustomSelect
                  value=""
                  onChange={(v) => {
                    if (!v) return;
                    const next = new Set(selected);
                    next.add(v);
                    onChange(next);
                  }}
                  options={availableOptions.map(({ value, label }) => ({ value, label }))}
                  placeholder="Select restaurant…"
                />
              </div>
            </div>

            {selectedLabels.length > 0 ? (
              <ul className="space-y-2">
                {selectedLabels.map((label) => (
                  <li
                    key={label}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{label}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const next = new Set(selected);
                        next.delete(label);
                        onChange(next);
                      }}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No restaurants selected yet.</p>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            onClick={onMarkComplete}
            disabled={restaurantOptions.length > 0 && selectedLabels.length === 0}
            className="gap-1.5"
          >
            <Check className="h-4 w-4" />
            {isComplete ? "Saved" : "Mark food outings complete"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}

export function ExpoTransportSection({
  members,
  onUpdateMember,
}: {
  members: TeamMember[];
  onUpdateMember: (memberId: string, patch: Partial<TeamMember>) => void;
}) {
  const { selectedId, setSelectedId, selected } = useSelectedMember(members);
  const logistics: MemberExpoLogistics =
    selected?.expoLogistics ?? defaultMemberExpoLogistics();

  const setLogistics = (next: MemberExpoLogistics) => {
    if (!selected) return;
    onUpdateMember(selected.id, {
      expoLogistics: next,
      transport: next.dailyShuttle === "yes" ? "Daily shuttle" : selected.transport,
    });
  };

  return (
    <div className="space-y-5">
      <Panel title="Expo pick up & drop off" icon={Bus}>
        <p className="mb-4 text-sm text-muted-foreground">
          <strong className="font-semibold text-foreground">Select each team member individually</strong>,
          then tick / answer the shuttle questions below.
        </p>
        <MemberPicker
          members={members}
          selectedId={selectedId}
          onSelect={setSelectedId}
          isDone={(m) => Boolean(m.expoLogistics?.answered)}
        />
      </Panel>

      {selected && (
        <Panel title={`${selected.fn} ${selected.ln}`} icon={Users}>
          <div className="space-y-5">
            <QuestionBlock title="Daily shuttle to the expo" icon={Bus}>
              <p className="mb-3 text-sm text-muted-foreground">
                Do you need a daily shuttle from your accommodation to the expo venue and back?
              </p>
              <RadioOptions
                name={`shuttle-${selected.id}`}
                value={logistics.dailyShuttle}
                onChange={(v) =>
                  setLogistics({
                    ...logistics,
                    dailyShuttle: v as MemberExpoLogistics["dailyShuttle"],
                    answered: false,
                  })
                }
                options={[
                  { value: "yes", label: "Yes — Daily shuttle to the expo & return" },
                  { value: "no", label: "No — I will arrange my own transport" },
                ]}
              />
            </QuestionBlock>

            <div className="flex justify-end">
              <Button
                onClick={() => setLogistics({ ...logistics, answered: true })}
                className="gap-1.5"
              >
                <Check className="h-4 w-4" />
                {logistics.answered ? "Saved for this member" : "Mark complete for this member"}
              </Button>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

export function ToursSection({
  members,
  tourActivities,
  tourItineraries = [],
  schedules,
  onUpdateMember,
}: {
  members: TeamMember[];
  tourActivities: EventActivityOption[];
  /** Published Tour & Travel trips from Event Master (e.g. Nilkanth Yatra) */
  tourItineraries?: SerializedTourTravelItinerary[];
  schedules: React.ReactNode;
  onUpdateMember: (memberId: string, patch: Partial<TeamMember>) => void;
}) {
  const { selectedId, setSelectedId, selected } = useSelectedMember(members);
  const logistics: MemberTourLogistics =
    selected?.tourLogistics ?? defaultMemberTourLogistics();

  const tourOptions = useMemo((): TourSelectOption[] => {
    const fromActivities: TourSelectOption[] = tourActivities.map((tour) => ({
      id: tour.id,
      title: tour.title,
      description: tour.description,
    }));
    const fromItineraries: TourSelectOption[] = tourItineraries
      .filter((trip) => trip.isPublished)
      .map((trip) => {
        const stopCount = trip.days.reduce((sum, day) => sum + day.stops.length, 0);
        const detail = `${trip.days.length} day${trip.days.length === 1 ? "" : "s"} · ${stopCount} stop${stopCount === 1 ? "" : "s"}`;
        const raw = trip.description?.trim() ?? "";
        const isImportNote = /^imported from\s+/i.test(raw);
        return {
          id: trip.id,
          title: trip.title,
          description: isImportNote || !raw ? detail : raw,
        };
      });

    const seen = new Set<string>();
    return [...fromItineraries, ...fromActivities].filter((opt) => {
      if (seen.has(opt.id)) return false;
      seen.add(opt.id);
      return true;
    });
  }, [tourActivities, tourItineraries]);

  const setLogistics = (next: MemberTourLogistics) => {
    if (!selected) return;
    const labels = tourOptions
      .filter((t) => next.selectedTourIds.includes(t.id))
      .map((t) => t.title)
      .join(", ");
    onUpdateMember(selected.id, {
      tourLogistics: next,
      tours: labels || selected.tours,
    });
  };

  const toggleTour = (id: string) => {
    const set = new Set(logistics.selectedTourIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setLogistics({
      ...logistics,
      selectedTourIds: [...set],
      answered: false,
    });
  };

  return (
    <div className="space-y-5">
      <Panel title="Tours" icon={MapPin}>
        <p className="mb-4 text-sm text-muted-foreground">
          <strong className="font-semibold text-foreground">Select each team member individually</strong>,
          then tick the tours they will join below. Schedules published by the event team appear under
          the questions.
        </p>
        <MemberPicker
          members={members}
          selectedId={selectedId}
          onSelect={setSelectedId}
          isDone={(m) => Boolean(m.tourLogistics?.answered)}
        />
      </Panel>

      {selected && (
        <Panel title={`${selected.fn} ${selected.ln} — tour preferences`} icon={Users}>
          <div className="space-y-5">
            {tourOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tours have been published for this event yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {tourOptions.map((tour) => {
                  const checked = logistics.selectedTourIds.includes(tour.id);
                  return (
                    <label
                      key={tour.id}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors",
                        checked
                          ? "border-primary bg-champagne/10"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTour(tour.id)}
                        className="mt-1 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-semibold">{tour.title}</p>
                        {tour.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{tour.description}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <div>
              <Label>Notes</Label>
              <Textarea
                value={logistics.notes}
                onChange={(e) =>
                  setLogistics({ ...logistics, notes: e.target.value, answered: false })
                }
                placeholder="Any tour preferences or constraints…"
                className="mt-1.5"
                rows={3}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setLogistics({ ...logistics, answered: true })}
                className="gap-1.5"
              >
                <Check className="h-4 w-4" />
                {logistics.answered ? "Saved for this member" : "Mark complete for this member"}
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {schedules}
    </div>
  );
}
