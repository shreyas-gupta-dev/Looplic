export const cctvServiceOptions = [
  { value: "new_installation", label: "New CCTV Installation" },
  { value: "repair_service", label: "CCTV Repair & Service" },
  { value: "upgrade", label: "CCTV Upgrade" },
  { value: "relocation", label: "CCTV Relocation" },
  { value: "amc_maintenance", label: "CCTV AMC / Maintenance" },
] as const;

export const cctvBrandOptions = [
  "Hikvision",
  "CP Plus",
  "Dahua",
  "Godrej",
  "EZVIZ",
  "TP-Link Tapo",
  "Other / Not Sure",
] as const;

export function getCctvServiceLabel(value: string | null | undefined) {
  return cctvServiceOptions.find((option) => option.value === value)?.label || "";
}

export function isCctvServiceValue(value: string | null | undefined) {
  return cctvServiceOptions.some((option) => option.value === value);
}

export function isCctvBrandValue(value: string | null | undefined) {
  return cctvBrandOptions.some((brand) => brand === value);
}

export function buildCctvBrandSelectionHref(serviceValue?: string) {
  const params = new URLSearchParams();
  if (serviceValue) params.set("cctv_service", serviceValue);
  return `/service/cctv/brands${params.toString() ? `?${params.toString()}` : ""}`;
}

export function buildCctvBookingHref(serviceValue: string, brand: string) {
  const params = new URLSearchParams({
    cctv_service: serviceValue,
    cctv_brand: brand,
  });

  return `/book/cctv?${params.toString()}`;
}
