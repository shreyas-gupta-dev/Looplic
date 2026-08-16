"use client";

import { useState, useCallback } from "react";
import {
  MessageCircle,
  Smartphone,
  Laptop,
  Monitor,
  Wrench,
  Shield,
  Camera,
  Wifi,
  Building2,
  ChevronRight,
  ChevronLeft,
  X,
  ArrowRight,
  CheckCircle,
  MapPin,
  Clock,
  User,
  Phone,
} from "lucide-react";
import { whatsappPhone } from "@/src/lib/company";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "service" | "device" | "issue" | "details" | "schedule" | "confirm";

type ServiceOption = {
  id: string;
  label: string;
  icon: typeof Smartphone;
  description: string;
};

type DeviceOption = {
  id: string;
  label: string;
};

type IssueOption = {
  id: string;
  label: string;
};

type BookingState = {
  service: string | null;
  serviceLabel: string | null;
  device: string | null;
  deviceLabel: string | null;
  issue: string | null;
  issueLabel: string | null;
  name: string;
  phone: string;
  address: string;
  date: string;
  timeSlot: string;
};

// ─── Data ────────────────────────────────────────────────────────────────────

const SERVICES: ServiceOption[] = [
  { id: "mobile_repair", label: "Mobile Repair", icon: Smartphone, description: "Doorstep phone repair" },
  { id: "laptop_repair", label: "Laptop Repair", icon: Laptop, description: "Laptop repair & diagnostics" },
  { id: "screen_guard", label: "Screen Guard", icon: Shield, description: "Premium screen protection" },
  { id: "sell_device", label: "Sell Device", icon: Phone, description: "Sell for instant cash" },
  { id: "cctv", label: "CCTV Installation", icon: Camera, description: "CCTV setup & repair" },
  { id: "desktop_assembly", label: "Desktop Assembly", icon: Monitor, description: "Custom PC build" },
  { id: "it_support", label: "IT Support", icon: Wrench, description: "On-site IT help" },
  { id: "managed_it", label: "Managed IT", icon: Building2, description: "Business IT management" },
  { id: "wifi_network", label: "WiFi / Networking", icon: Wifi, description: "WiFi & network setup" },
];

const DEVICES: Record<string, DeviceOption[]> = {
  mobile_repair: [
    { id: "iphone", label: "iPhone" },
    { id: "samsung", label: "Samsung" },
    { id: "oneplus", label: "OnePlus" },
    { id: "xiaomi", label: "Xiaomi / Redmi" },
    { id: "vivo", label: "Vivo" },
    { id: "oppo", label: "OPPO" },
    { id: "realme", label: "Realme" },
    { id: "google", label: "Google Pixel" },
    { id: "nothing", label: "Nothing" },
    { id: "motorola", label: "Motorola" },
    { id: "other_mobile", label: "Other Brand" },
  ],
  laptop_repair: [
    { id: "macbook", label: "MacBook" },
    { id: "dell", label: "Dell" },
    { id: "hp", label: "HP" },
    { id: "lenovo", label: "Lenovo" },
    { id: "asus", label: "ASUS" },
    { id: "acer", label: "Acer" },
    { id: "msi", label: "MSI" },
    { id: "other_laptop", label: "Other Brand" },
  ],
  screen_guard: [
    { id: "iphone", label: "iPhone" },
    { id: "samsung", label: "Samsung" },
    { id: "oneplus", label: "OnePlus" },
    { id: "xiaomi", label: "Xiaomi / Redmi" },
    { id: "other_mobile", label: "Other Brand" },
  ],
  sell_device: [
    { id: "mobile", label: "Mobile Phone" },
    { id: "laptop", label: "Laptop" },
    { id: "tablet", label: "Tablet" },
    { id: "smartwatch", label: "Smartwatch" },
    { id: "earphones", label: "Earphones / Audio" },
  ],
  cctv: [
    { id: "new_install", label: "New Installation" },
    { id: "repair", label: "Repair / Service" },
    { id: "upgrade", label: "Upgrade Existing" },
    { id: "amc", label: "AMC (Annual Maintenance)" },
  ],
  desktop_assembly: [
    { id: "new_build", label: "New PC Build" },
    { id: "upgrade", label: "Upgrade Existing PC" },
    { id: "troubleshoot", label: "Troubleshooting" },
  ],
  it_support: [
    { id: "home", label: "Home Setup" },
    { id: "office", label: "Office Support" },
    { id: "remote", label: "Remote Assistance" },
  ],
  managed_it: [
    { id: "small_business", label: "Small Business" },
    { id: "enterprise", label: "Enterprise" },
    { id: "startup", label: "Startup" },
  ],
  wifi_network: [
    { id: "home_wifi", label: "Home WiFi Setup" },
    { id: "office_network", label: "Office Network" },
    { id: "mesh_setup", label: "Mesh WiFi System" },
  ],
};

