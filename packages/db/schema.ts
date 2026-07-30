import { boolean, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const appRoleEnum = pgEnum("app_role", ["admin", "operation", "technician", "user"]);

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default("null"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  letter: text("letter").notNull().default(""),
  gradient: text("gradient").notNull().default("from-blue-500 to-cyan-500"),
  sortOrder: integer("sort_order").notNull().default(0),
  imageUrl: text("image_url"),
  serviceType: text("service_type").notNull().default("mobile"),
  slug: text("slug").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const series = pgTable("series", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().default(""),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const models = pgTable("models", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  seriesId: uuid("series_id").notNull().references(() => series.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().default(""),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const repairCategories = pgTable("repair_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  serviceType: text("service_type").notNull().default("mobile"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const repairSubcategories = pgTable("repair_subcategories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: uuid("category_id").notNull().references(() => repairCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: numeric("price").notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const modelRepairServices = pgTable("model_repair_services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: uuid("model_id").notNull().references(() => models.id, { onDelete: "cascade" }),
  repairCategoryId: uuid("repair_category_id").notNull().references(() => repairCategories.id, { onDelete: "cascade" }),
  price: numeric("price").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const modelRepairSubcategoryPrices = pgTable("model_repair_subcategory_prices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: uuid("model_id").notNull().references(() => models.id, { onDelete: "cascade" }),
  repairSubcategoryId: uuid("repair_subcategory_id").notNull().references(() => repairSubcategories.id, { onDelete: "cascade" }),
  price: numeric("price").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const modelScreenGuards = pgTable("model_screen_guards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: uuid("model_id").notNull().references(() => models.id, { onDelete: "cascade" }),
  guardType: text("guard_type").notNull(),
  price: numeric("price").notNull().default("0"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const screenGuardCategories = pgTable("screen_guard_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const screenGuardTypes = pgTable("screen_guard_types", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: uuid("category_id").notNull().references(() => screenGuardCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: numeric("price").notNull().default("0"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  role: appRoleEnum("role").notNull(),
});

export const customerProfiles = pgTable("customer_profiles", {
  userId: text("user_id").primaryKey(),
  fullName: text("full_name"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  pincode: text("pincode"),
  inspectLatitude: numeric("inspect_latitude"),
  inspectLongitude: numeric("inspect_longitude"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  modelId: uuid("model_id").references(() => models.id, { onDelete: "set null" }),
  guardType: text("guard_type"),
  repairCategoryId: uuid("repair_category_id").references(() => repairCategories.id, { onDelete: "set null" }),
  repairSubcategoryId: uuid("repair_subcategory_id").references(() => repairSubcategories.id, { onDelete: "set null" }),
  serviceType: text("service_type").notNull().default("mobile_repair"),
  status: text("status").notNull().default("pending"),
  location: text("location"),
  pincode: text("pincode"),
  scheduledDate: text("scheduled_date"),
  timeSlot: text("time_slot"),
  notes: text("notes"),
  userId: text("user_id"),
  bookingCode: text("booking_code"),
  manualOrder: boolean("manual_order").notNull().default(false),
  orderSource: text("order_source").notNull().default("website"),
  assignedRider: text("assigned_rider"),
  assignmentNotes: text("assignment_notes"),
  assignedAt: timestamp("assigned_at", { withTimezone: true }),
  inspectLatitude: numeric("inspect_latitude"),
  inspectLongitude: numeric("inspect_longitude"),
  cctvBrand: text("cctv_brand"),
  cctvService: text("cctv_service"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceBills = pgTable("service_bills", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  serviceType: text("service_type").notNull(),
  repairCategoryId: uuid("repair_category_id").references(() => repairCategories.id, { onDelete: "set null" }),
  repairSubcategoryId: uuid("repair_subcategory_id").references(() => repairSubcategories.id, { onDelete: "set null" }),
  description: text("description"),
  amount: numeric("amount").notNull().default("0"),
  discount: numeric("discount").notNull().default("0"),
  tax: numeric("tax").notNull().default("0"),
  totalAmount: numeric("total_amount"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  paymentMode: text("payment_mode"),
  warrantyDurationValue: numeric("warranty_duration_value"),
  warrantyDurationUnit: text("warranty_duration_unit"),
  warrantyLabel: text("warranty_label"),
  notes: text("notes"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookingInspections = pgTable("booking_inspections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  technicianId: text("technician_id"),
  technicianName: text("technician_name"),
  deviceBrand: text("device_brand"),
  deviceModel: text("device_model"),
  reportedIssue: text("reported_issue"),
  repairCategoryId: uuid("repair_category_id").references(() => repairCategories.id, { onDelete: "set null" }),
  repairSubcategoryId: uuid("repair_subcategory_id").references(() => repairSubcategories.id, { onDelete: "set null" }),
  issueSeverity: text("issue_severity"),
  deviceCondition: text("device_condition"),
  accessoriesReceived: text("accessories_received"),
  customerApproval: text("customer_approval").notNull().default("pending"),
  pickupRequired: boolean("pickup_required").notNull().default(true),
  pickupNotes: text("pickup_notes"),
  quoteAmount: numeric("quote_amount").notNull().default("0"),
  quoteNotes: text("quote_notes"),
  warrantyLabel: text("warranty_label"),
  status: text("status").notNull().default("inspection"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Buyback ─────────────────────────────────────────────────────────────────
// Per-model buyback base price (value of the device in perfect condition).
export const buybackModelPrices = pgTable("buyback_model_prices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: uuid("model_id").notNull().unique().references(() => models.id, { onDelete: "cascade" }),
  basePrice: numeric("base_price").notNull().default("0"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Optional per-variant buyback prices (e.g. 64 GB / 128 GB / 256 GB). When a
// model has active variant rows the customer picks one and its price becomes
// the quote base; otherwise buyback_model_prices supplies the single price.
export const buybackModelVariants = pgTable("buyback_model_variants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: uuid("model_id").notNull().references(() => models.id, { onDelete: "cascade" }),
  variantLabel: text("variant_label").notNull(),
  basePrice: numeric("base_price").notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Universal evaluation questions buyers answer; scoped per service type
// (mobile/laptop/tablet/smartwatch/audio), not per model — every model of that
// type shares them. os_segment further scopes a question to Apple devices or
// Android/other devices ('all' = asked for every brand).
export const buybackQuestions = pgTable("buyback_questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceType: text("service_type").notNull().default("mobile"),
  osSegment: text("os_segment").notNull().default("all"), // all | apple | android
  title: text("title").notNull(),
  description: text("description"),
  questionType: text("question_type").notNull().default("single"), // single | multi
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Each option adjusts the quote: deduct/add a fixed ₹ amount or a percentage.
export const buybackQuestionOptions = pgTable("buyback_question_options", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: uuid("question_id").notNull().references(() => buybackQuestions.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  description: text("description"),
  effectType: text("effect_type").notNull().default("deduct_fixed"), // deduct_fixed | deduct_percent | add_fixed | add_percent
  amount: numeric("amount").notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Customer buyback pickup bookings created by the sell flow's quote screen.
// status: pending → confirmed → picked_up → paid (or cancelled).
export const buybackBookings = pgTable("buyback_bookings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingCode: text("booking_code").notNull().unique(),
  serviceType: text("service_type").notNull().default("mobile"),
  brandName: text("brand_name").notNull(),
  modelName: text("model_name").notNull(),
  variantLabel: text("variant_label"),
  quotedAmount: numeric("quoted_amount"),
  quoteBreakdown: text("quote_breakdown"),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  pickupDate: text("pickup_date"),
  timeSlot: text("time_slot"),
  status: text("status").notNull().default("pending"),
  userId: text("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const technicianApplications = pgTable("technician_applications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  email: text("email").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  city: text("city"),
  vehicleType: text("vehicle_type"),
  experience: text("experience"),
  serviceTypes: text("service_types").array(),
  status: text("status").notNull().default("pending"),
  reviewNotes: text("review_notes"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Blog / CMS. Posts are authored in the admin back-office (rich-text -> HTML)
// and rendered on the public site. `status` is "draft" | "published"; a
// published_at in the future acts as a scheduled post (filtered out of public
// listings until its time passes).
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  bodyHtml: text("body_html").notNull().default(""),
  coverImageUrl: text("cover_image_url"),
  coverImageAlt: text("cover_image_alt").notNull().default(""),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  author: text("author").notNull().default(""),
  category: text("category").notNull().default(""),
  tags: text("tags").array(),
  readingTime: text("reading_time").notNull().default(""),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  ogImageUrl: text("og_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// WhatsApp bot. One conversation row per customer WhatsApp number (wa_id), plus
// an append-only message log for both inbound and outbound messages. The bot
// works without these tables (best-effort persistence) but they enable the AI
// agent to keep short-term context and let the team audit conversations.
export const whatsappConversations = pgTable("whatsapp_conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  waId: text("wa_id").notNull().unique(), // customer phone in E.164 without '+'
  profileName: text("profile_name"),
  state: text("state").notNull().default("new"), // new | menu | ai | handoff | flow
  lastBookingCode: text("last_booking_code"),
  lastInboundAt: timestamp("last_inbound_at", { withTimezone: true }),
  lastOutboundAt: timestamp("last_outbound_at", { withTimezone: true }),
  // ─ Guided-booking wizard (mirrors the website's UniversalBookingFlow) ─
  // `flowStep` is the wizard step the customer is on ("idle" when not in a
  // flow); `flowContext` carries every selection made so far. Both are nullable
  // /defaulted so a conversation that predates this migration still loads.
  flowStep: text("flow_step").notNull().default("idle"),
  flowContext: jsonb("flow_context"),
  flowUpdatedAt: timestamp("flow_updated_at", { withTimezone: true }),
  // Set while a human has taken over — the bot stays silent until released.
  handoffUntil: timestamp("handoff_until", { withTimezone: true }),
  // STOP / opt-out: no proactive sends, and the bot only answers with the
  // resubscribe hint until the customer sends START.
  optedOut: boolean("opted_out").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Idempotency ledger for inbound webhook deliveries. Meta redelivers a message
// whenever our 200 is slow or lost, and without this a retry replays the same
// tap — which on the confirm step means a duplicate booking. One row per
// wamid, inserted with ON CONFLICT DO NOTHING; an insert that returns nothing
// means "already handled, skip".
export const whatsappProcessedMessages = pgTable("whatsapp_processed_messages", {
  messageId: text("message_id").primaryKey(),
  waId: text("wa_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const whatsappMessages = pgTable("whatsapp_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  waId: text("wa_id").notNull(),
  direction: text("direction").notNull(), // inbound | outbound
  messageId: text("message_id"), // WhatsApp message id (wamid...) when known
  type: text("type").notNull().default("text"),
  body: text("body"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AppRole = "admin" | "operation" | "technician" | "user";
export type Brand = typeof brands.$inferSelect;
export type BrandInsert = typeof brands.$inferInsert;
export type Series = typeof series.$inferSelect;
export type SeriesInsert = typeof series.$inferInsert;
export type Model = typeof models.$inferSelect;
export type ModelInsert = typeof models.$inferInsert;
export type RepairCategory = typeof repairCategories.$inferSelect;
export type RepairSubcategory = typeof repairSubcategories.$inferSelect;
export type ModelScreenGuard = typeof modelScreenGuards.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type BookingInsert = typeof bookings.$inferInsert;
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type CustomerProfileInsert = typeof customerProfiles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type ServiceBill = typeof serviceBills.$inferSelect;
export type ServiceBillInsert = typeof serviceBills.$inferInsert;
export type BookingInspection = typeof bookingInspections.$inferSelect;
export type TechnicianApplication = typeof technicianApplications.$inferSelect;
export type BuybackModelPrice = typeof buybackModelPrices.$inferSelect;
export type BuybackModelVariant = typeof buybackModelVariants.$inferSelect;
export type BuybackBooking = typeof buybackBookings.$inferSelect;
export type BuybackQuestion = typeof buybackQuestions.$inferSelect;
export type BuybackQuestionOption = typeof buybackQuestionOptions.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type BlogPostInsert = typeof blogPosts.$inferInsert;
export type WhatsappConversation = typeof whatsappConversations.$inferSelect;
export type WhatsappConversationInsert = typeof whatsappConversations.$inferInsert;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type WhatsappMessageInsert = typeof whatsappMessages.$inferInsert;
