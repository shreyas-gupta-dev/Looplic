import type { CustomerProfileInsert } from "@/src/lib/db/schema";

export type { CustomerProfile, CustomerProfileInsert } from "@/src/lib/db/schema";

export function buildCustomerProfileInsert(input: {
  userId: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  inspectLatitude?: number | null;
  inspectLongitude?: number | null;
}): CustomerProfileInsert {
  return {
    userId: input.userId,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    pincode: input.pincode.trim(),
    inspectLatitude: input.inspectLatitude != null ? String(input.inspectLatitude) : null,
    inspectLongitude: input.inspectLongitude != null ? String(input.inspectLongitude) : null,
  };
}