const ISSUES: Record<string, IssueOption[]> = {
  mobile_repair: [
    { id: "screen_repair", label: "Screen Replacement" },
    { id: "battery", label: "Battery Replacement" },
    { id: "charging_port", label: "Charging Port Issue" },
    { id: "speaker", label: "Speaker / Mic Issue" },
    { id: "camera", label: "Camera Not Working" },
    { id: "software", label: "Software / Hang Issue" },
    { id: "water_damage", label: "Water Damage" },
    { id: "back_panel", label: "Back Panel Replacement" },
    { id: "other", label: "Other Issue" },
  ],
  laptop_repair: [
    { id: "screen", label: "Screen Replacement" },
    { id: "keyboard", label: "Keyboard Replacement" },
    { id: "battery", label: "Battery Issue" },
    { id: "hinge", label: "Hinge Repair" },
    { id: "motherboard", label: "Motherboard Issue" },
    { id: "not_turning_on", label: "Not Turning On" },
    { id: "slow", label: "Running Slow" },
    { id: "other", label: "Other Issue" },
  ],
  screen_guard: [
    { id: "tempered", label: "Tempered Glass" },
    { id: "matte", label: "Matte Finish" },
    { id: "privacy", label: "Privacy Guard" },
    { id: "camera_guard", label: "Camera Lens Guard" },
  ],
};

const TIME_SLOTS = ["8 AM - 11 AM", "11 AM - 2 PM", "2 PM - 5 PM", "5 PM - 8 PM"];


// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNextDays(count: number): { value: string; label: string }[] {
  const days: { value: string; label: string }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const value = d.toISOString().split("T")[0];
    const label =
      i === 0
        ? "Today"
        : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    days.push({ value, label });
  }
  return days;
}

function buildWhatsAppMessage(state: BookingState): string {
  const lines: string[] = [
    `Hi Looplic, I want to book a service.`,
    ``,
    `🔧 Service: ${state.serviceLabel}`,
  ];

  if (state.deviceLabel) lines.push(`📱 Device/Type: ${state.deviceLabel}`);
  if (state.issueLabel) lines.push(`⚙️ Issue: ${state.issueLabel}`);
  if (state.name) lines.push(`👤 Name: ${state.name}`);
  if (state.phone) lines.push(`📞 Phone: ${state.phone}`);
  if (state.address) lines.push(`📍 Address: ${state.address}`);
  if (state.date) {
    const dateLabel = getNextDays(7).find((d) => d.value === state.date)?.label || state.date;
    lines.push(`📅 Date: ${dateLabel}`);
  }
  if (state.timeSlot) lines.push(`🕐 Time: ${state.timeSlot}`);

  lines.push(``, `Please confirm my booking. Thank you!`);
  return lines.join("\n");
}

function getSteps(serviceId: string | null): Step[] {
  if (!serviceId) return ["service"];
  const hasDevice = !!DEVICES[serviceId];
  const hasIssue = !!ISSUES[serviceId];
  const steps: Step[] = ["service"];
  if (hasDevice) steps.push("device");
  if (hasIssue) steps.push("issue");
  steps.push("details", "schedule", "confirm");
  return steps;
}


// ─── Component ───────────────────────────────────────────────────────────────

