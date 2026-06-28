export const orderServiceTypes = [
  { value: "mobile_repair", label: "Mobile Repair", catalogType: "mobile" },
  { value: "laptop_repair", label: "Laptop Repair", catalogType: "laptop" },
  { value: "screen_guard", label: "Device Service", catalogType: "mobile" },
  { value: "desktop_assembly", label: "Desktop Assembly", catalogType: "" },
  { value: "cctv", label: "CCTV Installation", catalogType: "" },
  { value: "it_support", label: "IT Support", catalogType: "" },
  { value: "managed_it_services", label: "Managed IT Services", catalogType: "" },
] as const;

export type OrderServiceType = (typeof orderServiceTypes)[number]["value"];

const serviceLabelMap: ReadonlyMap<string, string> = new Map(orderServiceTypes.map((service) => [service.value, service.label]));

export function getServiceTypeLabel(serviceType: string) {
  return serviceLabelMap.get(serviceType) || serviceType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getServiceTypeLabels(serviceTypes: string[] | null | undefined) {
  if (!serviceTypes?.length) return ["All services"];

  return serviceTypes.map(getServiceTypeLabel);
}

export function technicianSupportsService(serviceTypes: string[] | null | undefined, serviceType: string) {
  return !serviceTypes?.length || serviceTypes.includes(serviceType);
}
