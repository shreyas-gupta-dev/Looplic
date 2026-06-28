const VISITING_CHARGES: Record<string, number> = {
  screen_guard: 499,
  mobile_repair: 499,
  laptop_repair: 1199,
  cctv: 1199,
};

export function getVisitingChargeAmount(serviceType: string | null | undefined) {
  return VISITING_CHARGES[serviceType || ""] || null;
}

export function formatVisitingCharge(serviceType: string | null | undefined) {
  const amount = getVisitingChargeAmount(serviceType);
  return amount ? `Rs. ${amount.toLocaleString("en-IN")}` : "";
}

export function getVisitingChargePolicy(serviceType: string | null | undefined) {
  const charge = formatVisitingCharge(serviceType);
  if (!charge) return "";
  return `Visiting charge: ${charge}. This visiting charge is waived once the customer claims the service from Looplic. If the customer does not claim the service, the customer has to pay the visiting charge.`;
}
