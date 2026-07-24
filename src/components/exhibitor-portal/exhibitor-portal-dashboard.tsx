"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CustomSelect,
  fromAllValue,
  toAllValue,
  toSelectOptions,
  toSelectOptionsWithAll,
} from "@/components/exhibitor-portal/custom-select";
import {
  defaultTravelForm,
  defaultVisaDocs,
  visaDocNamesFromFiles,
  type TravelLogisticsForm,
  type VisaDocuments,
} from "@/components/exhibitor-portal/registration-travel-step";
import {
  MEMBER_ROLES,
  ROLE_BADGE,
  TRANSPORT_OPTIONS,
  type ExhibitorTab,
  type TeamMember,
} from "@/components/exhibitor-portal/types";
import {
  AccommodationSection,
  AirportLogisticsSection,
  ExpoTransportSection,
  FoodOutingsSection,
  ToursSection,
} from "@/components/exhibitor-portal/member-logistics-sections";
import {
  computeSectionProgress,
  overallRegistrationPct,
  type SectionKey,
} from "@/lib/exhibitor-section-progress";
import type { EventActivityOption } from "@/lib/event-activity-types";
import type {
  EventHotelOption,
  EventItemMasterOption,
  EventRestaurantOption,
  EventScheduleItemOption,
} from "@/lib/event-config-types";
import { formatHotelOptionLabel } from "@/lib/event-config-types";
import ExhibitorFloorPlanPanel from "@/components/exhibitor-portal/exhibitor-floor-plan-panel";
import { AdditionalRequirementsPanel } from "@/components/exhibitor-portal/additional-requirements-panel";
import { BrandingsPanel } from "@/components/exhibitor-portal/brandings-panel";
import ExhibitorItineraryPanel from "@/components/exhibitor-portal/exhibitor-itinerary-panel";
import { getBoothCatalogItems, getBrandingCatalogItems } from "@/lib/item-master-catalog";
import { groupScheduleByDay } from "@/lib/event-master-aggregations";
import {
  activityToTourOption,
  buildDepartureOptions,
  buildMealOptions,
  buildSetupDateOptions,
} from "@/lib/exhibitor-form-options";
import {
  ChecklistItem,
  ContinueButton,
  EmptyState,
  GlanceRow,
  MetricCard,
  ModalShell,
  Panel,
  PortalHero,
  type PortalHeroStatus,
  PortalNav,
  type PortalNavGroup,
  type PortalNavItem,
} from "@/components/exhibitor-portal/exhibitor-portal-ui";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { formatExhibitorBoothLabel } from "@/lib/booth-allocation";
import type {
  EventFloorPlanConfig,
  ExhibitorBoothPhase,
  FloorPlanBoothRecord,
} from "@/lib/floor-plan-types";
import { cn, formatDate } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Bus,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Coffee,
  Droplets,
  FileText,
  FileUp,
  ForkKnife,
  IdCard,
  Info,
  LayoutDashboard,
  Leaf,
  Map,
  MapPin,
  Pencil,
  Plane,
  PackagePlus,
  Palette,
  Plus,
  Route,
  Salad,
  Send,
  ShieldCheck,
  ScanLine,
  Ticket,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  Upload,
} from "lucide-react";
import type { SavedRegistrationData } from "@/components/exhibitor-portal/registration-types";
import { redactTeamMemberForClient } from "@/lib/registration-pii";
import { MemberDocumentsUpload } from "@/components/exhibitor-portal/member-documents-upload";
import { ExhibitorMemberBadgesPanel } from "@/components/exhibitor-portal/exhibitor-member-badges-panel";
import { ExhibitorBoothCheckInsPanel } from "@/components/exhibitor-portal/exhibitor-booth-check-ins-panel";
import {
  saveExhibitorRegistration,
  addExhibitorMember,
  bulkUploadExhibitorMembers,
  registerExhibitorForEvent,
  getExhibitorMemberPassport,
  updateExhibitorMemberPassport,
} from "@/lib/exhibitor-actions";
import { createAirBookingRequest } from "@/lib/air-booking-actions";
import {
  memberIdsWithAirBookingRequest,
  type SerializedAirBookingRequest,
} from "@/lib/air-booking-types";
import {
  resolveExhibitorMemberFlightStatus,
  type SerializedAirBookingMemberWorkflow,
} from "@/lib/air-booking-workflow-types";
import { MemberNameWithTooltip } from "@/components/member-name-with-tooltip";
import type { SerializedMemberDocument } from "@/lib/member-document-types";
import type { SerializedBrandingArtworkSubmission } from "@/lib/branding-artwork-types";
import type { OpenExhibitorEvent } from "@/lib/exhibitor-events";
import type { RegisteredExhibitorEvent } from "@/lib/exhibitor-page-data";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardUrlState, useUrlEnumState } from "@/hooks/use-dashboard-url-state";
import type { SerializedTourTravelItinerary } from "@/lib/itinerary-types";
import { notify } from "@/lib/notify";
import {
  readExhibitorScanMode,
  writeExhibitorScanMode,
} from "@/lib/exhibitor-scan-mode";

export type ExhibitorPortalProps = {
  eventExhibitorId: string | null;
  savedRegistration: SavedRegistrationData | null;
  registrationStatus: "DRAFT" | "SUBMITTED" | null;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  description: string | null;
  eventTitle: string;
  eventVenue: string;
  eventCity: string;
  startDate: string;
  endDate: string;
  boothNumber: string | null;
  boothStandLabel?: string | null;
  boothPhase?: ExhibitorBoothPhase;
  boothReservedCode?: string | null;
  floorPlan?: EventFloorPlanConfig | null;
  floorPlanBooths?: FloorPlanBoothRecord[];
  paypalBoothCheckout?: {
    available: boolean;
    amount: number | null;
    currency: string | null;
    eventBoothId: string | null;
  };
  hall: string | null;
  expoDays: number;
  eventActivities: EventActivityOption[];
  eventHotels?: EventHotelOption[];
  eventRestaurants?: EventRestaurantOption[];
  eventSchedule?: EventScheduleItemOption[];
  itemCatalog?: EventItemMasterOption[];
  canManageMembers?: boolean;
  openEvents?: OpenExhibitorEvent[];
  registeredEvents?: RegisteredExhibitorEvent[];
  eventId?: string | null;
  eventSlug?: string | null;
  memberDocuments?: SerializedMemberDocument[];
  airBookingRequests?: SerializedAirBookingRequest[];
  memberWorkflows?: SerializedAirBookingMemberWorkflow[];
  brandingArtworkSubmissions?: SerializedBrandingArtworkSubmission[];
  tourTravelItineraries?: SerializedTourTravelItinerary[];
  notificationUnreadCount?: number;
  boothVisitorCount?: number;
  boothVisitors?: import("@/lib/exhibitor-booth-visits").ExhibitorBoothVisitRecord[];
};

const PRIMARY_TAB_IDS = [
  "overview",
  "booth-members",
  "booth-floor",
  "booth-additional",
  "booth-brandings",
  "airport",
  "accommodation",
  "expo",
  "tours",
  "food",
  "checkins",
] as const satisfies readonly ExhibitorTab[];

const EXHIBITOR_TAB_IDS = [
  ...PRIMARY_TAB_IDS,
  "registration",
  "booth",
  "additional",
  "brandings",
  "members",
  "schedules",
] as const satisfies readonly ExhibitorTab[];

const LEGACY_TAB_REDIRECT: Partial<Record<ExhibitorTab, ExhibitorTab>> = {
  registration: "overview",
  booth: "booth-floor",
  additional: "booth-additional",
  brandings: "booth-brandings",
  members: "booth-members",
  schedules: "tours",
};

const SECTION_TAB: Record<SectionKey, ExhibitorTab> = {
  booth: "booth-members",
  airport: "airport",
  accommodation: "accommodation",
  expo: "expo",
  tours: "tours",
};

function defaultForm(props: ExhibitorPortalProps) {
  const setupOptions = buildSetupDateOptions(props.startDate);
  return {
    company: props.companyName,
    industry: "",
    contact: props.contactName,
    title: "",
    email: props.contactEmail,
    phone: props.contactPhone || "",
    country: "",
    staff: "",
    desc: props.description || "",
    booth: "",
    setup: setupOptions[0] ?? "",
    av: "No",
    access: "",
    accommodationPickup: "No",
    depart: "No — own arrangements",
    vehicle: "",
    allergy: "",
    mealstyle: "",
    foodnotes: "",
  };
}

