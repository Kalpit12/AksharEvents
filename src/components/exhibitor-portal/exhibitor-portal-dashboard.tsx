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
  formatTravelSummary,
  TravelLogisticsFields,
  type TravelLogisticsForm,
  type VisaDocuments,
} from "@/components/exhibitor-portal/registration-travel-step";
import {
  MEMBER_ROLES,
  ROLE_BADGE,
  SHUTTLE_OPTIONS,
  TRANSPORT_OPTIONS,
  VEHICLE_OPTIONS,
  type ExhibitorTab,
  type TeamMember,
} from "@/components/exhibitor-portal/types";
import type { EventActivityOption } from "@/lib/event-activity-types";
import type {
  EventHotelOption,
  EventItemMasterOption,
  EventRestaurantOption,
  EventScheduleItemOption,
} from "@/lib/event-config-types";
import { EventPreferencesStep } from "@/components/exhibitor-portal/event-preferences-step";
import { AdditionalRequirementsPanel } from "@/components/exhibitor-portal/additional-requirements-panel";
import { BrandingsPanel } from "@/components/exhibitor-portal/brandings-panel";
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
  QuickAction,
  QuickActionsRow,
  StepBar,
} from "@/components/exhibitor-portal/exhibitor-portal-ui";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
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
  MapPin,
  Pencil,
  Plane,
  PackagePlus,
  Palette,
  Plus,
  Salad,
  Send,
  ShieldCheck,
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
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardUrlState, useUrlEnumState } from "@/hooks/use-dashboard-url-state";
import { notify } from "@/lib/notify";

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
  hall: string | null;
  expoDays: number;
  eventActivities: EventActivityOption[];
  eventHotels?: EventHotelOption[];
  eventRestaurants?: EventRestaurantOption[];
  eventSchedule?: EventScheduleItemOption[];
  itemCatalog?: EventItemMasterOption[];
  canManageMembers?: boolean;
  openEvents?: OpenExhibitorEvent[];
  memberDocuments?: SerializedMemberDocument[];
  airBookingRequests?: SerializedAirBookingRequest[];
  memberWorkflows?: SerializedAirBookingMemberWorkflow[];
  brandingArtworkSubmissions?: SerializedBrandingArtworkSubmission[];
};

const TABS: { id: ExhibitorTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "registration", label: "Registration form", icon: FileText },
  { id: "additional", label: "Additional requirements", icon: PackagePlus },
  { id: "brandings", label: "Brandings", icon: Palette },
  { id: "members", label: "Team members", icon: Users },
  { id: "tours", label: "Tours & travel", icon: MapPin },
  { id: "food", label: "Food outings", icon: ForkKnife },
];

const EXHIBITOR_TAB_IDS = [
  "overview",
  "registration",
  "additional",
  "brandings",
  "members",
  "tours",
  "food",
] as const satisfies readonly ExhibitorTab[];

