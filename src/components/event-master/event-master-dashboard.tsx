"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  AVATAR_COLORS,
  ROLE_BADGE,
  type AdminExhibitorRecord,
  type EventMasterTab,
} from "@/components/event-master/types";
import { useUrlEnumState, useUrlStringState } from "@/hooks/use-dashboard-url-state";
import {
  CustomSelect,
  fromAllValue,
  toAllValue,
  toSelectOptionsWithAll,
} from "@/components/exhibitor-portal/custom-select";
import ExhibitorRegistrationsPanel from "@/components/event-master/exhibitor-registrations-panel";
import EventCheckInsPanel from "@/components/event-master/event-check-ins-panel";
import OnsiteKioskPanel from "@/components/event-master/onsite-kiosk-panel";
import type { CheckInKind } from "@/components/event-master/event-check-ins-panel";
import FloorPlanPanel from "@/components/event-master/floor-plan-panel";
import ItineraryPanel from "@/components/event-master/itinerary-panel";
import { EventMasterHero, EventMasterQuickNav } from "@/components/event-master/event-master-ui";
import type { EventActivityOption } from "@/lib/event-activity-types";
import type {
  EventHotelOption,
  EventItemMasterOption,
  EventRestaurantOption,
  EventScheduleItemOption,
} from "@/lib/event-config-types";
import type { FloorPlanBoothRecord, EventFloorPlanConfig } from "@/lib/floor-plan-types";
import type { VisitorCheckInStats } from "@/lib/visitor-check-ins";
import type { ExhibitorCheckInStats } from "@/lib/exhibitor-check-ins";
import type { PublishedEventOption } from "@/components/event-master/visitor-check-ins-panel";
import type { SerializedTourTravelItinerary } from "@/lib/itinerary-types";
import {
  EventHotelsManager,
  EventRestaurantsManager,
  EventScheduleManager,
  ItemMasterManager,
} from "@/components/event-master/event-config-panels";
import {
  aggregateDietary,
  aggregateHotelAssignments,
  aggregateHotelRequests,
  aggregateMeals,
  aggregateMembers,
  aggregateRestaurantSelections,
  aggregateTransport,
  expoDaysFromRange,
} from "@/lib/event-master-aggregations";
import { Input } from "@/components/ui/Input";
import { cn, formatDate } from "@/lib/utils";
import {
  Award,
  BedDouble,
  Briefcase,
  Building2,
  Bus,
  CalendarDays,
  Coffee,
  Droplets,
  ForkKnife,
  Hotel,
  IdCard,
  Info,
  Leaf,
  Link2,
  ListOrdered,
  MapPin,
  Map,
  Package,
  Pencil,
  Plane,
  Route,
  ScanLine,
  Settings,
  Store,
  Ticket,
  Users,
  UtensilsCrossed,
} from "lucide-react";

const FlightBookingsPanelLazy = dynamic(
  () => import("@/components/event-master/flight-bookings-panel-lazy"),
  {
    loading: () => (
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-xl bg-muted/60" />
      </div>
    ),
  }
);

type Props = {
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  startDate: string;
  endDate: string;
  exhibitors?: AdminExhibitorRecord[];
  floorPlanBooths?: FloorPlanBoothRecord[];
  floorPlan?: EventFloorPlanConfig;
  boothFee?: number | null;
  boothFeeCurrency?: string;
  activities?: EventActivityOption[];
  eventHotels?: EventHotelOption[];
  eventRestaurants?: EventRestaurantOption[];
  scheduleItems?: EventScheduleItemOption[];
  itemMaster?: EventItemMasterOption[];
  tourTravelItineraries?: SerializedTourTravelItinerary[];
  flightBookingAgentEmail?: string;
  flightBookingCcEmail?: string;
  visitorCheckIns?: VisitorCheckInStats;
  exhibitorCheckIns?: ExhibitorCheckInStats;
  checkInKind?: CheckInKind;
  publishedEvents?: PublishedEventOption[];
  onsiteKiosk?: {
    enabled: boolean;
    hasPassword: boolean;
    slug: string;
  };
};

const EVENT_MASTER_TAB_IDS = [
  "exhibitors",
  "members",
  "flights",
  "supplies",
  "items",
  "transport",
  "hotels",
  "food",
  "schedule",
  "itinerary",
  "floorplan",
  "checkins",
  "onsite",
] as const satisfies readonly EventMasterTab[];

