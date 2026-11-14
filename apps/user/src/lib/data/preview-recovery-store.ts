/**
 * In-memory preview store for Data Recovery bookings when the remote AWS RDS
 * database is unreachable (e.g. local offline work, staging preview environments,
 * or CI tests where inbound RDS 5432 is VPC-restricted).
 */

export type PreviewRecoveryBooking = {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  status: string;
  location: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  priority: string;
  deviceType: string;
  failureType: string;
};

// Global singleton map surviving hot-reloads in development
const globalStore = globalThis as unknown as {
  __previewRecoveryBookings?: Map<string, PreviewRecoveryBooking>;
};

if (!globalStore.__previewRecoveryBookings) {
  globalStore.__previewRecoveryBookings = new Map<string, PreviewRecoveryBooking>();
}

export const previewRecoveryBookings = globalStore.__previewRecoveryBookings;

export function savePreviewBooking(booking: PreviewRecoveryBooking) {
  previewRecoveryBookings.set(booking.bookingCode.toUpperCase(), booking);
}

export function getPreviewBooking(code: string, phone: string): PreviewRecoveryBooking | null {
  const cleanCode = code.trim().toUpperCase();
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  const found = previewRecoveryBookings.get(cleanCode);
  if (!found) return null;

  const storedPhone = found.customerPhone.replace(/\D/g, "").slice(-10);
  if (storedPhone !== cleanPhone) return null;

  return found;
}