const REGISTRATION_STEP_COUNT = 6;

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
  const diningOptions = useMemo(
    () =>
      (props.eventRestaurants ?? []).map((restaurant) =>
        [restaurant.name, restaurant.cuisine, restaurant.location].filter(Boolean).join(" · ")
      ),
    [props.eventRestaurants]
  );
  const hotelSelectOptions = useMemo(() => {
    const hotels = (props.eventHotels ?? []).map((hotel) =>
      hotel.location ? `${hotel.name} — ${hotel.location}` : hotel.name
    );
    return ["Own accommodation", ...hotels];
  }, [props.eventHotels]);
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
  const [documentsPassportDraft, setDocumentsPassportDraft] = useState("");
  const [savingPassport, setSavingPassport] = useState(false);
  const [submittingAirBooking, setSubmittingAirBooking] = useState(false);
  const [regStep, setRegStep] = useState(() => {
    const fromUrl = Number(searchParams.get("step"));
    if (fromUrl >= 1 && fromUrl <= REGISTRATION_STEP_COUNT) return fromUrl;
    return saved?.regStep ?? 1;
  });

  const setTab = useCallback(
    (next: ExhibitorTab) => {
      setTabRaw(next, next === "registration" ? { step: String(regStep) } : { step: null });
    },
    [setTabRaw, regStep]
  );

  useEffect(() => {
    const step = Number(searchParams.get("step"));
    if (tab === "registration" && step >= 1 && step <= REGISTRATION_STEP_COUNT) {
      setRegStep(step);
    }
  }, [searchParams, tab]);

  const [formSteps, setFormSteps] = useState(
    () => saved?.formSteps ?? { company: false, event: false, travel: false, transport: false, food: false }
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

  const progressPct = useMemo(() => {
    let count = 0;
    if (formSteps.company) count++;
    if (formSteps.event) count++;
    if (members.length > 0) count++;
    if (formSteps.travel) count++;
    if (formSteps.transport) count++;
    if (formSteps.food) count++;
    return Math.round((count / 6) * 100);
  }, [formSteps, members.length]);

  const dateRange = `${formatDate(props.startDate, "MMM d")}–${formatDate(props.endDate, "d, yyyy")}`;

  useEffect(() => {
    if (selectedBoothItemId || !saved?.form.booth || boothCatalog.length === 0) return;
    const match = boothCatalog.find((item) => item.name === saved.form.booth);
    if (match) setSelectedBoothItemId(match.id);
  }, [boothCatalog, saved?.form.booth, selectedBoothItemId]);

  const buildPayload = useCallback(
    (overrides: Partial<SavedRegistrationData> = {}): SavedRegistrationData => ({
      form: overrides.form ?? form,
      travel: overrides.travel ?? travel,
      visaDocNames: overrides.visaDocNames ?? {
        passport: visaDocs.passport?.name ?? null,
        id: visaDocs.id?.name ?? null,
        yellowFever: visaDocs.yellowFever?.name ?? null,
      },
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

  useEffect(() => {
    setAirBookingRequests(props.airBookingRequests ?? []);
  }, [props.airBookingRequests]);

  useEffect(() => {
    setMemberWorkflows(props.memberWorkflows ?? []);
  }, [props.memberWorkflows]);

  useEffect(() => {
    setBrandingSubmissions(props.brandingArtworkSubmissions ?? []);
  }, [props.brandingArtworkSubmissions]);

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

  const goStep = (n: number) => {
    const nextFormSteps = {
      ...formSteps,
      company: n > 1 ? true : formSteps.company,
      event: n > 2 ? true : formSteps.event,
      travel: n > 3 ? true : formSteps.travel,
      transport: n > 4 ? true : formSteps.transport,
      food: n > 5 ? true : formSteps.food,
    };
    setFormSteps(nextFormSteps);
    setRegStep(n);
    setParams({ tab: "registration", step: String(n) });
    if (!isSubmitted) {
      void persistRegistration({ formSteps: nextFormSteps, regStep: n });
    }
  };

  const submitRegistration = async () => {
    if (isSubmitted) {
      notify.info("Already submitted");
      return;
    }
    if (!form.company.trim()) {
      notify.error("Company name required");
      goStep(1);
      return;
    }
    setSubmitting(true);
    try {
      const finalSteps = { company: true, event: true, travel: true, transport: true, food: true };
      setFormSteps(finalSteps);
      const result = await persistRegistration({ formSteps: finalSteps, regStep }, "SUBMITTED");
      if (result && "success" in result && result.success) {
        setRegistrationStatus("SUBMITTED");
        notify.success("Registration submitted");
      }
    } finally {
      setSubmitting(false);
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
      notify.success("Event linked");
      router.refresh();
    } finally {
      setLinkingEvent(false);
    }
  };

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
  const tourCount = selectedTours.size;

  const checklist = [
    { key: "company", label: "Company details", done: formSteps.company },
    { key: "event", label: "Event preferences", done: formSteps.event },
    { key: "members", label: "Team members added", done: members.length > 0 },
    { key: "travel", label: "Travel & logistics", done: formSteps.travel },
    { key: "tours", label: "Tours & transport", done: formSteps.transport },
    { key: "food", label: "Food outings confirmed", done: formSteps.food },
  ];

  const dietMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    members.forEach((m) => {
      if (!m.diet) return;
      if (!map[m.diet]) map[m.diet] = [];
      map[m.diet].push(m.fn);
    });
    return map;
  }, [members]);

  const boothLabel = props.boothNumber
    ? `Booth #${props.boothNumber}${props.hall ? ` · ${props.hall}` : ""}`
    : "Booth TBC";

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
        label: "View registration summary",
        onAction: () => {
          setTab("registration");
          goStep(6);
        },
      };
    }

    if (!formSteps.company) {
      return {
        label: "Complete company details",
        onAction: () => {
          setTab("registration");
          goStep(1);
        },
      };
    }

    if (!formSteps.event) {
      return {
        label: "Set event preferences",
        onAction: () => {
          setTab("registration");
          goStep(2);
        },
      };
    }

    if (members.length === 0) {
      return {
        label: "Add team members",
        onAction: () => {
          setTab("members");
          openAddMemberModal();
        },
      };
    }

    if (!formSteps.travel) {
      return {
        label: "Complete travel details",
        onAction: () => {
          setTab("registration");
          goStep(3);
        },
      };
    }

    if (!formSteps.transport) {
      return {
        label: "Book tours & transport",
        onAction: () => {
          setTab("registration");
          goStep(4);
        },
      };
    }

    if (!formSteps.food) {
      return {
        label: "Confirm food outings",
        onAction: () => {
          setTab("registration");
          goStep(5);
        },
      };
    }

    return {
      label: "Review & submit",
      onAction: () => {
        setTab("registration");
        goStep(6);
      },
    };
  }, [
    props.eventExhibitorId,
    isSubmitted,
    formSteps,
    members.length,
    setTab,
    goStep,
    openAddMemberModal,
  ]);

  return (
    <div className="space-y-5">
      <PortalHero
        eventTitle={props.eventTitle}
        eventCity={props.eventCity}
        dateRange={dateRange}
        companyName={props.companyName}
        boothLabel={boothLabel}
        eventVenue={props.eventVenue}
        startDate={props.startDate}
        endDate={props.endDate}
        status={heroStatus}
        actionLabel={heroAction.label}
        onAction={heroAction.onAction}
      />

      {tab === "overview" && (
        <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Team members" value={n} icon={Users} accent="teal" />
          <MetricCard label="Transport slots" value={n} icon={Bus} accent="sky" />
          <MetricCard label="Meal passes" value={n * props.expoDays * 3} icon={Ticket} accent="emerald" />
          <MetricCard label="Tours booked" value={tourCount} icon={MapPin} accent="violet" />
        </section>
      )}

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-6">
        <PortalNav tabs={TABS} active={tab} onChange={setTab} />

        <main className="min-w-0 space-y-4">
      {tab === "overview" && (
        <div className="space-y-4">
          {!props.eventExhibitorId && (
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
          )}
          <Panel title="Quick actions" icon={LayoutDashboard}>
            <QuickActionsRow>
              <QuickAction highlight label="Complete registration" sub="Fill in company, travel & food details" onClick={() => { setTab("registration"); goStep(1); }} />
              <QuickAction label="Add team members" sub="Manage passes, transport & meals" onClick={() => { setTab("members"); openAddMemberModal(); }} />
              <QuickAction label="Book tours" sub="Safari, city tours & excursions" onClick={() => setTab("tours")} />
              <QuickAction label="Plan food outings" sub="Vegetarian meals & dining" onClick={() => setTab("food")} />
            </QuickActionsRow>
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
                    label={item.label}
                    done={item.done}
                    onAction={
                      item.key === "members"
                        ? () => openAddMemberModal()
                        : () => {
                            setTab("registration");
                            const stepMap: Record<string, number> = {
                              company: 1,
                              event: 2,
                              travel: 3,
                              tours: 4,
                              food: 5,
                            };
                            goStep(stepMap[item.key] ?? 1);
                          }
                    }
                  />
                ))}
              </ul>
              <ContinueButton onClick={() => { setTab("registration"); goStep(1); }} />
            </Panel>

            <Panel title="Event at a glance" icon={Calendar}>
              <GlanceRow icon={MapPin} title={props.eventVenue} sub={props.eventCity} />
              <GlanceRow icon={Calendar} title={dateRange} sub={`${props.expoDays} days · Setup from day before`} />
              <GlanceRow
                icon={Building2}
                title={props.boothNumber ? `Booth #${props.boothNumber}${props.hall ? ` · ${props.hall}` : ""}` : "Booth assignment pending"}
                sub={form.booth || "Booth size not selected yet"}
              />
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

      {tab === "registration" && (
        <Panel title="" icon={FileText} noHeader>
          <StepBar step={regStep} onStepClick={goStep} />
          {regStep === 1 && (
            <RegStep title="Company information" icon={Building2}>
              <FormRow>
                <Field label="Company / organisation name">
                  <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Technologies Ltd" />
                </Field>
                <Field label="Industry / sector">
                  <Select value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} options={["", "Technology", "Agriculture", "Finance & fintech", "Health & pharma", "Education", "Manufacturing", "Logistics", "Media & creative", "Government", "Other"]} placeholder="Select…" />
                </Field>
              </FormRow>
              <FormRow>
                <Field label="Contact person (full name)"><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
                <Field label="Job title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Marketing Director" /></Field>
              </FormRow>
              <FormRow>
                <Field label="Email address"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Phone number"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254 700 000000" /></Field>
              </FormRow>
              <FormRow>
                <Field label="Country of origin">
                  <Select value={form.country} onChange={(v) => setForm({ ...form, country: v })} options={["Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia", "South Africa", "Nigeria", "Ghana", "Other"]} />
                </Field>
                <Field label="Number of staff attending">
                  <Input type="number" min={1} max={50} value={form.staff} onChange={(e) => setForm({ ...form, staff: e.target.value })} placeholder="4" />
                </Field>
              </FormRow>
              <Field label="Brief company description">
                <Textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="What does your company do? What will you exhibit?" rows={3} />
              </Field>
              <NavButtons onNext={() => goStep(2)} />
            </RegStep>
          )}
          {regStep === 2 && (
            <RegStep title="Event preferences & requirements" icon={Calendar}>
              <EventPreferencesStep
                catalog={itemCatalog}
                setupOptions={setupOptions}
                selectedBoothItemId={selectedBoothItemId}
                form={{ setup: form.setup, access: form.access }}
                onBoothChange={handleBoothItemChange}
                onFormChange={(patch) => setForm({ ...form, ...patch })}
              />
              <NavButtons onBack={() => goStep(1)} onNext={() => goStep(3)} nextLabel="Next: Travel & logistics" />
            </RegStep>
          )}
          {regStep === 3 && (
            <RegStep title="Travel & logistics" icon={Bus}>
              <InfoBox>
                Tell us what travel services you need. Our team will coordinate flights, visas, accommodation, and local logistics for your visit.
              </InfoBox>
              <TravelLogisticsFields
                travel={travel}
                visaDocs={visaDocs}
                onTravelChange={setTravel}
                onVisaDocsChange={setVisaDocs}
              />
              <NavButtons onBack={() => goStep(2)} onNext={() => goStep(4)} nextLabel="Next: Tours & transport" />
            </RegStep>
          )}
          {regStep === 4 && (
            <RegStep title="Tours & travel arrangements" icon={MapPin}>
              {scheduleByDay.length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Event schedule</p>
                  <EventScheduleGrid scheduleByDay={scheduleByDay} compact />
                </div>
              )}
              <InfoBox>Select all transport and tours your team requires. Costs are per person and will be invoiced separately.</InfoBox>
              <Field label="Pickup from hotel or accommodation required?">
                <Select
                  value={form.accommodationPickup}
                  onChange={(v) => setForm({ ...form, accommodationPickup: v })}
                  options={["No", "Yes — from hotel or accommodation"]}
                />
              </Field>
              <Field label="Daily venue shuttle">
                <CheckGroup options={[...SHUTTLE_OPTIONS]} selected={shuttles} onToggle={(k) => toggleSet(shuttles, k, setShuttles)} />
              </Field>
              <Field label="Optional tours — select all your team will join">
                {tourOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tours have been published for this event yet.</p>
                ) : (
                  <div className="space-y-2">
                    {tourOptions.map((t) => (
                      <TourSelect key={t.id} tour={t} selected={selectedTours.has(t.id)} onToggle={() => toggleSet(selectedTours, t.id, setSelectedTours)} />
                    ))}
                  </div>
                )}
              </Field>
              <FormRow>
                <Field label="Departure date & drop-off to accommodation">
                  <Select value={form.depart} onChange={(v) => setForm({ ...form, depart: v })} options={departureOptions} />
                </Field>
                <Field label="Vehicle preference">
                  <Select value={form.vehicle} onChange={(v) => setForm({ ...form, vehicle: v })} options={[...VEHICLE_OPTIONS]} placeholder="Select…" />
                  <p className="mt-1.5 text-xs text-muted-foreground">Ride will be provided based on availability.</p>
                </Field>
              </FormRow>
              <NavButtons onBack={() => goStep(3)} onNext={() => goStep(5)} nextLabel="Next: Food outings" />
            </RegStep>
          )}
          {regStep === 5 && (
            <RegStep title="Food outings & dining" icon={ForkKnife}>
              <InfoBox>All event meals and dining outings are 100% vegetarian — no meat or fish is served.</InfoBox>
              <Field label="Which vegetarian team meals will your group attend?">
                <CheckGroup options={mealOptions} selected={selectedMeals} onToggle={(k) => toggleSet(selectedMeals, k, setSelectedMeals)} />
              </Field>
              <Field label="Optional vegetarian dining experiences — select all of interest">
                {diningOptions.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
                    No restaurant outings have been published yet. The Event Master will add options here.
                  </p>
                ) : (
                  <CheckGroup options={diningOptions} selected={selectedFoodExp} onToggle={(k) => toggleSet(selectedFoodExp, k, setSelectedFoodExp)} />
                )}
              </Field>
              <div className="grid gap-3 sm:grid-cols-1">
                <Field label="Allergies to note (veg menu)"><Input value={form.allergy} onChange={(e) => setForm({ ...form, allergy: e.target.value })} placeholder="e.g. nuts, dairy, gluten…" /></Field>
              </div>
              <Field label="Any special food requests or notes for the organiser?">
                <Textarea value={form.foodnotes} onChange={(e) => setForm({ ...form, foodnotes: e.target.value })} rows={2} />
              </Field>
              <NavButtons onBack={() => goStep(4)} onNext={() => goStep(6)} nextLabel="Review & submit" />
            </RegStep>
          )}
          {regStep === 6 && (
            <RegStep title="Review your submission" icon={ClipboardCheck}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company & event</h4>
              <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
                {[
                  ["Company", form.company || "—"],
                  ["Contact person", form.contact || "—"],
                  ["Industry", form.industry || "—"],
                  ["Email", form.email || "—"],
                  ["Team members", `${members.length} registered`],
                  ["Staff attending", form.staff || "0"],
                  ["Booth package", form.booth || "—"],
                  ["Setup date", form.setup || "—"],
                  [
                    "Additional requirements",
                    selectedAdditionalItemIds.size > 0
                      ? `${selectedAdditionalItemIds.size} item(s) — see Additional requirements tab`
                      : "None selected",
                  ],
                  ["Accommodation pickup", form.accommodationPickup],
                  ["Tours selected", String(selectedTours.size)],
                ].map(([label, val]) => (
                  <div key={label} className="rounded-lg bg-muted/50 p-3">
                    <div className="text-[11px] text-muted-foreground">{label}</div>
                    <div className="text-sm font-medium">{val}</div>
                  </div>
                ))}
              </div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Travel & logistics</h4>
              <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
                {formatTravelSummary(travel, visaDocs).map(([label, val]) => (
                  <div key={label} className="rounded-lg bg-muted/50 p-3">
                    <div className="text-[11px] text-muted-foreground">{label}</div>
                    <div className="text-sm font-medium">{val}</div>
                  </div>
                ))}
              </div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Food & dining</h4>
              <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
                {[
                  ["Meal plan", "All vegetarian"],
                  ["Meals selected", String(selectedMeals.size)],
                  ["Veg dining experiences", String(selectedFoodExp.size)],
                  ["Allergies noted", form.allergy || "None"],
                ].map(([label, val]) => (
                  <div key={label} className="rounded-lg bg-muted/50 p-3">
                    <div className="text-[11px] text-muted-foreground">{label}</div>
                    <div className="text-sm font-medium">{val}</div>
                  </div>
                ))}
              </div>
              <div className="my-4 h-px bg-border" />
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Please review all details carefully. Once submitted, changes must be requested via your event coordinator.
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => goStep(5)} className="gap-1"><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button
                  onClick={submitRegistration}
                  disabled={submitting || saving || isSubmitted}
                  className="gap-1 bg-primary hover:bg-champagne-dark"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting…" : isSubmitted ? "Submitted" : "Submit registration"}
                </Button>
              </div>
            </RegStep>
          )}
        </Panel>
      )}

      {tab === "additional" && (
        <AdditionalRequirementsPanel
          catalog={itemCatalog}
          selectedItemIds={selectedAdditionalItemIds}
          onToggleItem={handleAdditionalItemToggle}
          companyName={form.company || props.companyName}
          eventTitle={props.eventTitle}
          contactName={form.contact}
          onInvoiceDownload={handleAdditionalInvoiceDownload}
        />
      )}

      {tab === "brandings" && (
        <BrandingsPanel
          eventExhibitorId={props.eventExhibitorId}
          catalog={itemCatalog}
          selectedBrandingItemIds={selectedBrandingItemIds}
          submissions={brandingSubmissions}
          onSubmissionsChange={setBrandingSubmissions}
        />
      )}

      {/* Members */}
      {tab === "members" && (
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
                onOpenDocuments={openDocumentsModal}
                memberDocCount={memberDocCount}
                memberHasPassportDoc={memberHasPassportDoc}
              />
            )}
          </Panel>
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

      {/* Tours */}
      {tab === "tours" && (
        <div className="space-y-4">
          <Panel title="Your transport & tour selections" icon={MapPin}>
            {shuttles.size === 0 && selectedTours.size === 0 && travelActivities.length === 0 && form.accommodationPickup === "No" && form.depart.startsWith("No") ? (
              <EmptyState
                icon={MapPin}
                title="No transport or tours selected"
                description="Complete the registration form to choose shuttles, tours, and travel options."
                compact
                action={<Button onClick={() => { setTab("registration"); goStep(4); }}>Open registration form</Button>}
              />
            ) : (
              <div className="space-y-2.5">
                {form.accommodationPickup.toLowerCase().startsWith("yes") && (
                  <SelectionRow title="Accommodation pickup" detail={form.accommodationPickup} />
                )}
                {[...shuttles].map((s) => (
                  <SelectionRow key={s} title={s} detail={form.vehicle || "Vehicle TBC"} />
                ))}
                {tourOptions
                  .filter((t) => selectedTours.has(t.id))
                  .map((t) => (
                    <SelectionRow key={t.id} title={t.title} detail={t.sub} />
                  ))}
                {travelActivities.map((a) => (
                  <SelectionRow
                    key={a.id}
                    title={a.title}
                    detail={`${formatDate(a.startAt, "MMM d · h:mm a")}${a.location ? ` · ${a.location}` : ""}`}
                  />
                ))}
                {!form.depart.toLowerCase().startsWith("no") && (
                  <SelectionRow title="Departure drop-off" detail={form.depart} />
                )}
              </div>
            )}
          </Panel>
          {members.length > 0 && selectedTours.size > 0 && (
            <Panel title="Team size for selected tours" icon={Users}>
              <p className="text-sm text-muted-foreground">
                {members.length} team member{members.length === 1 ? "" : "s"} registered · {selectedTours.size} tour{selectedTours.size === 1 ? "" : "s"} selected
              </p>
            </Panel>
          )}
        </div>
      )}

      {/* Food */}
      {tab === "food" && (
        <div className="space-y-4">
          <Panel title="Your meal selections" icon={ForkKnife}>
            {selectedMeals.size === 0 && selectedFoodExp.size === 0 ? (
              <EmptyState
                icon={ForkKnife}
                title="No meals selected yet"
                description="Choose vegetarian meals and dining experiences in the registration form."
                compact
                action={<Button onClick={() => { setTab("registration"); goStep(5); }}>Open registration form</Button>}
              />
            ) : (
              <div className="space-y-2.5">
                {[...selectedMeals].map((meal) => (
                  <SelectionRow key={meal} title={meal} detail={`${members.length || form.staff || 0} attending`} />
                ))}
                {[...selectedFoodExp].map((exp) => (
                  <SelectionRow key={exp} title={exp} detail="Optional experience" />
                ))}
                {form.allergy && <SelectionRow title="Allergies noted" detail={form.allergy} />}
                {form.foodnotes && <SelectionRow title="Special notes" detail={form.foodnotes} />}
              </div>
            )}
          </Panel>
          <Panel title="Team dietary notes" icon={Leaf}>
            <p className="mb-3 text-sm text-muted-foreground">All catering is vegetarian. Note any allergies below when adding team members.</p>
            {Object.keys(dietMap).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Add team members to see dietary breakdown</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-[11px] text-muted-foreground"><th className="pb-2 w-[35%]">Preference</th><th className="pb-2">Count</th><th className="pb-2">Members</th></tr></thead>
                <tbody>
                  {Object.entries(dietMap).map(([diet, names]) => (
                    <tr key={diet} className="border-b border-border last:border-0">
                      <td className="py-2">{diet}</td>
                      <td className="py-2">{names.length}</td>
                      <td className="py-2 text-xs text-muted-foreground">{names.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
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
                  {hotelSelectOptions.length <= 1 ? (
                    <Input value={memberForm.hotel} onChange={(e) => setMemberForm({ ...memberForm, hotel: e.target.value })} placeholder="Hotel name or own accommodation" />
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
        </main>
      </div>
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