const TABS: { id: EventMasterTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "exhibitors", label: "Exhibitors", icon: Store },
  { id: "members", label: "Members", icon: Users },
  { id: "flights", label: "Flight bookings", icon: Plane },
  { id: "floorplan", label: "Floor plan", icon: Map },
  { id: "supplies", label: "Supplies", icon: Package },
  { id: "items", label: "Item master", icon: ListOrdered },
  { id: "transport", label: "Transport", icon: Bus },
  { id: "hotels", label: "Hotels", icon: Building2 },
  { id: "food", label: "Food", icon: ForkKnife },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "itinerary", label: "Itinerary", icon: Route },
  { id: "checkins", label: "Check-ins", icon: IdCard },
  { id: "onsite", label: "On-site registration", icon: ScanLine },
];

function initialsFromName(fn: string, ln: string) {
  return (fn[0] + ln[0]).toUpperCase();
}

export default function EventMasterDashboard({
  eventId,
  eventTitle,
  eventLocation,
  startDate,
  endDate,
  exhibitors = [],
  floorPlanBooths = [],
  floorPlan,
  boothFee = null,
  boothFeeCurrency = "KES",
  activities = [],
  eventHotels = [],
  eventRestaurants = [],
  scheduleItems = [],
  itemMaster = [],
  tourTravelItineraries = [],
  flightBookingAgentEmail = "",
  flightBookingCcEmail = "",
  visitorCheckIns,
  exhibitorCheckIns,
  checkInKind = "visitor",
  publishedEvents = [],
  onsiteKiosk,
}: Props) {
  const [tab, setTab] = useUrlEnumState("tab", EVENT_MASTER_TAB_IDS, "exhibitors");
  const [roleFilter, setRoleFilter] = useUrlStringState("role", "");
  const [bottlesPerDay, setBottlesPerDay] = useState(2);
  const [bufferPct, setBufferPct] = useState(10);

  const expoDays = expoDaysFromRange(startDate, endDate);
  const members = useMemo(() => aggregateMembers(exhibitors), [exhibitors]);
  const memberCount = members.length;
  const transportItems = useMemo(
    () => aggregateTransport(exhibitors, activities, tourTravelItineraries),
    [exhibitors, activities, tourTravelItineraries]
  );
  const hotelRequests = useMemo(() => aggregateHotelRequests(exhibitors), [exhibitors]);
  const hotelAssignments = useMemo(() => aggregateHotelAssignments(exhibitors), [exhibitors]);
  const mealAggregates = useMemo(() => aggregateMeals(exhibitors), [exhibitors]);
  const dietaryRows = useMemo(() => aggregateDietary(exhibitors), [exhibitors]);
  const restaurantSelections = useMemo(() => aggregateRestaurantSelections(exhibitors), [exhibitors]);

  const filteredMembers = useMemo(
    () => (roleFilter ? members.filter((m) => m.role === roleFilter) : members),
    [members, roleFilter]
  );

  const memberRoles = useMemo(() => [...new Set(members.map((m) => m.role))], [members]);

  const bufMul = 1 + bufferPct / 100;
  const supplyMembers = memberCount;

  const supplyItems = useMemo(() => {
    const n = supplyMembers;
    const days = expoDays;
    const bpd = bottlesPerDay;
    return [
      { icon: Droplets, label: "Water bottles", color: "text-primary", perDay: n * bpd, total: n * bpd * days, note: `${bpd}/person/day` },
      { icon: Ticket, label: "Meal passes", color: "text-emerald-600", perDay: n * 3, total: n * 3 * days, note: "3 meals/day" },
      { icon: Coffee, label: "Tea/coffee cups", color: "text-amber-600", perDay: n * 4, total: n * 4 * days, note: "4 cups/person/day" },
      { icon: IdCard, label: "Name badges", color: "text-violet-600", perDay: null, total: n, note: "one-time issue" },
      { icon: Briefcase, label: "Event kits/bags", color: "text-orange-600", perDay: null, total: n, note: "one-time issue" },
      { icon: Link2, label: "Lanyards", color: "text-champagne-dark", perDay: null, total: n, note: "one-time issue" },
      { icon: Pencil, label: "Pens & notepads", color: "text-primary", perDay: null, total: n, note: "one-time issue" },
      { icon: Award, label: "Certificates", color: "text-emerald-600", perDay: null, total: n, note: "end of event" },
    ];
  }, [supplyMembers, expoDays, bottlesPerDay]);

  const roleBreakdown = useMemo(() => {
    return memberRoles.map((role) => {
      const count = members.filter((m) => m.role === role).length;
      return { role, count, passesPerDay: count * 3, total: count * 3 * expoDays };
    });
  }, [members, memberRoles, expoDays]);

  const dateRange = `${formatDate(startDate, "MMM d")}–${formatDate(endDate, "d")}`;

  return (
    <div className={cn("space-y-5", tab === "floorplan" && "space-y-2")}>
      {tab !== "floorplan" && (
        <>
          <EventMasterHero
            eventId={eventId}
            eventTitle={eventTitle}
            eventLocation={eventLocation}
            dateRange={dateRange}
            exhibitorCount={exhibitors.length}
            memberCount={memberCount}
            expoDays={expoDays}
          />

          <EventMasterQuickNav active="dashboard" eventId={eventId} />
        </>
      )}

      <div
        className={cn(
          "relative",
          tab === "floorplan" ? "" : "rounded-2xl bg-muted/40 p-4 sm:p-6"
        )}
      >
      {tab !== "floorplan" && (
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Exhibitors", value: exhibitors.length, icon: Store },
          { label: "Team members", value: memberCount, icon: Users },
          { label: "Transport reqs", value: transportItems.length, icon: Bus },
          { label: "Hotel reqs", value: hotelRequests.length, icon: Hotel },
          { label: "Meal selections", value: mealAggregates.length, icon: UtensilsCrossed },
          { label: "Expo days", value: expoDays, icon: CalendarDays },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card px-4 py-3.5">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <m.icon className="h-3.5 w-3.5" />
              {m.label}
            </div>
            <div className="text-2xl font-semibold">{m.value}</div>
          </div>
        ))}
      </div>
      )}

      <div className={cn("flex flex-wrap gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 pb-2 sm:overflow-visible sm:pb-1", tab === "floorplan" ? "mb-2" : "mb-5")}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
              tab === id
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "exhibitors" && (
        <ExhibitorRegistrationsPanel
          exhibitors={exhibitors}
          eventTitle={eventTitle}
          activities={activities}
        />
      )}

      {tab === "floorplan" && floorPlan && (
        <FloorPlanPanel
          eventId={eventId}
          initialBooths={floorPlanBooths}
          initialFloorPlan={floorPlan}
          initialBoothFee={boothFee}
          initialBoothFeeCurrency={boothFeeCurrency}
          exhibitors={exhibitors}
        />
      )}

      {tab === "flights" && (
        <FlightBookingsPanelLazy
          eventId={eventId}
          exhibitors={exhibitors}
          eventTitle={eventTitle}
          defaultAgentEmail={flightBookingAgentEmail}
          defaultCcEmail={flightBookingCcEmail}
        />
      )}

      {tab === "members" && (
        <Panel title="Exhibitor team roster" icon={Users}>
          {members.length === 0 ? (
            <EmptyMessage message="No team members yet. Data appears when exhibitors add members in their portal." />
          ) : (
            <>
              <div className="mb-3 flex justify-end">
                <div className="w-48">
                  <CustomSelect
                    value={toAllValue(roleFilter)}
                    onChange={(value) => setRoleFilter(fromAllValue(value))}
                    placeholder="All roles"
                    size="sm"
                    options={toSelectOptionsWithAll(memberRoles, "All roles")}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] font-medium text-muted-foreground">
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Company</th>
                      <th className="pb-2">Role</th>
                      <th className="pb-2">Transport</th>
                      <th className="pb-2">Hotel</th>
                      <th className="pb-2">Food pref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((m, i) => (
                      <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold", AVATAR_COLORS[i % AVATAR_COLORS.length])}>
                              {initialsFromName(m.fn, m.ln)}
                            </span>
                            {m.fn} {m.ln}
                          </div>
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground">{m.company}</td>
                        <td className="py-2.5">
                          <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium", ROLE_BADGE[m.role] ?? "bg-muted text-muted-foreground")}>
                            {m.role}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground">{m.transport}</td>
                        <td className="py-2.5 text-xs text-muted-foreground">{m.hotel}</td>
                        <td className="py-2.5 text-xs text-muted-foreground">{m.food}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Panel>
      )}

      {tab === "supplies" && (
        <div className="space-y-4">
          {memberCount === 0 ? (
            <Panel title="Supply estimates" icon={Package}>
              <EmptyMessage message="Add exhibitor team members to calculate supply needs." />
            </Panel>
          ) : (
            <>
              <Panel title="Event parameters" icon={Settings}>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" /> Team members: <strong className="text-foreground">{memberCount}</strong>
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" /> Expo days: <strong className="text-foreground">{expoDays}</strong>
                  </span>
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <Droplets className="h-4 w-4" /> Bottles/person/day
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={bottlesPerDay}
                      onChange={(e) => setBottlesPerDay(Number(e.target.value) || 1)}
                      className="h-9 w-16"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-muted-foreground">
                    Buffer %
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      step={5}
                      value={bufferPct}
                      onChange={(e) => setBufferPct(Number(e.target.value) || 0)}
                      className="h-9 w-16"
                    />
                  </label>
                </div>
              </Panel>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {supplyItems.slice(0, 6).map((item) => {
                  const Icon = item.icon;
                  const withBuf = Math.round(item.total * bufMul);
                  return (
                    <div key={item.label} className="rounded-xl border border-border bg-card p-4 text-center">
                      <Icon className={cn("mx-auto mb-2 h-7 w-7", item.color)} />
                      <div className={cn("text-2xl font-semibold", item.color)}>{withBuf.toLocaleString()}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{item.label}</div>
                    </div>
                  );
                })}
              </div>

              <Panel title="Day-by-day breakdown" icon={Package}>
                <BreakdownTable
                  rows={supplyItems.map((item) => ({
                    label: item.label,
                    icon: item.icon,
                    color: item.color,
                    perDay: item.perDay,
                    total: item.total,
                  }))}
                  bufMul={bufMul}
                />
              </Panel>

              {roleBreakdown.length > 0 && (
                <Panel title="Meal pass breakdown by role" icon={Ticket}>
                  <SimpleTable
                    headers={["Role", "Count", "Passes/day", "Total passes"]}
                    rows={roleBreakdown.map((row) => [row.role, String(row.count), String(row.passesPerDay), String(row.total)])}
                  />
                </Panel>
              )}
            </>
          )}
        </div>
      )}

      {tab === "items" && <ItemMasterManager eventId={eventId} items={itemMaster} />}

      {tab === "transport" && (
        <Panel title="Transport requests from exhibitors" icon={Bus}>
          {transportItems.length === 0 ? (
            <EmptyMessage message="No transport requests yet. Exhibitors submit these in their registration form." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] font-medium text-muted-foreground">
                    <th className="pb-2">Company</th>
                    <th className="pb-2">Request</th>
                    <th className="pb-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {transportItems.map((item, i) => (
                    <tr key={`${item.company}-${item.title}-${i}`} className="border-b border-border last:border-0">
                      <td className="py-2.5 font-medium">{item.company}</td>
                      <td className="py-2.5">{item.title}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{item.sub}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab === "hotels" && (
        <div className="space-y-4">
          <EventHotelsManager eventId={eventId} hotels={eventHotels} />
          <Panel title="Hotel accommodation requests" icon={Building2}>
            {hotelRequests.length === 0 ? (
              <EmptyMessage message="No hotel requests yet." />
            ) : (
              <div className="space-y-2">
                {hotelRequests.map((req) => (
                  <div key={req.company} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
                    <span className="font-medium">{req.company}</span>
                    <span className="text-muted-foreground">{req.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Team hotel assignments" icon={BedDouble}>
            {hotelAssignments.length === 0 ? (
              <EmptyMessage message="No hotel assignments recorded in exhibitor team profiles." />
            ) : (
              <SimpleTable
                headers={["Name", "Company", "Hotel"]}
                rows={hotelAssignments.map((a) => [a.name, a.company, a.hotel])}
              />
            )}
          </Panel>
        </div>
      )}

      {tab === "food" && (
        <div className="space-y-4">
          <EventRestaurantsManager eventId={eventId} restaurants={eventRestaurants} />
          <Panel title="Meal selections" icon={UtensilsCrossed}>
            {mealAggregates.length === 0 ? (
              <EmptyMessage message="No meal selections yet. Exhibitors choose meals in their registration form." />
            ) : (
              <SimpleTable
                headers={["Meal", "Est. attendees", "Companies"]}
                rows={mealAggregates.map((m) => [m.meal, String(m.attendees), m.companies.join(", ")])}
              />
            )}
          </Panel>
          <Panel title="Restaurant outing selections" icon={Coffee}>
            {restaurantSelections.length === 0 ? (
              <EmptyMessage message="No restaurant selections yet. Exhibitors choose from restaurants you add above." />
            ) : (
              <SimpleTable
                headers={["Restaurant", "Companies"]}
                rows={restaurantSelections.map((r) => [r.restaurant, r.companies.join(", ")])}
              />
            )}
          </Panel>
          <Panel title="Dietary requirements" icon={Leaf}>
            {dietaryRows.length === 0 ? (
              <EmptyMessage message="No dietary preferences recorded yet." />
            ) : (
              <SimpleTable
                headers={["Preference", "Count", "Members"]}
                rows={dietaryRows.map((d) => [d.preference, String(d.count), d.members])}
                badgeFirst
              />
            )}
          </Panel>
        </div>
      )}

      {tab === "schedule" && (
        <div className="space-y-4">
          <EventScheduleManager
            eventId={eventId}
            scheduleItems={scheduleItems}
            eventStartDate={startDate}
            eventEndDate={endDate}
          />
        </div>
      )}

      {tab === "itinerary" && (
        <ItineraryPanel
          eventId={eventId}
          eventStartDate={startDate}
          eventEndDate={endDate}
          itineraries={tourTravelItineraries}
          scheduleItems={scheduleItems}
          exhibitors={exhibitors}
          activities={activities}
        />
      )}

      {tab === "checkins" && (
        <EventCheckInsPanel
          eventId={eventId}
          eventTitle={eventTitle}
          eventLocation={eventLocation}
          startDate={startDate}
          endDate={endDate}
          publishedEvents={publishedEvents}
          checkInKind={checkInKind}
          visitorStats={
            visitorCheckIns ?? {
              totalRegistrations: 0,
              checkedIn: 0,
              pending: 0,
              records: [],
            }
          }
          exhibitorStats={
            exhibitorCheckIns ?? {
              totalRegistrations: 0,
              checkedIn: 0,
              pending: 0,
              records: [],
            }
          }
        />
      )}

      {tab === "onsite" && (
        <OnsiteKioskPanel
          eventId={eventId}
          eventTitle={eventTitle}
          eventLocation={eventLocation}
          startDate={startDate}
          endDate={endDate}
          kiosk={
            onsiteKiosk ?? {
              enabled: false,
              hasPassword: false,
              slug: "",
            }
          }
        />
      )}
      </div>
    </div>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">{message}</p>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function BreakdownTable({
  rows,
  bufMul,
}: {
  rows: { label: string; icon: React.ComponentType<{ className?: string }>; color: string; perDay: number | null; total: number }[];
  bufMul: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-4 gap-0 border-b border-border bg-muted/50 text-[11px] font-medium text-muted-foreground">
        {["Item", "Per day", "With buffer", "Total (all days)"].map((h) => (
          <div key={h} className="px-3 py-2">{h}</div>
        ))}
      </div>
      {rows.map((row) => {
        const Icon = row.icon;
        const withBufPerDay = row.perDay ? Math.round(row.perDay * bufMul) : "—";
        const withBufTotal = Math.round(row.total * bufMul);
        return (
          <div key={row.label} className="grid grid-cols-4 border-b border-border text-xs last:border-0">
            <div className="flex items-center gap-1.5 px-3 py-2.5">
              <Icon className={cn("h-3.5 w-3.5", row.color)} />
              {row.label}
            </div>
            <div className="px-3 py-2.5">{row.perDay ? row.perDay.toLocaleString() : "—"}</div>
            <div className="px-3 py-2.5 font-medium">{row.perDay ? withBufPerDay.toLocaleString() : "—"}</div>
            <div className="px-3 py-2.5 font-medium text-primary">{withBufTotal.toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}

function SimpleTable({
  headers,
  rows,
  badgeFirst,
}: {
  headers: string[];
  rows: string[][];
  badgeFirst?: boolean;
}) {
  const badgeColors: Record<string, string> = {
    Vegetarian: "bg-emerald-100 text-emerald-800",
    Halal: "bg-amber-100 text-amber-800",
    "Gluten-free": "bg-orange-100 text-orange-800",
    "No restriction": "bg-champagne/15 text-espresso",
    "Not specified": "bg-muted text-muted-foreground",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-medium text-muted-foreground">
            {headers.map((h) => (
              <th key={h} className="pb-2 pr-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/40">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 pr-2 text-xs">
                  {badgeFirst && j === 0 && badgeColors[cell] ? (
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", badgeColors[cell])}>
                      {cell}
                    </span>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
