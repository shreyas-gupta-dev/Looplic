// Types for the guided WhatsApp booking wizard — the tap-driven mirror of the
// website's UniversalBookingFlow. Everything the customer selects lives in
// `FlowContext`, which is persisted as JSON on whatsapp_conversations so a
// conversation survives across webhook invocations (each inbound message is a
// fresh Lambda; there is no in-memory session).

// Which end-to-end journey the customer is on. Mirrors the website's entry
// points: a device repair, a screen guard, CCTV, the "simple" enquiry services,
// selling a device, or looking up an existing order.
export type FlowKind = "repair" | "guard" | "cctv" | "simple" | "sell" | "track";

// Wizard steps. The device/CCTV/simple steps mirror UniversalBookingFlow's
// FlowStep union one-for-one; the catalog steps (brand/series/model) mirror the
// website's browse pages that precede it, and the sell steps mirror the Sell
// wizard. `idle` means "not in a flow".
export type FlowStep =
  | "idle"
  // entry
  | "service"
  // catalog navigation (website: /service/[type]/brands/[brand]/[series]/[model])
  | "brand"
  | "series"
  | "model"
  // device: repair or screen guard (website: service-select + repair-select)
  | "repair_category"
  | "repair_service"
  | "guard"
  // website: laptop-specs
  | "laptop_ram"
  | "laptop_storage"
  | "laptop_os"
  // website: cctv-select + cctv-config
  | "cctv_service"
  | "cctv_brand"
  | "cctv_cameras"
  | "cctv_location"
  | "cctv_dvr"
  // sell / buyback
  | "sell_category"
  | "sell_question"
  | "sell_variant"
  | "sell_quote"
  // website: notes
  | "notes"
  // website: details
  | "name"
  | "phone"
  | "address"
  | "city"
  | "pincode"
  // website: schedule
  | "date"
  | "slot"
  // final
  | "confirm"
  // post-booking self-service
  | "track_code"
  | "manage_booking"
  | "reschedule_date"
  | "reschedule_slot"
  | "cancel_confirm";

export type SellAnswers = Record<string, string[]>;

export type FlowContext = {
  kind?: FlowKind;

  // ─ Service selection ─
  serviceSlug?: string; // mobile-repair | laptop-repair | cctv | it-support | …
  dbServiceType?: string; // mobile_repair | laptop_repair | screen_guard | cctv | …
  catalogType?: "mobile" | "laptop" | "tablet" | "smartwatch" | "audio";

  // ─ Device (catalog) ─
  brandId?: string;
  brandName?: string;
  seriesId?: string;
  seriesName?: string;
  modelId?: string;
  modelName?: string;

  // ─ Repair ─
  repairCategoryId?: string;
  repairCategoryName?: string;
  repairSubcategoryId?: string;
  repairSubcategoryName?: string;
  price?: number | null;
  priceVisible?: boolean;

  // ─ Screen guard ─
  guardType?: string;
  guardPrice?: number | null;

  // ─ Laptop specs ─
  laptopRam?: string;
  laptopStorage?: string;
  laptopOs?: string;

  // ─ CCTV ─
  cctvService?: string; // stored value, e.g. "new_installation"
  cctvServiceLabel?: string;
  cctvBrand?: string;
  cctvCameraCount?: string;
  cctvLocationType?: string;
  cctvDvrPreference?: string;

  // ─ Sell / buyback ─
  sellVariantId?: string;
  sellVariantLabel?: string;
  sellQuestionIndex?: number;
  sellAnswers?: SellAnswers;
  sellBasePrice?: number;
  sellQuote?: number;
  sellPriced?: boolean;

  // ─ Customer details ─
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
  notes?: string;

  // ─ Schedule ─
  scheduledDate?: string; // YYYY-MM-DD
  timeSlot?: string;

  // ─ Navigation / bookkeeping ─
  /** Zero-based page for the current paginated picker. */
  page?: number;
  /** Set while the customer is changing one answer from the confirm screen. */
  editing?: boolean;
  /** Booking code being tracked / managed. */
  bookingCode?: string;
  /** Set once a booking has been created from this session (guards double-submit). */
  bookedCode?: string;
};

// What a step handler returns: where to go next and the context to persist.
// `message` is an optional one-line note rendered above the next prompt (used
// for validation errors like "that doesn't look like a 6-digit pincode").
export type StepResult = {
  step: FlowStep;
  context: FlowContext;
  message?: string;
};
