export type LeadCustomer = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type LeadService = {
  type?: string | null;
  label?: string | null;
  price?: string | number | null;
};

export type LeadDevice = {
  brand?: string | null;
  series?: string | null;
  model?: string | null;
};

export type LeadSchedule = {
  date?: string | null;
  timeSlot?: string | null;
};

export type LeadPayload = {
  source: "booking" | "contact" | string;
  title?: string | null;
  customer?: LeadCustomer;
  service?: LeadService;
  device?: LeadDevice;
  schedule?: LeadSchedule;
  bookingCode?: string | null;
  address?: string | null;
  city?: string | null;
  pincode?: string | null;
  notes?: string | null;
  pageUrl?: string | null;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};
