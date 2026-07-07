import { boolean, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
// type shares them.
export const buybackQuestions = pgTable("buyback_questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceType: text("service_type").notNull().default("mobile"),
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
export type BuybackQuestion = typeof buybackQuestions.$inferSelect;
export type BuybackQuestionOption = typeof buybackQuestionOptions.$inferSelect;