export default function ExhibitorPortalDashboard(props: ExhibitorPortalProps) {
  const saved = props.savedRegistration;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setParams } = useDashboardUrlState();
  const [tab, setTabRaw] = useUrlEnumState("tab", EXHIBITOR_TAB_IDS, "overview");

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (raw === "itinerary") {
      setParams({ tab: "tours" });
      return;
    }
    if (raw && LEGACY_TAB_REDIRECT[raw as ExhibitorTab]) {
      setParams({ tab: LEGACY_TAB_REDIRECT[raw as ExhibitorTab] });
    }
  }, [searchParams, setParams]);

  const setupOptions = useMemo(() => buildSetupDateOptions(props.startDate), [props.startDate]);
  const departureOptions = useMemo(() => buildDepartureOptions(props.endDate), [props.endDate]);
  const mealOptions = useMemo(() => buildMealOptions(props.startDate, props.endDate), [props.startDate, props.endDate]);
  const tourOptions = useMemo(
    () => props.eventActivities.filter((a) => a.kind === "TOUR").map(activityToTourOption),
    [props.eventActivities]
  );
  const travelActivities = useMemo(
    () => props.eventActivities.filter((a) => a.kind === "TRAVEL"),
    [props.eventActivities]
  );
  const hotelSelectOptions = useMemo(
    () =>
      (props.eventHotels ?? [])
        .filter((hotel) => hotel.isActive)
        .map((hotel) => formatHotelOptionLabel(hotel)),
    [props.eventHotels]
  );
  const scheduleByDay = useMemo(
    () => groupScheduleByDay(props.eventSchedule ?? []),
    [props.eventSchedule]
  );

  const [members, setMembers] = useState<TeamMember[]>(() => saved?.members ?? []);
  const [memberDocuments, setMemberDocuments] = useState<SerializedMemberDocument[]>(
    () => props.memberDocuments ?? []
  );
  const [airBookingRequests, setAirBookingRequests] = useState<SerializedAirBookingRequest[]>(
    () => props.airBookingRequests ?? []
  );
  const [memberWorkflows, setMemberWorkflows] = useState<SerializedAirBookingMemberWorkflow[]>(
    () => props.memberWorkflows ?? []
  );
  const [brandingSubmissions, setBrandingSubmissions] = useState<SerializedBrandingArtworkSubmission[]>(
    () => props.brandingArtworkSubmissions ?? []
  );
  const [memberFilter, setMemberFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [airBookingModalOpen, setAirBookingModalOpen] = useState(false);
  const [airBookingForm, setAirBookingForm] = useState({ travelDate: "", notes: "" });
  const [airBookingMemberIds, setAirBookingMemberIds] = useState<string[]>([]);
  const [documentsMember, setDocumentsMember] = useState<TeamMember | null>(null);
  const [documentsNoticeMember, setDocumentsNoticeMember] = useState<TeamMember | null>(null);
  const [documentsPassportDraft, setDocumentsPassportDraft] = useState("");
  const [savingPassport, setSavingPassport] = useState(false);
  const [submittingAirBooking, setSubmittingAirBooking] = useState(false);
  const [regStep] = useState(() => saved?.regStep ?? 1);

  const setTab = useCallback(
    (next: ExhibitorTab) => {
      setTabRaw(next, { step: null });
    },
    [setTabRaw]
  );

  const [scanMode, setScanModeState] = useState(false);

  const setScanMode = useCallback(
    (enabled: boolean) => {
      setScanModeState(enabled);
      writeExhibitorScanMode(enabled);
      if (enabled) {
        setTabRaw("checkins", { step: null });
      }
    },
    [setTabRaw]
  );

  useEffect(() => {
    if (readExhibitorScanMode()) {
      setScanModeState(true);
      setTabRaw("checkins", { step: null });
    }
  }, [setTabRaw]);

  useEffect(() => {
    if (scanMode && tab !== "checkins") {
      setTabRaw("checkins", { step: null });
    }
  }, [scanMode, tab, setTabRaw]);

  const [formSteps, setFormSteps] = useState(
    () =>
      saved?.formSteps ?? {
        company: false,
        event: false,
        travel: false,
        transport: false,
        food: false,
        boothAdditional: false,
        boothBrandings: false,
      }
  );
  const [travel, setTravel] = useState<TravelLogisticsForm>(() => saved?.travel ?? defaultTravelForm);
  const [visaDocs, setVisaDocs] = useState<VisaDocuments>(defaultVisaDocs);
  const [selectedTours, setSelectedTours] = useState<Set<string>>(() => new Set(saved?.selectedTours ?? []));
  const [selectedMeals, setSelectedMeals] = useState<Set<string>>(() => new Set(saved?.selectedMeals ?? []));
  const [selectedFoodExp, setSelectedFoodExp] = useState<Set<string>>(() => new Set(saved?.selectedFoodExp ?? []));
  const [shuttles, setShuttles] = useState<Set<string>>(() => new Set(saved?.shuttles ?? []));
  const itemCatalog = useMemo(() => props.itemCatalog ?? [], [props.itemCatalog]);
  const boothCatalog = useMemo(() => getBoothCatalogItems(itemCatalog), [itemCatalog]);
  const brandingCatalog = useMemo(() => getBrandingCatalogItems(itemCatalog), [itemCatalog]);
  const [selectedBoothItemId, setSelectedBoothItemId] = useState<string | null>(
    () => saved?.selectedBoothItemId ?? null
  );
  const [selectedAdditionalItemIds, setSelectedAdditionalItemIds] = useState<Set<string>>(
    () => new Set(saved?.selectedAdditionalItemIds ?? saved?.selectedEquipmentIds ?? [])
  );
  const selectedBrandingItemIds = useMemo(
    () => [...selectedAdditionalItemIds].filter((id) => brandingCatalog.some((item) => item.id === id)),
    [selectedAdditionalItemIds, brandingCatalog]
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<"DRAFT" | "SUBMITTED" | null>(
    () => props.registrationStatus
  );

  const [form, setForm] = useState(() => saved?.form ?? defaultForm(props));

  const [memberForm, setMemberForm] = useState({
    fn: "",
    ln: "",
    role: "Lead exhibitor",
    email: "",
    phone: "",
    passportNumber: "",
    transport: "",
    hotel: "",
    diet: "",
    tours: "",
    notes: "",
  });
  const [addingMember, setAddingMember] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{
    summary: { total: number; added: number; skipped: number; failed: number };
    skipped: { email: string; reason: string }[];
    failed: { email: string; reason: string }[];
  } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [linkingEvent, setLinkingEvent] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const filteredMembers = useMemo(
    () => (memberFilter ? members.filter((m) => m.role === memberFilter) : members),
    [members, memberFilter]
  );

  const membersAlreadyRequested = useMemo(
    () => memberIdsWithAirBookingRequest(airBookingRequests),
    [airBookingRequests]
  );

  const membersAvailableForAirBooking = useMemo(
    () => members.filter((m) => !membersAlreadyRequested.has(m.id)),
    [members, membersAlreadyRequested]
  );

  const sectionProgress = useMemo(
    () =>
      computeSectionProgress({
        members,
        selectedAdditionalItemIds: [...selectedAdditionalItemIds],
        brandingCount: props.brandingArtworkSubmissions?.length ?? selectedBrandingItemIds.length,
        additionalReviewed: formSteps.boothAdditional,
        brandingsReviewed: formSteps.boothBrandings,
      }),
    [
      members,
      selectedAdditionalItemIds,
      props.brandingArtworkSubmissions?.length,
      selectedBrandingItemIds.length,
      formSteps.boothAdditional,
      formSteps.boothBrandings,
    ]
  );

  const progressPct = useMemo(() => overallRegistrationPct(sectionProgress), [sectionProgress]);

  const sectionPct = useMemo(() => {
    const map = Object.fromEntries(sectionProgress.map((s) => [s.key, s.pct])) as Record<
      SectionKey,
      number
    >;
    return map;
  }, [sectionProgress]);

  const navGroups = useMemo((): (PortalNavItem<ExhibitorTab> | PortalNavGroup<ExhibitorTab>)[] => {
    return [
      { id: "overview", label: "Overview", icon: LayoutDashboard, pct: progressPct },
      {
        id: "your-booth",
        label: "Your Booth",
        icon: Building2,
        pct: sectionPct.booth ?? 0,
        items: [
          { id: "booth-members", label: "Team members", icon: Users },
          { id: "booth-floor", label: "Floor plan & booth", icon: Map },
          { id: "booth-additional", label: "Additional requirements", icon: PackagePlus },
          { id: "booth-brandings", label: "Brandings", icon: Palette },
        ],
      },
      {
        id: "airport",
        label: "Airport pick up & drop off",
        icon: Plane,
        pct: sectionPct.airport ?? 0,
      },
      {
        id: "accommodation",
        label: "Accommodation",
        icon: Building2,
        pct: sectionPct.accommodation ?? 0,
      },
      {
        id: "expo",
        label: "Expo pick up & drop off",
        icon: Bus,
        pct: sectionPct.expo ?? 0,
      },
      {
        id: "tours",
        label: "Tours",
        icon: MapPin,
        pct: sectionPct.tours ?? 0,
      },
      {
        id: "food",
        label: "Food outings",
        icon: ForkKnife,
        pct: formSteps.food ? 100 : selectedFoodExp.size > 0 ? 50 : 0,
      },
      { id: "checkins", label: "Check-ins", icon: IdCard },
    ];
  }, [progressPct, sectionPct, formSteps.food, selectedFoodExp.size]);

  const dateRange = `${formatDate(props.startDate, "MMM d")}–${formatDate(props.endDate, "d, yyyy")}`;

  const updateMemberFields = useCallback((memberId: string, patch: Partial<TeamMember>) => {
    setMembers((current) => current.map((m) => (m.id === memberId ? { ...m, ...patch } : m)));
  }, []);

  useEffect(() => {
    if (selectedBoothItemId || !saved?.form.booth || boothCatalog.length === 0) return;
    const match = boothCatalog.find((item) => item.name === saved.form.booth);
    if (match) setSelectedBoothItemId(match.id);
  }, [boothCatalog, saved?.form.booth, selectedBoothItemId]);

  const buildPayload = useCallback(
    (overrides: Partial<SavedRegistrationData> = {}): SavedRegistrationData => ({
      form: overrides.form ?? form,
      travel: overrides.travel ?? travel,
      visaDocNames: overrides.visaDocNames ?? visaDocNamesFromFiles(visaDocs),
      members: overrides.members ?? members,
      selectedTours: overrides.selectedTours ?? [...selectedTours],
      selectedMeals: overrides.selectedMeals ?? [...selectedMeals],
      selectedFoodExp: overrides.selectedFoodExp ?? [...selectedFoodExp],
      shuttles: overrides.shuttles ?? [...shuttles],
      selectedBoothItemId: overrides.selectedBoothItemId ?? selectedBoothItemId,
      selectedAdditionalItemIds:
        overrides.selectedAdditionalItemIds ?? [...selectedAdditionalItemIds],
      formSteps: overrides.formSteps ?? formSteps,
      regStep: overrides.regStep ?? regStep,
    }),
    [
      form,
      travel,
      visaDocs,
      members,
      selectedTours,
      selectedMeals,
      selectedFoodExp,
      shuttles,
      selectedBoothItemId,
      selectedAdditionalItemIds,
      formSteps,
      regStep,
    ]
  );

  const isSubmitted = registrationStatus === "SUBMITTED";
  const saveChainRef = useRef(Promise.resolve());
  const skipAutosaveRef = useRef(true);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const hasRegistrationProgress = useMemo(
    () =>
      regStep > 1 ||
      formSteps.company ||
      formSteps.event ||
      formSteps.travel ||
      formSteps.transport ||
      formSteps.food ||
      members.length > 0 ||
      airBookingRequests.length > 0 ||
      selectedTours.size > 0 ||
      selectedMeals.size > 0 ||
      shuttles.size > 0,
    [regStep, formSteps, members.length, airBookingRequests.length, selectedTours.size, selectedMeals.size, shuttles.size]
  );

  const persistRegistration = useCallback(
    async (overrides: Partial<SavedRegistrationData> = {}, status: "DRAFT" | "SUBMITTED" = "DRAFT") => {
      if (!props.eventExhibitorId) {
        notify.error("No event linked");
        return { error: "No event exhibitor record" };
      }
      const saveStatus = isSubmitted && status !== "SUBMITTED" ? "SUBMITTED" : status;

      const runSave = async () => {
        setSaving(true);
        try {
          const result = await saveExhibitorRegistration(
            props.eventExhibitorId!,
            buildPayload(overrides),
            saveStatus
          );
          if (result.error) {
            notify.error(result.error);
          } else if (result.success) {
            setLastSavedAt(new Date());
            if (saveStatus === "SUBMITTED") {
              setRegistrationStatus("SUBMITTED");
              router.refresh();
            }
          }
          return result;
        } finally {
          setSaving(false);
        }
      };

      const chained = saveChainRef.current.then(runSave, runSave);
      saveChainRef.current = chained.then(
        () => undefined,
        () => undefined
      );
      return chained;
    },
    [props.eventExhibitorId, buildPayload, isSubmitted, router]
  );

  const handleBoothItemChange = (itemId: string) => {
    const item = boothCatalog.find((entry) => entry.id === itemId);
    const nextId = itemId || null;
    setSelectedBoothItemId(nextId);
    const nextForm = { ...form, booth: item?.name ?? "" };
    setForm(nextForm);
    if (!isSubmitted) {
      void persistRegistration({
        selectedBoothItemId: nextId,
        form: nextForm,
      });
    }
  };

  const handleAdditionalItemToggle = (itemId: string) => {
    const next = new Set(selectedAdditionalItemIds);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setSelectedAdditionalItemIds(next);
    if (!isSubmitted) {
      void persistRegistration({
        selectedAdditionalItemIds: [...next],
      });
    }
  };

  const handleAdditionalInvoiceDownload = useCallback(async () => {
    const brandingIds = [...selectedAdditionalItemIds].filter((id) =>
      brandingCatalog.some((item) => item.id === id)
    );
    setSelectedAdditionalItemIds(new Set(brandingIds));
    if (!isSubmitted) {
      await persistRegistration({ selectedAdditionalItemIds: brandingIds });
    }
  }, [isSubmitted, persistRegistration, selectedAdditionalItemIds, brandingCatalog]);

  const handleRemoveBrandingItem = useCallback(
    async (itemMasterId: string) => {
      const next = new Set(selectedAdditionalItemIds);
      next.delete(itemMasterId);
      const nextIds = [...next];
      skipAutosaveRef.current = true;
      setSelectedAdditionalItemIds(next);
      await persistRegistration({ selectedAdditionalItemIds: nextIds });
    },
    [selectedAdditionalItemIds, persistRegistration]
  );

  useEffect(() => {
    setAirBookingRequests(props.airBookingRequests ?? []);
  }, [props.airBookingRequests]);

  useEffect(() => {
    setMemberWorkflows(props.memberWorkflows ?? []);
  }, [props.memberWorkflows]);

  useEffect(() => {
    setBrandingSubmissions(props.brandingArtworkSubmissions ?? []);
  }, [props.brandingArtworkSubmissions]);

  // Keep rejected branding items in additional-requirements selection so they stay on Brandings tab.
  useEffect(() => {
    const rejectedIds = (props.brandingArtworkSubmissions ?? [])
      .filter((s) => s.status === "NOT_VERIFIED")
      .map((s) => s.itemMasterId)
      .filter((id) => brandingCatalog.some((item) => item.id === id));

    if (rejectedIds.length === 0) return;

    setSelectedAdditionalItemIds((prev) => {
      const missing = rejectedIds.filter((id) => !prev.has(id));
      if (missing.length === 0) return prev;

      const next = new Set(prev);
      for (const id of missing) next.add(id);
      skipAutosaveRef.current = true;
      void persistRegistration({ selectedAdditionalItemIds: [...next] });
      return next;
    });
  }, [props.brandingArtworkSubmissions, brandingCatalog, persistRegistration]);

  useEffect(() => {
    setMemberDocuments(props.memberDocuments ?? []);
  }, [props.memberDocuments]);

  useEffect(() => {
    if (!props.eventExhibitorId || isSubmitted || !hasRegistrationProgress) return;
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      void persistRegistration();
    }, 2000);

    return () => clearTimeout(timer);
  }, [
    form,
    travel,
    members,
    selectedTours,
    selectedMeals,
    selectedFoodExp,
    shuttles,
    selectedBoothItemId,
    selectedAdditionalItemIds,
    formSteps,
    regStep,
    props.eventExhibitorId,
    isSubmitted,
    hasRegistrationProgress,
    persistRegistration,
  ]);

  const submitRegistration = async () => {
    if (isSubmitted) {
      notify.info("Already submitted");
      return;
    }
    if (members.length === 0) {
      notify.error("Add at least one team member");
      setTab("booth-members");
      return;
    }
    setSubmitting(true);
    const finalSteps = {
      ...formSteps,
      company: true,
      event: true,
      travel: true,
      transport: true,
      food: true,
      boothAdditional: true,
      boothBrandings: true,
    };
    setFormSteps(finalSteps);
    const result = await persistRegistration({ formSteps: finalSteps, regStep }, "SUBMITTED");
    setSubmitting(false);
    if (result.error) notify.error(result.error);
    else {
      setRegistrationStatus("SUBMITTED");
      notify.success("Registration submitted");
      setTab("overview");
    }
  };

  const memberHasPassportNumber = (member: TeamMember) =>
    Boolean(member.hasPassportNumber ?? member.passportNumber?.trim());

  const openAddMemberModal = () => {
    setEditingMemberId(null);
    setMemberForm({
      fn: "",
      ln: "",
      role: "Lead exhibitor",
      email: "",
      phone: "",
      passportNumber: "",
      transport: "",
      hotel: "",
      diet: "",
      tours: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const openEditMemberModal = async (member: TeamMember) => {
    setEditingMemberId(member.id);
    let passportNumber = member.passportNumber ?? "";
    if (!passportNumber && props.canManageMembers && props.eventExhibitorId) {
      const result = await getExhibitorMemberPassport(props.eventExhibitorId, member.id);
      if (result.success) passportNumber = result.passportNumber ?? "";
    }
    setMemberForm({
      fn: member.fn,
      ln: member.ln,
      role: member.role,
      email: member.email,
      phone: member.phone,
      passportNumber,
      transport: member.transport,
      hotel: member.hotel,
      diet: member.diet,
      tours: member.tours,
      notes: member.notes,
    });
    setModalOpen(true);
  };

  const addMember = async () => {
    if (!memberForm.fn.trim() || !memberForm.ln.trim()) {
      notify.error("Name required");
      return;
    }
    if (!memberForm.email.trim()) {
      notify.error("Email required");
      return;
    }
    if (!memberForm.phone.trim() || memberForm.phone.trim().length < 8) {
      notify.error("Valid phone required");
      return;
    }

    if (props.canManageMembers && !editingMemberId) {
      setAddingMember(true);
      try {
        const fd = new FormData();
        fd.set("name", `${memberForm.fn.trim()} ${memberForm.ln.trim()}`);
        fd.set("email", memberForm.email.trim());
        fd.set("phone", memberForm.phone.trim());
        fd.set("memberRole", "STAFF");

        const result = await addExhibitorMember(fd);
        if (result.error) {
          notify.error(result.error);
          return;
        }
      } finally {
        setAddingMember(false);
      }
    }

    if (editingMemberId) {
      const passportValue = memberForm.passportNumber.trim();
      const nextMembers = members.map((m) =>
        m.id === editingMemberId
          ? {
              ...m,
              fn: memberForm.fn.trim(),
              ln: memberForm.ln.trim(),
              role: memberForm.role,
              email: memberForm.email.trim(),
              phone: memberForm.phone.trim(),
              passportNumber: passportValue,
              transport: memberForm.transport,
              hotel: memberForm.hotel,
              diet: memberForm.diet.trim(),
              tours: memberForm.tours,
              notes: memberForm.notes,
            }
          : m
      );
      setMembers(nextMembers.map(redactTeamMemberForClient));
      setEditingMemberId(null);
      setMemberForm({
        fn: "",
        ln: "",
        role: "Lead exhibitor",
        email: "",
        phone: "",
        passportNumber: "",
        transport: "",
        hotel: "",
        diet: "",
        tours: "",
        notes: "",
      });
      setModalOpen(false);
      await persistRegistration({ members: nextMembers });
      notify.success("Member updated");
      return;
    }

    const nextMembers = [
      ...members,
      {
        id: crypto.randomUUID(),
        ...memberForm,
        fn: memberForm.fn.trim(),
        ln: memberForm.ln.trim(),
        phone: memberForm.phone.trim(),
        passportNumber: memberForm.passportNumber.trim(),
        diet: memberForm.diet.trim(),
        portalAccess: props.canManageMembers,
      },
    ];
    setMembers(nextMembers.map(redactTeamMemberForClient));
    setMemberForm({
      fn: "",
      ln: "",
      role: "Lead exhibitor",
      email: "",
      phone: "",
      passportNumber: "",
      transport: "",
      hotel: "",
      diet: "",
      tours: "",
      notes: "",
    });
    setModalOpen(false);
    await persistRegistration({ members: nextMembers });
    notify.success(props.canManageMembers ? "Member added — invite sent" : "Member added");
  };

  const handleBulkUpload = async (file: File) => {
    if (!props.canManageMembers) return;
    setBulkUploading(true);
    setBulkResults(null);
    try {
      const csv = await file.text();
      const fd = new FormData();
      fd.set("csv", csv);
      const result = await bulkUploadExhibitorMembers(fd);
      if (result.error) {
        notify.error(result.error);
        return;
      }
      if (result.summary && result.added) {
        setBulkResults({
          summary: result.summary,
          skipped: result.skipped ?? [],
          failed: result.failed ?? [],
        });

        const existingEmails = new Set(members.map((m) => m.email.toLowerCase()));
        const newMembers: TeamMember[] = result.added
          .filter((a) => !existingEmails.has(a.email.toLowerCase()))
          .map((a) => {
            const parts = a.name.split(/\s+/);
            const fn = parts[0] ?? "";
            const ln = parts.slice(1).join(" ") || fn;
            return {
              id: crypto.randomUUID(),
              fn,
              ln,
              role: "Support",
              email: a.email,
              phone: a.phone,
              transport: "",
              hotel: "",
              diet: "",
              tours: "",
              notes: "",
              portalAccess: true,
            };
          });

        if (newMembers.length > 0) {
          const nextMembers = [...members, ...newMembers];
          setMembers(nextMembers);
          await persistRegistration({ members: nextMembers });
        }

        notify.success(
          `Upload complete: ${result.summary.added} added`
        );
        router.refresh();
      }
    } finally {
      setBulkUploading(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  const downloadSampleCsv = () => {
    const sample = "name,email,phone\nJane Doe,jane@example.com,+254712345678\nJohn Smith,john@example.com,+254798765432";
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exhibitor-members-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const linkToEvent = async () => {
    if (!selectedEventId) {
      notify.error("Select an event");
      return;
    }
    setLinkingEvent(true);
    try {
      const result = await registerExhibitorForEvent(selectedEventId);
      if (result.error) {
        notify.error(result.error);
        return;
      }
      if (result.alreadyLinked) {
        notify.success(`Switched to ${result.eventTitle ?? "event"}`);
      } else {
        notify.success(`Registered for ${result.eventTitle ?? "event"}`);
      }
      setSelectedEventId("");
      const params = new URLSearchParams(window.location.search);
      if (result.eventSlug) params.set("event", result.eventSlug);
      params.delete("tab");
      params.delete("step");
      const qs = params.toString();
      router.push(qs ? `/exhibitor?${qs}` : "/exhibitor");
      router.refresh();
    } finally {
      setLinkingEvent(false);
    }
  };

  const switchToRegisteredEvent = (slug: string) => {
    if (!slug || slug === props.eventSlug) return;
    const params = new URLSearchParams(window.location.search);
    params.set("event", slug);
    const qs = params.toString();
    router.push(qs ? `/exhibitor?${qs}` : "/exhibitor");
  };

  const registeredEvents = props.registeredEvents ?? [];
  const registeredEventIds = useMemo(
    () => new Set(registeredEvents.map((e) => e.eventId)),
    [registeredEvents]
  );
  const availableEvents = useMemo(
    () => (props.openEvents ?? []).filter((event) => !registeredEventIds.has(event.id)),
    [props.openEvents, registeredEventIds]
  );

  const removeMember = async (id: string) => {
    const nextMembers = members.filter((m) => m.id !== id);
    setMembers(nextMembers);
    await persistRegistration({ members: nextMembers });
  };

  const submitAirBooking = async () => {
    if (!props.eventExhibitorId) {
      notify.error("Link an event first");
      return;
    }
    if (airBookingMemberIds.length === 0) {
      notify.error("Select team members");
      return;
    }
    if (!airBookingForm.travelDate) {
      notify.error("Travel date required");
      return;
    }

    setSubmittingAirBooking(true);
    try {
      const result = await createAirBookingRequest({
        eventExhibitorId: props.eventExhibitorId,
        travelDate: airBookingForm.travelDate,
        notes: airBookingForm.notes.trim() || undefined,
        memberLocalIds: airBookingMemberIds,
      });
      if (result.error) {
        notify.error(result.error);
        return;
      }
      if (result.request) {
        setAirBookingRequests((current) => [result.request!, ...current]);
      }

      setAirBookingModalOpen(false);
      setAirBookingForm({ travelDate: "", notes: "" });
      setAirBookingMemberIds([]);
      notify.success("Flight booking request sent");
      router.refresh();
    } finally {
      setSubmittingAirBooking(false);
    }
  };

  const openAirBookingModal = () => {
    if (membersAvailableForAirBooking.length === 0) {
      if (members.length === 0) {
        notify.error("Add team members first");
      } else {
        notify.info("All team members already have a flight booking request");
      }
      return;
    }
    setAirBookingMemberIds(membersAvailableForAirBooking.map((m) => m.id));
    setAirBookingModalOpen(true);
  };

  const memberHasPassportDoc = (memberId: string) =>
    memberDocuments.some((d) => d.memberLocalId === memberId && d.documentType === "PASSPORT");

  const memberDocCount = (memberId: string) =>
    memberDocuments.filter((d) => d.memberLocalId === memberId).length;

  const openDocumentsModal = async (member: TeamMember) => {
    let passportNumber = member.passportNumber?.trim() ?? "";
    if (!passportNumber && props.canManageMembers && props.eventExhibitorId) {
      const result = await getExhibitorMemberPassport(props.eventExhibitorId, member.id);
      if (result.success) passportNumber = result.passportNumber ?? "";
    }
    setDocumentsMember({ ...member, passportNumber });
    setDocumentsPassportDraft(passportNumber);
  };

  const requestDocumentsModal = (member: TeamMember) => {
    if (memberDocCount(member.id) > 0) {
      void openDocumentsModal(member);
      return;
    }
    setDocumentsNoticeMember(member);
  };

  const acknowledgeDocumentsNotice = async () => {
    const member = documentsNoticeMember;
    setDocumentsNoticeMember(null);
    if (member) await openDocumentsModal(member);
  };

  const saveMemberPassport = async (options?: { silent?: boolean }) => {
    if (!documentsMember || !props.eventExhibitorId) {
      notify.error("No event linked");
      return false;
    }
    const passportNumber = documentsPassportDraft.trim();
    if (!passportNumber) {
      notify.error("Passport number required");
      return false;
    }

    setSavingPassport(true);
    try {
      const result = await updateExhibitorMemberPassport(
        props.eventExhibitorId,
        documentsMember.id,
        passportNumber
      );
      if (result.error) {
        notify.error(result.error);
        return false;
      }

      const savedPassport = result.passportNumber ?? passportNumber;
      const nextMembers = members.map((m) =>
        m.id === documentsMember.id
          ? { ...m, hasPassportNumber: Boolean(savedPassport) }
          : m
      );
      setMembers(nextMembers);
      setDocumentsMember((current) =>
        current ? { ...current, passportNumber: savedPassport } : current
      );
      if (!options?.silent) {
        notify.success("Passport saved");
      }
      return true;
    } finally {
      setSavingPassport(false);
    }
  };

  const closeDocumentsModal = async () => {
    if (!documentsMember) return;
    const draft = documentsPassportDraft.trim();
    const saved = documentsMember.passportNumber?.trim() ?? "";
    if (draft && draft !== saved) {
      await saveMemberPassport({ silent: true });
    }
    setDocumentsMember(null);
  };

  const handleDocumentUploaded = (document: SerializedMemberDocument) => {
    setMemberDocuments((current) => {
      const without = current.filter(
        (d) =>
          !(
            d.memberLocalId === document.memberLocalId &&
            d.documentType === document.documentType
          )
      );
      return [...without, document];
    });
  };

  const toggleSet = (set: Set<string>, key: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  const n = members.length;
  const tourCount = members.reduce(
    (sum, m) => sum + (m.tourLogistics?.selectedTourIds.length ?? 0),
    0
  );

  const checklist = sectionProgress.map((section) => ({
    key: section.key,
    label: section.label,
    done: section.complete,
    pct: section.pct,
  }));

  const dietMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    members.forEach((m) => {
      if (!m.diet) return;
      if (!map[m.diet]) map[m.diet] = [];
      map[m.diet].push(m.fn);
    });
    return map;
  }, [members]);

  const boothPhase = props.boothPhase ?? "none";
  const boothLabel = formatExhibitorBoothLabel(props.boothNumber, props.hall);
  const boothSubline = (() => {
    if (boothPhase === "allocated" && props.boothNumber) {
      return props.boothStandLabel
        ? `Booth allocated · ${props.boothStandLabel}`
        : "Booth allocated by admin";
    }
    if (boothPhase === "payment_verified" && props.boothReservedCode) {
      return `Booth ${props.boothReservedCode} · payment verified — allocation pending`;
    }
    if (boothPhase === "reserved" && props.boothReservedCode) {
      return `Booth ${props.boothReservedCode} reserved — complete payment for allocation`;
    }
    if (props.boothNumber) {
      return props.boothStandLabel
        ? `Allocated by admin · ${props.boothStandLabel}`
        : "Allocated by admin";
    }
    return form.booth || "Select a booth on the floor plan";
  })();
  const boothGlanceTitle = (() => {
    if (boothPhase === "allocated" && props.boothNumber) return boothLabel;
    if (boothPhase === "payment_verified" && props.boothReservedCode) {
      return `Booth ${props.boothReservedCode} · payment verified`;
    }
    if (boothPhase === "reserved" && props.boothReservedCode) {
      return `Booth ${props.boothReservedCode} reserved`;
    }
    return props.boothNumber ? boothLabel : "Booth selection pending";
  })();

  const heroStatus: PortalHeroStatus = !props.eventExhibitorId
    ? "not_linked"
    : isSubmitted
      ? "submitted"
      : "draft";

  const heroAction = useMemo(() => {
    if (!props.eventExhibitorId) {
      return {
        label: "Register for event",
        onAction: () => setTab("overview"),
      };
    }

    if (isSubmitted) {
      return {
        label: "View registration progress",
        onAction: () => setTab("overview"),
      };
    }

    const next = sectionProgress.find((s) => !s.complete);
    if (next) {
      return {
        label: `Continue: ${next.label}`,
        onAction: () => setTab(SECTION_TAB[next.key]),
      };
    }

    return {
      label: "Registration complete",
      onAction: () => setTab("overview"),
    };
  }, [props.eventExhibitorId, isSubmitted, sectionProgress, setTab]);

  return (
    <div className="space-y-5">
      {scanMode ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ScanLine className="h-4 w-4 text-primary" />
                Scan mode
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {props.companyName}
                {boothLabel ? ` · ${boothLabel}` : ""}
              </p>
            </div>
            <ExhibitorScanModeToggle enabled={scanMode} onChange={setScanMode} />
          </div>
          <ExhibitorBoothCheckInsPanel
            eventExhibitorId={props.eventExhibitorId}
            visitorCount={props.boothVisitorCount ?? 0}
            records={props.boothVisitors ?? []}
            companyName={props.companyName}
            boothLabel={
              boothPhase === "allocated" && props.boothNumber
                ? boothLabel
                : props.boothReservedCode
                  ? `Booth ${props.boothReservedCode}`
                  : props.boothStandLabel ??
                    (props.boothNumber ? `Booth ${props.boothNumber}` : null)
            }
          />
        </>
      ) : (
        <>
      <PortalHero
        eventTitle={props.eventTitle}
        eventCity={props.eventCity}
        dateRange={dateRange}
        companyName={props.companyName}
        boothLabel={boothGlanceTitle}
        eventVenue={props.eventVenue}
        startDate={props.startDate}
        endDate={props.endDate}
        status={heroStatus}
        actionLabel={heroAction.label}
        onAction={heroAction.onAction}
      />

      {tab === "overview" && (
        <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          <MetricCard
            label="Team members"
            value={n}
            icon={Users}
            accent="teal"
            hint={n === 0 ? "Add your first member" : "On your booth roster"}
          />
          <MetricCard
            label="Booth visitors"
            value={props.boothVisitorCount ?? 0}
            icon={IdCard}
            accent="sky"
            hint="Checked in at your stand"
          />
          <MetricCard
            label="Meal passes"
            value={n * props.expoDays * 3}
            icon={Ticket}
            accent="emerald"
            hint={`${props.expoDays}-day expo × 3 meals`}
          />
          <MetricCard
            label="Tours booked"
            value={tourCount}
            icon={MapPin}
            accent="violet"
            hint="Selected across the team"
          />
        </section>
      )}

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start lg:gap-6">
        <PortalNav
          groups={navGroups}
          active={tab}
          onChange={setTab}
          footer={
            props.eventExhibitorId ? (
              <ExhibitorScanModeToggle
                variant="sidebar"
                enabled={scanMode}
                onChange={setScanMode}
              />
            ) : undefined
          }
        />

        <main className="min-w-0 space-y-4">
      {tab === "overview" && (
        <div className="space-y-4">
          {!props.eventExhibitorId ? (
            <Panel title="Select your event" icon={Calendar}>
              <p className="mb-4 text-sm text-muted-foreground">
                Choose the expo or event you are exhibiting at to unlock registration, team members, and logistics.
              </p>
              {(props.openEvents?.length ?? 0) === 0 ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
                  No events are open for registration right now. Please contact the organizer.
                </p>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <Label className="mb-1 block text-xs text-muted-foreground">Event / expo</Label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                    >
                      <option value="">Select an event</option>
                      {(props.openEvents ?? []).map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title} · {formatDate(event.startDate, "MMM d")} – {formatDate(event.endDate, "MMM d, yyyy")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={linkToEvent} disabled={linkingEvent || !selectedEventId} className="sm:shrink-0">
                    {linkingEvent ? "Linking…" : "Register for event"}
                  </Button>
                </div>
              )}
            </Panel>
          ) : (
            <Panel title="Your events" icon={Calendar}>
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Current event
                  </p>
                  <p className="mt-1 text-sm font-semibold">{props.eventTitle}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(props.startDate, "MMM d")} – {formatDate(props.endDate, "MMM d, yyyy")}
                    {props.eventCity ? ` · ${props.eventCity}` : ""}
                  </p>
                </div>

                {registeredEvents.length > 1 && (
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">
                      Switch registered event
                    </Label>
                    <select
                      value={props.eventSlug ?? props.eventId ?? ""}
                      onChange={(e) => switchToRegisteredEvent(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                    >
                      {registeredEvents.map((event) => (
                        <option key={event.eventId} value={event.slug}>
                          {event.title} · {formatDate(event.startDate, "MMM d")} –{" "}
                          {formatDate(event.endDate, "MMM d, yyyy")}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {availableEvents.length > 0 ? (
                  <div className="border-t border-border pt-4">
                    <p className="mb-3 text-sm text-muted-foreground">
                      Already exhibited with us? Register your company for another open event.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <Label className="mb-1 block text-xs text-muted-foreground">
                          Register for another event
                        </Label>
                        <select
                          value={selectedEventId}
                          onChange={(e) => setSelectedEventId(e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                        >
                          <option value="">Select an event</option>
                          {availableEvents.map((event) => (
                            <option key={event.id} value={event.id}>
                              {event.title} · {formatDate(event.startDate, "MMM d")} –{" "}
                              {formatDate(event.endDate, "MMM d, yyyy")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        onClick={linkToEvent}
                        disabled={linkingEvent || !selectedEventId}
                        className="sm:shrink-0"
                      >
                        {linkingEvent ? "Registering…" : "Register for event"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No other open events are available to register for right now.
                  </p>
                )}
              </div>
            </Panel>
          )}
          <Panel title="Booth snapshot" icon={Building2}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Booth</p>
                <p className="mt-1 text-sm font-semibold leading-snug">{boothGlanceTitle}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{boothSubline}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Team</p>
                <p className="mt-1 text-sm font-semibold">
                  {n} member{n === 1 ? "" : "s"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {n === 0 ? "Add people under Your Booth" : "Documents & logistics per member"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Progress</p>
                <p className="mt-1 text-sm font-semibold text-primary">{progressPct}%</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-champagne to-champagne-dark"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Next up</p>
                {(() => {
                  const next = sectionProgress.find((s) => !s.complete);
                  if (!next) {
                    return (
                      <>
                        <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                          All sections done
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {isSubmitted ? "Submitted to Event Master" : "Ready to submit"}
                        </p>
                      </>
                    );
                  }
                  return (
                    <>
                      <p className="mt-1 text-sm font-semibold">{next.label}</p>
                      <button
                        type="button"
                        className="mt-1 text-xs font-medium text-primary hover:underline"
                        onClick={() => setTab(SECTION_TAB[next.key])}
                      >
                        Continue →
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Registration status" icon={ClipboardCheck}>
              <div className="mb-3 flex justify-between text-sm">
                <span className="text-muted-foreground">Overall completion</span>
                <span className="font-semibold text-primary">{progressPct}%</span>
              </div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-champagne to-champagne-dark transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                {saving
                  ? "Saving…"
                  : lastSavedAt
                    ? `Saved ${lastSavedAt.toLocaleTimeString()}`
                    : props.eventExhibitorId
                      ? "Changes auto-save for Event Master"
                      : "Not linked to an event — contact the organizer"}
              </p>
              <ul className="space-y-2">
                {checklist.map((item) => (
                  <ChecklistItem
                    key={item.key}
                    label={`${item.label} (${item.pct}%)`}
                    done={item.done}
                    onAction={() => setTab(SECTION_TAB[item.key as SectionKey])}
                  />
                ))}
              </ul>
              <ContinueButton
                onClick={() => {
                  const next = sectionProgress.find((s) => !s.complete);
                  setTab(next ? SECTION_TAB[next.key] : "overview");
                }}
              />
              {props.eventExhibitorId && !isSubmitted && progressPct >= 50 && (
                <Button
                  className="mt-3 w-full gap-1"
                  onClick={() => void submitRegistration()}
                  disabled={submitting || saving}
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting…" : "Submit registration"}
                </Button>
              )}
              {isSubmitted && (
                <p className="mt-3 text-center text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Registration submitted
                </p>
              )}
            </Panel>

            <Panel title="Event at a glance" icon={Calendar}>
              <GlanceRow icon={MapPin} title={props.eventVenue} sub={props.eventCity} />
              <GlanceRow icon={Calendar} title={dateRange} sub={`${props.expoDays} days · Setup from day before`} />
              <GlanceRow icon={Building2} title={boothGlanceTitle} sub={boothSubline} />
              {props.eventVenue && (
                <GlanceRow icon={Clock} title={`${props.expoDays}-day event`} sub={`${props.eventVenue}, ${props.eventCity}`} />
              )}
              <GlanceRow icon={AlertCircle} title={`Deadline: ${formatDate(props.startDate, "MMM d")}`} sub="Submit registration & payments" warn />
            </Panel>
          </div>

          {scheduleByDay.length > 0 && (
            <Panel title="Event schedule" icon={CalendarDays}>
              <EventScheduleGrid scheduleByDay={scheduleByDay} />
            </Panel>
          )}

          {props.canManageMembers && (
            <BulkUploadMembersPanel
              bulkUploading={bulkUploading}
              bulkResults={bulkResults}
              csvInputRef={csvInputRef}
              onUpload={handleBulkUpload}
              onDownloadSample={downloadSampleCsv}
            />
          )}

          <Panel
            title="Team overview"
            icon={Users}
            action={
              <div className="flex shrink-0 flex-nowrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1 whitespace-nowrap"
                  onClick={openAirBookingModal}
                >
                  <Plane className="h-4 w-4" /> Request air booking
                </Button>
                <Button size="sm" className="shrink-0 gap-1 whitespace-nowrap" onClick={openAddMemberModal}>
                  <Plus className="h-4 w-4" /> Add member
                </Button>
              </div>
            }
          >
            {members.length === 0 ? (
              <div className="space-y-3">
                <EmptyState
                  icon={UserPlus}
                  title="No team members yet"
                  description="Add your team to manage passes, transport and food."
                  compact
                  action={
                    <Button onClick={openAddMemberModal} className="gap-1">
                      <Plus className="h-4 w-4" /> Add member
                    </Button>
                  }
                />
                {airBookingRequests.length > 0 && <AirBookingRequestsList requests={airBookingRequests} />}
              </div>
            ) : (
              <MemberTable
                members={filteredMembers.slice(0, 5)}
                overview
                airBookingRequests={airBookingRequests}
                memberWorkflows={memberWorkflows}
              />
            )}
          </Panel>
        </div>
      )}

      {tab === "booth-floor" && (
        <Panel title="Floor plan & booth selection" icon={Map}>
          {!props.eventExhibitorId ? (
            <EmptyState
              icon={Map}
              title="Register for the event first"
              description="Complete event registration before selecting a booth on the floor plan."
            />
          ) : !props.floorPlan || (props.floorPlanBooths?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Map}
              title="Floor plan not available yet"
              description="The event floor plan is being prepared. Check back soon or contact admin."
            />
          ) : (
            <ExhibitorFloorPlanPanel
              eventExhibitorId={props.eventExhibitorId}
              initialBooths={props.floorPlanBooths ?? []}
              initialFloorPlan={props.floorPlan}
              initialPhase={boothPhase}
              initialOwnBoothCode={props.boothNumber ?? props.boothReservedCode ?? null}
              hall={props.hall}
              paypalBoothCheckout={props.paypalBoothCheckout}
            />
          )}
        </Panel>
      )}

      {tab === "booth-additional" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4">
            <p className="text-sm text-muted-foreground">
              Select any booth add-ons you need, then mark this booth section complete.
            </p>
            <Button
              size="sm"
              variant={formSteps.boothAdditional ? "outline" : "default"}
              onClick={() => {
                const next = { ...formSteps, boothAdditional: true };
                setFormSteps(next);
                void persistRegistration({ formSteps: next });
                notify.success("Additional requirements marked complete");
              }}
            >
              {formSteps.boothAdditional ? "Section complete" : "Mark section complete"}
            </Button>
          </div>
          <AdditionalRequirementsPanel
          catalog={itemCatalog}
          selectedItemIds={selectedAdditionalItemIds}
          onToggleItem={handleAdditionalItemToggle}
          companyName={form.company || props.companyName}
          eventTitle={props.eventTitle}
          contactName={form.contact}
          onInvoiceDownload={handleAdditionalInvoiceDownload}
        />
        </div>
      )}

      {tab === "booth-brandings" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4">
            <p className="text-sm text-muted-foreground">
              Upload branding artwork for selected items, then mark this section complete.
            </p>
            <Button
              size="sm"
              variant={formSteps.boothBrandings ? "outline" : "default"}
              onClick={() => {
                const next = { ...formSteps, boothBrandings: true };
                setFormSteps(next);
                void persistRegistration({ formSteps: next });
                notify.success("Brandings marked complete");
              }}
            >
              {formSteps.boothBrandings ? "Section complete" : "Mark section complete"}
            </Button>
          </div>
          <BrandingsPanel
          eventExhibitorId={props.eventExhibitorId}
          catalog={itemCatalog}
          selectedBrandingItemIds={selectedBrandingItemIds}
          submissions={brandingSubmissions}
          onSubmissionsChange={setBrandingSubmissions}
          onRemoveBrandingItem={handleRemoveBrandingItem}
        />
        </div>
      )}

      {/* Members */}
      {tab === "booth-members" && (
        <div className="space-y-4">
          {props.canManageMembers && (
            <BulkUploadMembersPanel
              bulkUploading={bulkUploading}
              bulkResults={bulkResults}
              csvInputRef={csvInputRef}
              onUpload={handleBulkUpload}
              onDownloadSample={downloadSampleCsv}
            />
          )}
          <Panel
            title="Team members"
            icon={Users}
            action={
              <div className="flex shrink-0 flex-nowrap items-center gap-2">
                <CustomSelect
                  size="sm"
                  className="w-[9.5rem]"
                  triggerClassName="w-[9.5rem]"
                  value={toAllValue(memberFilter)}
                  onChange={(v) => setMemberFilter(fromAllValue(v))}
                  options={toSelectOptionsWithAll([...MEMBER_ROLES], "All roles")}
                  placeholder="All roles"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1 whitespace-nowrap"
                  onClick={openAirBookingModal}
                >
                  <Plane className="h-4 w-4" /> Request air booking
                </Button>
                <Button size="sm" className="shrink-0 gap-1 whitespace-nowrap" onClick={openAddMemberModal}>
                  <Plus className="h-4 w-4" /> Add member
                </Button>
              </div>
            }
          >
            {members.length === 0 ? (
              <div className="space-y-3">
                <EmptyState
                  icon={UserPlus}
                  title="No team members yet"
                  description="Add your team members to manage passes, transport and food."
                  action={
                    <Button onClick={openAddMemberModal} className="gap-1">
                      <Plus className="h-4 w-4" /> Add first member
                    </Button>
                  }
                />
                {airBookingRequests.length > 0 && <AirBookingRequestsList requests={airBookingRequests} />}
              </div>
            ) : (
              <MemberTable
                members={filteredMembers}
                onRemove={removeMember}
                onEdit={openEditMemberModal}
                full
                airBookingRequests={airBookingRequests}
                memberWorkflows={memberWorkflows}
                onOpenDocuments={requestDocumentsModal}
                memberDocCount={memberDocCount}
                memberHasPassportDoc={memberHasPassportDoc}
              />
            )}
          </Panel>
          {props.eventExhibitorId && (
            <ExhibitorMemberBadgesPanel
              eventExhibitorId={props.eventExhibitorId}
              eventTitle={props.eventTitle}
              members={members}
              memberDocuments={memberDocuments}
              onDocumentUploaded={handleDocumentUploaded}
            />
          )}
          <Panel title="Team supply summary" icon={TrendingUp}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Water bottles/day", value: n * 2, icon: Droplets, accent: "sky" as const },
                { label: "Meal passes total", value: n * props.expoDays * 3, icon: Ticket, accent: "emerald" as const },
                { label: "Name badges", value: n, icon: IdCard, accent: "violet" as const },
                { label: "Event kits", value: n, icon: BriefcaseIcon, accent: "amber" as const },
              ].map((s) => (
                <MetricCard key={s.label} label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "airport" && (
        <AirportLogisticsSection members={members} onUpdateMember={updateMemberFields} />
      )}

      {tab === "accommodation" && (
        <AccommodationSection
          members={members}
          hotels={props.eventHotels ?? []}
          onUpdateMember={updateMemberFields}
        />
      )}

      {tab === "expo" && (
        <ExpoTransportSection members={members} onUpdateMember={updateMemberFields} />
      )}

      {tab === "tours" && (
        <ToursSection
          members={members}
          tourActivities={props.eventActivities.filter((a) => a.kind === "TOUR")}
          tourItineraries={props.tourTravelItineraries ?? []}
          onUpdateMember={(memberId, patch) => {
            setMembers((current) => {
              const next = current.map((m) => (m.id === memberId ? { ...m, ...patch } : m));
              if (patch.tourLogistics) {
                const ids = new Set<string>();
                for (const m of next) {
                  for (const id of m.tourLogistics?.selectedTourIds ?? []) ids.add(id);
                }
                setSelectedTours(ids);
              }
              return next;
            });
          }}
          schedules={
            <ExhibitorItineraryPanel
              itineraries={props.tourTravelItineraries ?? []}
              scheduleItems={props.eventSchedule ?? []}
            />
          }
        />
      )}

      {tab === "food" && (
        <FoodOutingsSection
          restaurants={props.eventRestaurants ?? []}
          selected={selectedFoodExp}
          onChange={(next) => {
            setSelectedFoodExp(next);
            void persistRegistration({ selectedFoodExp: [...next] });
          }}
          isComplete={Boolean(formSteps.food)}
          onMarkComplete={() => {
            const next = { ...formSteps, food: true };
            setFormSteps(next);
            void persistRegistration({
              formSteps: next,
              selectedFoodExp: [...selectedFoodExp],
            });
            notify.success("Food outings saved");
          }}
        />
      )}

      {tab === "checkins" && (
        <ExhibitorBoothCheckInsPanel
          eventExhibitorId={props.eventExhibitorId}
          visitorCount={props.boothVisitorCount ?? 0}
          records={props.boothVisitors ?? []}
          companyName={props.companyName}
          boothLabel={
            props.boothStandLabel ??
            (props.boothNumber ? `Booth ${props.boothNumber}` : null)
          }
        />
      )}

        </main>
      </div>
        </>
      )}

      {modalOpen && (
        <ModalShell
          title={editingMemberId ? "Edit team member" : "Add team member"}
          icon={editingMemberId ? Pencil : UserPlus}
          onClose={() => {
            setModalOpen(false);
            setEditingMemberId(null);
          }}
          wide
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  setEditingMemberId(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={addMember} disabled={addingMember} className="gap-1 bg-primary hover:bg-champagne-dark">
                <Check className="h-4 w-4" />{" "}
                {addingMember ? "Saving…" : editingMemberId ? "Save changes" : "Add member"}
              </Button>
            </>
          }
        >
          <div className="grid gap-4">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personal details</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="First name"><Input value={memberForm.fn} onChange={(e) => setMemberForm({ ...memberForm, fn: e.target.value })} /></Field>
                <Field label="Last name"><Input value={memberForm.ln} onChange={(e) => setMemberForm({ ...memberForm, ln: e.target.value })} /></Field>
                <Field label="Role at expo">
                  <Select value={memberForm.role} onChange={(v) => setMemberForm({ ...memberForm, role: v })} options={[...MEMBER_ROLES]} />
                </Field>
                <Field label="Email"><Input type="email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} /></Field>
                <Field label="Phone"><Input type="tel" value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} placeholder="+254…" /></Field>
                <Field label="Passport number"><Input value={memberForm.passportNumber} onChange={(e) => setMemberForm({ ...memberForm, passportNumber: e.target.value })} placeholder="Required for flight booking" /></Field>
              </div>
            </div>
            {props.canManageMembers && !editingMemberId && (
              <p className="rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-900 dark:bg-teal-900/20 dark:text-teal-200">
                A welcome email with exhibitor portal login credentials will be sent to this member.
              </p>
            )}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Logistics & preferences</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Transport option">
                  <Select value={memberForm.transport} onChange={(v) => setMemberForm({ ...memberForm, transport: v })} options={[...TRANSPORT_OPTIONS]} placeholder="Select…" />
                </Field>
                <Field label="Hotel">
                  {hotelSelectOptions.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      No hotels are listed for this event yet.
                    </p>
                  ) : (
                    <Select
                      value={memberForm.hotel}
                      onChange={(v) => setMemberForm({ ...memberForm, hotel: v })}
                      options={hotelSelectOptions}
                      placeholder="Select hotel…"
                    />
                  )}
                </Field>
                <Field label="Tours joining">
                  <Input value={memberForm.tours} onChange={(e) => setMemberForm({ ...memberForm, tours: e.target.value })} placeholder="e.g. Safari, city tour" />
                </Field>
              </div>
            </div>
            <Field label="Notes"><Input value={memberForm.notes} onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })} placeholder="Any special notes…" /></Field>
          </div>
        </ModalShell>
      )}

      {documentsNoticeMember && (
        <ModalShell
          title="Document upload"
          icon={Info}
          onClose={() => setDocumentsNoticeMember(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setDocumentsNoticeMember(null)}>
                Cancel
              </Button>
              <Button onClick={() => void acknowledgeDocumentsNotice()}>
                Continue
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-foreground">
              Document upload is required only for <strong>flight booking</strong> and{" "}
              <strong>tours</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              If this team member does not need flights or tours, you can skip uploading documents.
            </p>
          </div>
        </ModalShell>
      )}

      {documentsMember && props.eventExhibitorId && (
        <ModalShell
          title={`Documents — ${documentsMember.fn} ${documentsMember.ln}`}
          icon={FileUp}
          wide
          onClose={() => void closeDocumentsModal()}
          footer={
            <Button variant="outline" disabled={savingPassport} onClick={() => void closeDocumentsModal()}>
              Done
            </Button>
          }
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-champagne/30 bg-champagne/10 px-4 py-3 text-sm text-champagne-dark dark:border-champagne/25 dark:bg-champagne/10 dark:text-champagne-light">
              Document upload is required only for <strong>flight booking</strong> and{" "}
              <strong>tours</strong>.
            </div>
            <p className="text-sm text-muted-foreground">
              Upload official travel documents for this team member. Files are stored privately and only shared with Event Master and the travel agent when a flight booking is sent.
            </p>
            <Field label="Passport number">
              <div className="flex gap-2">
                <Input
                  value={documentsPassportDraft}
                  onChange={(e) => setDocumentsPassportDraft(e.target.value)}
                  placeholder="Required for flight booking"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void saveMemberPassport();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingPassport}
                  onClick={() => void saveMemberPassport()}
                >
                  {savingPassport ? "Saving…" : "Save"}
                </Button>
              </div>
            </Field>
            <MemberDocumentsUpload
              eventExhibitorId={props.eventExhibitorId}
              memberLocalId={documentsMember.id}
              memberName={`${documentsMember.fn} ${documentsMember.ln}`}
              documents={memberDocuments}
              onUploaded={handleDocumentUploaded}
              compact
            />
          </div>
        </ModalShell>
      )}

      {airBookingModalOpen && (
        <ModalShell
          title="Request air booking"
          icon={Plane}
          onClose={() => setAirBookingModalOpen(false)}
          footer={
            <>
              <Button variant="outline" onClick={() => setAirBookingModalOpen(false)}>Cancel</Button>
              <Button
                onClick={submitAirBooking}
                disabled={submittingAirBooking}
                className="gap-1 bg-primary hover:bg-champagne-dark"
              >
                <Check className="h-4 w-4" /> {submittingAirBooking ? "Submitting…" : "Submit request"}
              </Button>
            </>
          }
        >
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground">
              Select team members who need tickets. Each traveller must have a passport number and an uploaded passport document.
            </p>
            <Field label="Travel date">
              <Input
                type="date"
                value={airBookingForm.travelDate}
                onChange={(e) => setAirBookingForm({ ...airBookingForm, travelDate: e.target.value })}
              />
            </Field>
            <Field label="Notes (optional)">
              <Input
                value={airBookingForm.notes}
                onChange={(e) => setAirBookingForm({ ...airBookingForm, notes: e.target.value })}
                placeholder="Preferred airline, routing, class…"
              />
            </Field>
            <div className="space-y-2">
              <Label>Travellers</Label>
              {membersAvailableForAirBooking.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                  All team members already have a flight booking request.
                </p>
              ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
                {membersAvailableForAirBooking.map((member) => {
                  const selected = airBookingMemberIds.includes(member.id);
                  const ready =
                    memberHasPassportNumber(member) && memberHasPassportDoc(member.id);
                  return (
                    <label
                      key={member.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                        selected ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selected}
                        onChange={() =>
                          setAirBookingMemberIds((current) =>
                            current.includes(member.id)
                              ? current.filter((id) => id !== member.id)
                              : [...current, member.id]
                          )
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{member.fn} {member.ln}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.email} · Passport {memberHasPassportNumber(member) ? "on file" : "—"}
                        </p>
                        {!ready && (
                          <p className="mt-1 text-[11px] text-amber-700">
                            Add passport number and upload passport document in Team members
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
              )}
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function BulkUploadMembersPanel({
  bulkUploading,
  bulkResults,
  csvInputRef,
  onUpload,
  onDownloadSample,
}: {
  bulkUploading: boolean;
  bulkResults: {
    summary: { total: number; added: number; skipped: number; failed: number };
    skipped: { email: string; reason: string }[];
    failed: { email: string; reason: string }[];
  } | null;
  csvInputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (file: File) => void | Promise<void>;
  onDownloadSample: () => void;
}) {
  return (
    <Panel title="Bulk upload members" icon={Upload}>
      <p className="mb-4 text-sm text-muted-foreground">
        Upload a CSV with columns <strong>name</strong>, <strong>email</strong>, and <strong>phone</strong>.
        Each member receives a welcome email with exhibitor portal login credentials.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onUpload(file);
          }}
        />
        <Button
          size="sm"
          className="gap-1"
          disabled={bulkUploading}
          onClick={() => csvInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {bulkUploading ? "Uploading…" : "Upload CSV"}
        </Button>
        <Button size="sm" variant="outline" onClick={onDownloadSample}>
          Download sample CSV
        </Button>
      </div>
      {bulkResults && (
        <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
          <p className="font-medium">
            {bulkResults.summary.added} added · {bulkResults.summary.skipped} skipped · {bulkResults.summary.failed} failed
          </p>
          {(bulkResults.skipped.length > 0 || bulkResults.failed.length > 0) && (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {[...bulkResults.failed, ...bulkResults.skipped].slice(0, 8).map((row) => (
                <li key={`${row.email}-${row.reason}`}>
                  {row.email}: {row.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="7" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
}

function MemberTable({
  members,
  showStatus,
  overview,
  full,
  onRemove,
  onEdit,
  airBookingRequests = [],
  memberWorkflows = [],
  onOpenDocuments,
  memberDocCount,
  memberHasPassportDoc,
}: {
  members: TeamMember[];
  showStatus?: boolean;
  overview?: boolean;
  full?: boolean;
  onRemove?: (id: string) => void;
  onEdit?: (member: TeamMember) => void;
  airBookingRequests?: SerializedAirBookingRequest[];
  memberWorkflows?: SerializedAirBookingMemberWorkflow[];
  onOpenDocuments?: (member: TeamMember) => void;
  memberDocCount?: (memberId: string) => number;
  memberHasPassportDoc?: (memberId: string) => boolean;
}) {
  const docCount = memberDocCount ?? (() => 0);
  const hasPassport = memberHasPassportDoc ?? (() => false);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto overflow-y-visible rounded-xl border border-border/60">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5">Name</th>
              <th className="px-3 py-2.5">Role</th>
              {!overview && <th className="px-3 py-2.5">Passport</th>}
              {full && <th className="px-3 py-2.5">Documents</th>}
              {full && <th className="px-3 py-2.5">Status</th>}
              {(showStatus || full) && (
                <th className="px-3 py-2.5 text-right">{full ? "Action" : "Status"}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const uploadedCount = docCount(m.id);
              const passportReady = hasPassport(m.id);
              const flightStatus = resolveExhibitorMemberFlightStatus(
                m.id,
                memberWorkflows,
                airBookingRequests,
                passportReady
              );
              return (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-3">
                    <MemberNameWithTooltip member={m} />
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
                        ROLE_BADGE[m.role] || ROLE_BADGE["Lead exhibitor"]
                      )}
                    >
                      {m.role}
                    </span>
                  </td>
                  {!overview && (
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                      {m.hasPassportNumber ? "On file" : "—"}
                    </td>
                  )}
                  {full && onOpenDocuments && (
                    <td className="px-3 py-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 whitespace-nowrap text-xs"
                        onClick={() => onOpenDocuments(m)}
                      >
                        {passportReady ? (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <FileUp className="h-3.5 w-3.5" />
                        )}
                        {uploadedCount > 0 ? `Manage (${uploadedCount})` : "Upload"}
                      </Button>
                    </td>
                  )}
                  {full && (
                    <td className="px-3 py-3">
                      <MemberBookingStatusBadge status={flightStatus} />
                    </td>
                  )}
                  {showStatus && (
                    <td className="px-3 py-3 text-right">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                        Active
                      </span>
                    </td>
                  )}
                  {full && (onRemove || onEdit) && (
                    <td className="relative overflow-visible px-3 py-3 text-right">
                      <div className="flex justify-end">
                        <MemberActionMenu
                          member={m}
                          onEdit={onEdit ? () => onEdit(m) : undefined}
                          onDelete={onRemove ? () => onRemove(m.id) : undefined}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {airBookingRequests.length > 0 && <AirBookingRequestsList requests={airBookingRequests} />}
    </div>
  );
}

function MemberBookingStatusBadge({
  status,
}: {
  status: ReturnType<typeof resolveExhibitorMemberFlightStatus>;
}) {
  if (status.key === "not_requested") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const badgeClass = {
    sent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    paid: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    rate_sent: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    verified: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
    verification_pending: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
    pending: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  }[status.key];

  return (
    <span
      className={cn(
        "inline-flex max-w-[10rem] whitespace-normal rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight",
        badgeClass
      )}
    >
      {status.label}
    </span>
  );
}

function MemberActionMenu({
  member,
  onEdit,
  onDelete,
}: {
  member: TeamMember;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return null;

    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, 168);
    let left = rect.left;
    if (left + width > window.innerWidth - 8) {
      left = rect.right - width;
    }
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

    const panelHeight = panelRef.current?.offsetHeight ?? 88;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < panelHeight + 8 && rect.top > spaceBelow;
    const top = openAbove ? rect.top - panelHeight - 4 : rect.bottom + 4;

    const next = { top, left, width };
    setMenuStyle(next);
    return next;
  }, []);

  const closeMenu = () => {
    setOpen(false);
    setMenuStyle(null);
  };

  const toggleMenu = () => {
    if (open) {
      closeMenu();
      return;
    }
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const frame = requestAnimationFrame(() => updateMenuPosition());
    return () => cancelAnimationFrame(frame);
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      closeMenu();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    const onScrollOrResize = () => updateMenuPosition();

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updateMenuPosition]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        aria-label={`Actions for ${member.fn} ${member.ln}`}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "inline-flex min-w-[5.5rem] items-center justify-between gap-2 rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-muted/40",
          open && "border-primary/40 ring-1 ring-primary/20"
        )}
      >
        <span>Actions</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            className="fixed z-[250] min-w-[10.5rem] overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg ring-1 ring-black/5"
            style={
              menuStyle
                ? { top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }
                : { top: -9999, left: -9999, visibility: "hidden" as const }
            }
          >
            {onEdit && (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60"
                onClick={() => {
                  closeMenu();
                  onEdit();
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit member
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                onClick={() => {
                  closeMenu();
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

function AirBookingRequestsList({ requests }: { requests: SerializedAirBookingRequest[] }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 px-3 py-2.5">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Flight booking requests</p>
      <div className="space-y-1.5">
        {requests.map((request) => (
          <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium">
              {request.ticketCount} ticket{request.ticketCount === 1 ? "" : "s"} · {formatDate(request.travelDate, "MMM d, yyyy")}
            </span>
            <span className="text-muted-foreground">
              {request.status} · Requested {formatDate(request.requestedAt, "MMM d, yyyy")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegStep({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-champagne/15 text-champagne-dark dark:bg-champagne/15 dark:text-champagne-light">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-3"><Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>{children}</div>;
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={toSelectOptions(options, placeholder)}
      placeholder={placeholder}
    />
  );
}

function EventScheduleGrid({
  scheduleByDay,
  compact = false,
}: {
  scheduleByDay: { day: string; items: EventScheduleItemOption[] }[];
  compact?: boolean;
}) {
  return (
    <div className={cn("grid gap-3", compact ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
      {scheduleByDay.map(({ day, items }) => (
        <div key={day} className="rounded-xl border border-border bg-muted/30 p-3">
          <span className="mb-3 inline-flex rounded-full bg-champagne/15 px-2.5 py-0.5 text-[11px] font-medium text-espresso">
            {day}
          </span>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <div>
                  <div className="font-medium text-foreground">{item.title}</div>
                  <div>
                    {formatDate(item.startAt, "h:mm a")}
                    {item.endAt ? ` – ${formatDate(item.endAt, "h:mm a")}` : ""}
                    {item.location ? ` · ${item.location}` : ""}
                  </div>
                  {item.description ? <p className="mt-1">{item.description}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function CheckGroup({ options, selected, onToggle }: { options: string[]; selected: Set<string>; onToggle: (k: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => onToggle(opt)} className={cn("rounded-lg border px-3 py-2 text-sm transition-all", selected.has(opt) ? "border-primary bg-champagne/10 text-espresso shadow-sm dark:bg-champagne/10 dark:text-champagne-light" : "border-border bg-background hover:border-champagne/30 hover:bg-muted/50")}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function NavButtons({ onBack, onNext, nextLabel = "Next" }: { onBack?: () => void; onNext: () => void; nextLabel?: string }) {
  return (
    <div className={cn("mt-5 flex border-t border-border/60 pt-4", onBack ? "justify-between" : "justify-end")}>
      {onBack && <Button variant="outline" onClick={onBack} className="gap-1"><ArrowLeft className="h-4 w-4" /> Back</Button>}
      <Button onClick={onNext} className="gap-1 bg-primary shadow-sm hover:bg-champagne-dark">{nextLabel} <ArrowRight className="h-4 w-4" /></Button>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg bg-champagne/10 p-3 text-sm text-espresso dark:bg-champagne/10 dark:text-champagne-light">
      <Info className="mt-0.5 h-4 w-4 shrink-0" /> {children}
    </div>
  );
}

function TourSelect({ tour, selected, onToggle }: { tour: ReturnType<typeof activityToTourOption>; selected: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className={cn("flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all", selected ? "border-primary bg-champagne/10 shadow-sm ring-1 ring-primary/20 dark:bg-champagne/10" : "border-border bg-background hover:border-champagne/30 hover:bg-muted/40")}>
      <MapPin className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <div className="font-medium">{tour.title}</div>
        <div className="text-xs text-muted-foreground">{tour.sub}</div>
      </div>
      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", tour.badgeClass)}>{tour.badge}</span>
    </button>
  );
}

function SelectionRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/10 px-4 py-3">
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

function ExhibitorScanModeToggle({
  enabled,
  onChange,
  className,
  variant = "button",
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
  variant?: "button" | "sidebar";
}) {
  const slider = (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "Turn scan mode off" : "Turn scan mode on"}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative h-8 w-[4.25rem] shrink-0 rounded-full border border-foreground/80 bg-background transition-colors",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 flex items-center text-[10px] font-semibold uppercase tracking-wide text-foreground/80 transition-opacity",
          enabled ? "left-2 opacity-100" : "left-2 opacity-0"
        )}
      >
        On
      </span>
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 flex items-center text-[10px] font-semibold uppercase tracking-wide text-foreground/80 transition-opacity",
          enabled ? "right-2 opacity-0" : "right-2 opacity-100"
        )}
      >
        Off
      </span>
      <span
        className={cn(
          "absolute top-0.5 h-6 w-6 rounded-full bg-foreground shadow-sm transition-transform duration-200 ease-out",
          enabled ? "left-0.5 translate-x-[1.85rem]" : "left-0.5 translate-x-0"
        )}
      />
    </button>
  );

  if (variant === "sidebar") {
    return (
      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
        <ScanLine
          className={cn("h-4 w-4 shrink-0", enabled ? "text-primary" : "text-muted-foreground")}
        />
        <p className="min-w-0 flex-1 text-sm font-medium text-foreground">Scan mode</p>
        {slider}
      </div>
    );
  }

  return slider;
}
