import { getCctvServiceLabel } from "./cctv-booking";
import type { Booking } from "@/src/lib/db/schema";

export type BookingRow = Booking & {
  booking_code?: string | null;
  customer_name: string;
  customer_phone: string;
  service_type: string;
  status: string;
  model_id?: string | null;
  guard_type?: string | null;
  repair_category_id?: string | null;
  repair_subcategory_id?: string | null;
  location?: string | null;
  pincode?: string | null;
  scheduled_date?: string | null;
  time_slot?: string | null;
  notes?: string | null;
  user_id?: string | null;
  manual_order?: boolean;
  order_source?: string;
  assigned_rider?: string | null;
  assignment_notes?: string | null;
  assigned_at?: string | null;
  inspect_latitude?: number | null;
  inspect_longitude?: number | null;
  cctv_brand?: string | null;
  cctv_service?: string | null;
  created_by?: string | null;
  created_at: string;
};

export type BookingInsert = {
  customer_name: string;
  customer_phone: string;
  model_id?: string | null;
  service_type: string;
  location?: string | null;
  pincode?: string | null;
  scheduled_date?: string | null;
  time_slot?: string | null;
  user_id?: string | null;
  guard_type?: string | null;
  repair_category_id?: string | null;
  repair_subcategory_id?: string | null;
  inspect_latitude?: number | null;
  inspect_longitude?: number | null;
  notes?: string | null;
  cctv_brand?: string | null;
  cctv_service?: string | null;
  manual_order?: boolean;
  order_source?: string;
  status?: string;
  booking_code?: string | null;
  created_by?: string | null;
};

export type BookingAddressInput = {
  address: string;
  city?: string;
  pincode: string;
};

export function buildBookingLocation({ address, city, pincode }: BookingAddressInput) {
  return [address.trim(), city?.trim()].filter(Boolean).join(", ");
}

export function parseBookingLocation(location: string | null | undefined) {
  if (!location) {
    return { address: "", city: "" };
  }

  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return { address: location, city: "" };
  }

  return {
    address: parts.slice(0, -1).join(", "),
    city: parts.at(-1) || "",
  };
}

export function isValidPhoneNumber(phone: string) {
  return phone.replace(/\D/g, "").length >= 10;
}

export function isValidPincode(pincode: string) {
  return /^\d{6}$/.test(pincode.trim());
}

export function buildBookingInsert(input: {
  customerName: string;
  customerPhone: string;
  modelId: string;
  serviceType: BookingInsert["service_type"];
  address: string;
  city?: string;
  pincode: string;
  scheduledDate?: string;
  timeSlot?: string;
  userId?: string | null;
  guardType?: string | null;
  repairCategoryId?: string | null;
  repairSubcategoryId?: string | null;
  inspectLatitude?: number | null;
  inspectLongitude?: number | null;
  notes?: string | null;
}): BookingInsert {
  return {
    customer_name: input.customerName.trim(),
    customer_phone: input.customerPhone.trim(),
    model_id: input.modelId,
    location: buildBookingLocation({
      address: input.address,
      city: input.city,
      pincode: input.pincode,
    }),
    pincode: input.pincode.trim(),
    scheduled_date: input.scheduledDate || null,
    time_slot: input.timeSlot || null,
    service_type: input.serviceType,
    user_id: input.userId ?? null,
    guard_type: input.guardType ?? null,
    repair_category_id: input.repairCategoryId ?? null,
    repair_subcategory_id: input.repairSubcategoryId ?? null,
    inspect_latitude: input.inspectLatitude ?? null,
    inspect_longitude: input.inspectLongitude ?? null,
    notes: input.notes ?? null,
  };
}

export function formatBookingServiceType(serviceType: string) {
  if (serviceType === "screen_guard") return "Device Service";
  if (serviceType === "mobile_repair") return "Mobile Repair";
  if (serviceType === "laptop_repair") return "Laptop Repair";
  if (serviceType === "desktop_assembly") return "Desktop Assembly";
  if (serviceType === "cctv") return "CCTV Installation";
  if (serviceType === "it_support") return "IT Support";
  if (serviceType === "managed_it_services") return "Managed IT Services";
  return serviceType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatCctvBookingSelection(service?: string | null, brand?: string | null) {
  return [service ? getCctvServiceLabel(service) || formatBookingServiceType(service) : "", brand || ""].filter(Boolean).join(" - ");
}

export function formatBookingStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function isMissingBookingCodeColumnError(error: { message?: string } | null | undefined) {
  return Boolean(error?.message && error.message.includes("column bookings.booking_code does not exist"));
}