export function WhatsAppBookingWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("service");
  const [booking, setBooking] = useState<BookingState>({
    service: null,
    serviceLabel: null,
    device: null,
    deviceLabel: null,
    issue: null,
    issueLabel: null,
    name: "",
    phone: "",
    address: "",
    date: "",
    timeSlot: "",
  });

  const steps = getSteps(booking.service);
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const goNext = useCallback(() => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < steps.length) setCurrentStep(steps[nextIdx]);
  }, [currentStepIndex, steps]);

  const goBack = useCallback(() => {
    const prevIdx = currentStepIndex - 1;
    if (prevIdx >= 0) setCurrentStep(steps[prevIdx]);
  }, [currentStepIndex, steps]);

  const resetWizard = useCallback(() => {
    setCurrentStep("service");
    setBooking({
      service: null, serviceLabel: null,
      device: null, deviceLabel: null,
      issue: null, issueLabel: null,
      name: "", phone: "", address: "", date: "", timeSlot: "",
    });
  }, []);

  const selectService = (svc: ServiceOption) => {
    setBooking((prev) => ({
      ...prev,
      service: svc.id,
      serviceLabel: svc.label,
      device: null, deviceLabel: null,
      issue: null, issueLabel: null,
    }));
    const nextSteps = getSteps(svc.id);
    setCurrentStep(nextSteps[1] || "details");
  };

  const selectDevice = (dev: DeviceOption) => {
    setBooking((prev) => ({ ...prev, device: dev.id, deviceLabel: dev.label }));
    goNext();
  };

  const selectIssue = (iss: IssueOption) => {
    setBooking((prev) => ({ ...prev, issue: iss.id, issueLabel: iss.label }));
    goNext();
  };

  const openWhatsApp = () => {
    const message = buildWhatsAppMessage(booking);
    const url = `https://wa.me/91${whatsappPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setIsOpen(false);
    resetWizard();
  };

  return (
    <>
      {/* Floating WhatsApp Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-white shadow-2xl transition-all hover:scale-105 hover:shadow-green-300/40 active:scale-100"
        aria-label="Book via WhatsApp"
      >
        <MessageCircle className="size-6 fill-white" />
        <span className="hidden text-sm font-bold sm:inline">Book on WhatsApp</span>
      </button>

      {/* Wizard Modal */}
      {isOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
            onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
          >
            <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl sm:max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between bg-[#25D366] px-5 py-4">
                <div className="flex items-center gap-3">
                  <MessageCircle className="size-6 text-white fill-white" />
                  <div>
                    <h3 className="text-base font-bold text-white">Book via WhatsApp</h3>
                    <p className="text-xs text-white/80">Step {currentStepIndex + 1} of {steps.length}</p>
                  </div>
                </div>
                <button onClick={() => { setIsOpen(false); resetWizard(); }} className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="h-1 w-full bg-gray-100">
                <div className="h-full bg-[#25D366] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>

              {/* Content */}
              <div className="max-h-[60vh] overflow-y-auto p-5 sm:max-h-[65vh]">
                {currentStep === "service" && (
                  <StepService services={SERVICES} onSelect={selectService} />
                )}
                {currentStep === "device" && booking.service && (
                  <StepDevice devices={DEVICES[booking.service] || []} onSelect={selectDevice} />
                )}
                {currentStep === "issue" && booking.service && (
                  <StepIssue issues={ISSUES[booking.service] || []} onSelect={selectIssue} />
                )}
                {currentStep === "details" && (
                  <StepDetails booking={booking} setBooking={setBooking} onNext={goNext} />
                )}
                {currentStep === "schedule" && (
                  <StepSchedule booking={booking} setBooking={setBooking} onNext={goNext} />
                )}
                {currentStep === "confirm" && (
                  <StepConfirm booking={booking} onConfirm={openWhatsApp} />
                )}
              </div>

              {/* Footer navigation */}
              {currentStepIndex > 0 && currentStep !== "confirm" && (
                <div className="border-t border-gray-100 px-5 py-3">
                  <button onClick={goBack} className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800">
                    <ChevronLeft className="size-4" /> Back
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
    </>
  );
}


// ─── Step Sub-Components ─────────────────────────────────────────────────────

function StepService({ services, onSelect }: { services: ServiceOption[]; onSelect: (s: ServiceOption) => void }) {
  return (
    <div>
      <h4 className="mb-1 text-lg font-bold text-gray-900">Choose a Service</h4>
      <p className="mb-4 text-sm text-gray-500">What do you need help with?</p>
      <div className="grid grid-cols-1 gap-2">
        {services.map((svc) => {
          const Icon = svc.icon;
          return (
            <button
              key={svc.id}
              onClick={() => onSelect(svc)}
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-3.5 text-left transition-all hover:border-[#25D366] hover:bg-green-50/50 hover:shadow-sm active:scale-[0.98]"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-[#25D366]">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{svc.label}</p>
                <p className="text-xs text-gray-500">{svc.description}</p>
              </div>
              <ChevronRight className="ml-auto size-4 text-gray-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDevice({ devices, onSelect }: { devices: DeviceOption[]; onSelect: (d: DeviceOption) => void }) {
  return (
    <div>
      <h4 className="mb-1 text-lg font-bold text-gray-900">Select Device / Type</h4>
      <p className="mb-4 text-sm text-gray-500">Choose your device brand or type</p>
      <div className="grid grid-cols-2 gap-2">
        {devices.map((dev) => (
          <button
            key={dev.id}
            onClick={() => onSelect(dev)}
            className="rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-800 transition-all hover:border-[#25D366] hover:bg-green-50/50 hover:shadow-sm active:scale-[0.98]"
          >
            {dev.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepIssue({ issues, onSelect }: { issues: IssueOption[]; onSelect: (i: IssueOption) => void }) {
  return (
    <div>
      <h4 className="mb-1 text-lg font-bold text-gray-900">What&apos;s the Issue?</h4>
      <p className="mb-4 text-sm text-gray-500">Select the problem you&apos;re facing</p>
      <div className="grid grid-cols-1 gap-2">
        {issues.map((iss) => (
          <button
            key={iss.id}
            onClick={() => onSelect(iss)}
            className="rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-800 transition-all hover:border-[#25D366] hover:bg-green-50/50 hover:shadow-sm active:scale-[0.98]"
          >
            {iss.label}
          </button>
        ))}
      </div>
    </div>
  );
}


function StepDetails({
  booking,
  setBooking,
  onNext,
}: {
  booking: BookingState;
  setBooking: React.Dispatch<React.SetStateAction<BookingState>>;
  onNext: () => void;
}) {
  const canProceed = booking.name.trim() && booking.phone.trim().length >= 10 && booking.address.trim();

  return (
    <div>
      <h4 className="mb-1 text-lg font-bold text-gray-900">Your Details</h4>
      <p className="mb-4 text-sm text-gray-500">We need some info to schedule your service</p>
      <div className="space-y-3">
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <User className="size-3.5" /> Full Name
          </label>
          <input
            type="text"
            value={booking.name}
            onChange={(e) => setBooking((p) => ({ ...p, name: e.target.value }))}
            placeholder="Your full name"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]/30"
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <Phone className="size-3.5" /> Phone Number
          </label>
          <input
            type="tel"
            value={booking.phone}
            onChange={(e) => setBooking((p) => ({ ...p, phone: e.target.value }))}
            placeholder="10-digit mobile number"
            maxLength={10}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]/30"
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <MapPin className="size-3.5" /> Address
          </label>
          <textarea
            value={booking.address}
            onChange={(e) => setBooking((p) => ({ ...p, address: e.target.value }))}
            placeholder="Full address for doorstep service"
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]/30 resize-none"
          />
        </div>
      </div>
      <button
        onClick={onNext}
        disabled={!canProceed}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow transition-all hover:bg-[#20bd5a] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

function StepSchedule({
  booking,
  setBooking,
  onNext,
}: {
  booking: BookingState;
  setBooking: React.Dispatch<React.SetStateAction<BookingState>>;
  onNext: () => void;
}) {
  const days = getNextDays(7);
  const canProceed = booking.date && booking.timeSlot;

  return (
    <div>
      <h4 className="mb-1 text-lg font-bold text-gray-900">Pick a Date & Time</h4>
      <p className="mb-4 text-sm text-gray-500">When would you like us to come?</p>

      <div className="mb-4">
        <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <Clock className="size-3.5" /> Select Date
        </label>
        <div className="flex flex-wrap gap-2">
          {days.map((day) => (
            <button
              key={day.value}
              onClick={() => setBooking((p) => ({ ...p, date: day.value }))}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                booking.date === day.value
                  ? "border-[#25D366] bg-green-50 text-[#25D366]"
                  : "border-gray-200 text-gray-700 hover:border-[#25D366]/50"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <Clock className="size-3.5" /> Select Time Slot
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              onClick={() => setBooking((p) => ({ ...p, timeSlot: slot }))}
              className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${
                booking.timeSlot === slot
                  ? "border-[#25D366] bg-green-50 text-[#25D366]"
                  : "border-gray-200 text-gray-700 hover:border-[#25D366]/50"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow transition-all hover:bg-[#20bd5a] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Review Booking <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

function StepConfirm({ booking, onConfirm }: { booking: BookingState; onConfirm: () => void }) {
  const days = getNextDays(7);
  const dateLabel = days.find((d) => d.value === booking.date)?.label || booking.date;

  return (
    <div>
      <h4 className="mb-1 text-lg font-bold text-gray-900">Confirm & Book</h4>
      <p className="mb-4 text-sm text-gray-500">Review your booking details</p>

      <div className="space-y-2.5 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <SummaryRow label="Service" value={booking.serviceLabel || ""} />
        {booking.deviceLabel && <SummaryRow label="Device/Type" value={booking.deviceLabel} />}
        {booking.issueLabel && <SummaryRow label="Issue" value={booking.issueLabel} />}
        <SummaryRow label="Name" value={booking.name} />
        <SummaryRow label="Phone" value={booking.phone} />
        <SummaryRow label="Address" value={booking.address} />
        <SummaryRow label="Date" value={dateLabel} />
        <SummaryRow label="Time" value={booking.timeSlot} />
      </div>

      <button
        onClick={onConfirm}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-[#20bd5a] hover:scale-[1.02] active:scale-100"
      >
        <MessageCircle className="size-5 fill-white" />
        Send on WhatsApp
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">
        This will open WhatsApp with your booking details pre-filled
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs text-gray-500">{label}</span>
      <span className="text-right text-xs font-semibold text-gray-900">{value}</span>
    </div>
  );
}
