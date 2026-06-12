"use client";

import { Check, ChevronRight, Hash, Loader2, MapPin, Phone, Shield, User, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type {
  CatalogBrand,
  CatalogModel,
  CatalogSeries,
  ModelScreenGuard,
  RepairCategory,
  RepairSubcategory,
} from "@/src/lib/data/catalog";
import { buildBookingInsert, isMissingBookingCodeColumnError, isValidPhoneNumber, isValidPincode } from "@/src/lib/bookings";
import { buildThankYouHref, trackGoogleAdsConversion } from "@/src/lib/gtag";
import { downloadBookingConfirmationPdf } from "@/src/lib/invoice-pdf";
import { notifyLeadSubmission } from "@/src/lib/leads/client";
import { createClient } from "@/src/lib/data-client/client";
import { RepairWarrantyTag } from "@/src/components/next/RepairWarrantyTag";

type BookingClientPageProps = {
  brand: CatalogBrand;
  series: CatalogSeries;
  model: CatalogModel;
  basePath: string;
  isRepair: boolean;
  repairServiceType?: "mobile" | "laptop";
  guards: ModelScreenGuard[];
  repairCategories: RepairCategory[];
  repairSubcategories: RepairSubcategory[];
};

const guardIcons: Record<string, string> = {
  "Privacy Guard": "Privacy",
  Privacy: "Privacy",
  "Matte Guard": "Matte",
  Matte: "Matte",
  "UV Glass": "UV",
  "Ceramic Guard": "Ceramic",
  "11D": "Shield",
};

function displayGuardType(guardType: string) {
  const parts = guardType.split(" - ");
  return parts.length > 1 ? parts.slice(1).join(" - ") : guardType;
}

export function BookingClientPage({
  brand,
  series,
  model,
  basePath,
  isRepair,
  repairServiceType,
  guards,
  repairCategories,
  repairSubcategories,
}: BookingClientPageProps) {
  const router = useRouter();
  const [selectedGuard, setSelectedGuard] = useState<ModelScreenGuard | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<RepairSubcategory | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);

  const supabase = createClient();

  const visibleSubcategories = selectedCategoryId
    ? repairSubcategories.filter((subcategory) => subcategory.category_id === selectedCategoryId)
    : [];

  const selectedItemLabel = isRepair
    ? selectedSubcategory?.name || ""
    : displayGuardType(selectedGuard?.guard_type || "");
  const selectedPrice = isRepair ? selectedSubcategory?.price : selectedGuard?.price;
  const selectedPriceVisible = !isRepair || selectedSubcategory?.price_visible !== false;

  async function handleBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !phone.trim()) {
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!isValidPincode(pincode)) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }

    if (!selectedPrice) {
      toast.error("Please choose a service first");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const insertData = buildBookingInsert({
      customerName: name,
      customerPhone: phone,
      modelId: model.id,
      address,
      city,
      pincode,
      serviceType: isRepair ? `${repairServiceType}_repair` : "screen_guard",
      userId: user?.id || null,
      repairCategoryId: isRepair ? selectedCategoryId : null,
      repairSubcategoryId: isRepair ? selectedSubcategory?.id ?? null : null,
      guardType: !isRepair ? selectedGuard?.guard_type ?? null : null,
    });

    const bookingInsert = await supabase.from("bookings").insert(insertData).select("booking_code").single();
    const bookingCode = bookingInsert.data?.booking_code || "";

    if (bookingInsert.error && isMissingBookingCodeColumnError(bookingInsert.error)) {
      const fallbackInsert = await supabase.from("bookings").insert(insertData);
      if (fallbackInsert.error) {
        toast.error("Booking failed. Please try again.");
        setSubmitting(false);
        return;
      }
    } else if (bookingInsert.error) {
      toast.error("Booking failed. Please try again.");
      setSubmitting(false);
      return;
    }

    void notifyLeadSubmission({
      source: "booking",
      title: "New Looplic booking",
      customer: { name, phone, email: user?.email },
      service: {
        type: isRepair ? `${repairServiceType}_repair` : "screen_guard",
        label: selectedItemLabel,
        price: selectedPrice,
      },
      device: {
        brand: brand.name,
        series: series.name,
        model: model.name,
      },
      address,
      city,
      pincode,
      metadata: {
        flow: "BookingClientPage",
        repairCategoryId: isRepair ? selectedCategoryId : undefined,
        repairSubcategoryId: isRepair ? selectedSubcategory?.id : undefined,
        guardType: !isRepair ? selectedGuard?.guard_type : undefined,
      },
    });

    downloadBookingConfirmationPdf({
      bookingCode,
      customerName: name,
      customerPhone: phone,
      serviceType: isRepair ? `${repairServiceType}_repair` : "screen_guard",
      serviceLabel: selectedItemLabel,
      price: selectedPrice,
      brand: brand.name,
      series: series.name,
      model: model.name,
      address,
      city,
      pincode,
    });

    toast.success("Booking confirmed!");
    trackGoogleAdsConversion("booking_form_submit", {
      lead_type: "booking",
      source: "model_booking_form",
      booking_code: bookingCode,
      service_type: isRepair ? `${repairServiceType}_repair` : "screen_guard",
      value: Number(selectedPrice || 0),
      currency: "INR",
    });
    setBooked(true);
    setSubmitting(false);
    router.push(buildThankYouHref({ type: "booking", source: "model_booking_form", booking_code: bookingCode, service_type: isRepair ? `${repairServiceType}_repair` : "screen_guard" }));
  }

  if (booked) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full gradient-brand">
            <Check className="size-8 text-primary-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Booking Confirmed!</h2>
          <p className="mb-1 text-sm text-muted-foreground">
            {selectedItemLabel} for <strong>{model.name}</strong>
          </p>
          <p className="mb-6 text-xs text-muted-foreground">
            We'll contact you at <strong>{phone}</strong> to confirm your slot.
          </p>
          <Link href="/" className="inline-block rounded-2xl gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="container py-6">
        <div className="mb-5 flex flex-wrap items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-3" />
          <Link href={`${basePath}/brands`} className="transition-colors hover:text-foreground">
            Brands
          </Link>
          <ChevronRight className="size-3" />
          <Link href={`${basePath}/brands/${brand.slug}`} className="transition-colors hover:text-foreground">
            {brand.name}
          </Link>
          <ChevronRight className="size-3" />
          <Link href={`${basePath}/brands/${brand.slug}/${series.slug}`} className="transition-colors hover:text-foreground">
            {series.name}
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{model.name}</span>
        </div>

        <h1 className="mb-1 text-xl font-semibold text-foreground">
          {isRepair ? "Choose Repair Service" : "Choose Service"}
        </h1>
        <p className="mb-5 text-xs text-muted-foreground">
          for <span className="font-bold text-foreground">{brand.name} {model.name}</span>
        </p>

        {isRepair ? (
          <>
            {repairCategories.length === 0 ? (
              <div className="py-16 text-center">
                <Wrench className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                <p className="text-sm font-semibold text-muted-foreground">No repair services available</p>
              </div>
            ) : (
              <>
                <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {repairCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        setSelectedSubcategory(null);
                      }}
                      className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                        selectedCategoryId === category.id
                          ? "border-primary bg-primary/5 shadow-elevated-brand"
                          : "border-border bg-card shadow-card-brand hover:border-primary/30"
                      }`}
                    >
                      {category.image_url ? (
                        <img src={category.image_url} alt={category.name} className="size-10 rounded-xl object-contain" />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                          <Wrench className="size-5 text-primary" />
                        </div>
                      )}
                      <span className="text-center text-xs font-bold text-foreground">{category.name}</span>
                    </button>
                  ))}
                </div>

                {selectedCategoryId ? (
                  <div className="mb-6 space-y-2.5">
                    <h3 className="text-sm font-semibold text-foreground">Select Service</h3>
                    {visibleSubcategories.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">No services available in this category</p>
                    ) : (
                      visibleSubcategories.map((subcategory) => {
                        const isSelected = selectedSubcategory?.id === subcategory.id;
                        return (
                          <button
                            key={subcategory.id}
                            onClick={() => setSelectedSubcategory(subcategory)}
                            className={`flex w-full items-center gap-3 rounded-3xl border p-4 text-left transition-all ${
                              isSelected
                                ? "border-primary bg-primary/5 shadow-elevated-brand ring-2 ring-primary/10"
                                : "border-border/80 bg-card shadow-card-brand hover:-translate-y-0.5 hover:border-primary/30"
                            }`}
                          >
                            {subcategory.image_url ? (
                              <img src={subcategory.image_url} alt={subcategory.name} className="size-10 rounded-xl object-contain" />
                            ) : (
                              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                                <Wrench className="size-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <span className="block text-sm font-bold text-foreground">{subcategory.name}</span>
                              <RepairWarrantyTag subcategoryName={subcategory.name} className="mt-2" />
                            </div>
                          {subcategory.price_visible !== false ? (
                            <div className="text-right">
                              <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                Starts from
                              </span>
                              <span className="text-lg font-extrabold gradient-brand-text">Rs. {subcategory.price}</span>
                            </div>
                          ) : null}
                        </button>
                      );
                    })
                    )}
                  </div>
                ) : null}
              </>
            )}
          </>
        ) : guards.length === 0 ? (
          <div className="py-16 text-center">
            <Shield className="mx-auto mb-3 size-10 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-muted-foreground">No services available for this model</p>
            <p className="mt-1 text-xs text-muted-foreground">Check back soon!</p>
          </div>
        ) : (
          <div className="mb-6 space-y-2.5">
            {guards.map((guard) => {
              const isSelected = selectedGuard?.id === guard.id;
              const label = displayGuardType(guard.guard_type);
              return (
                <button
                  key={guard.id}
                  onClick={() => setSelectedGuard(guard)}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-elevated-brand"
                      : "border-border bg-card shadow-card-brand hover:border-primary/30"
                  }`}
                >
                  {guard.image_url ? <img src={guard.image_url} alt={label} className="size-11 rounded-2xl object-contain border border-border/70 bg-background p-1.5" /> : <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-secondary text-sm font-bold text-primary">{guardIcons[label] || "Shield"}</div>}
                  <div className="flex-1">
                    <span className="text-sm font-bold text-foreground">{label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold gradient-brand-text">Rs. {guard.price}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {(isRepair ? selectedSubcategory : selectedGuard) ? (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-elevated-brand">
            <h3 className="mb-1 text-sm font-semibold text-foreground">Book {isRepair ? "Repair" : "Installation"}</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              {selectedItemLabel}
              {selectedPriceVisible ? <> - <span className="font-bold text-primary">Rs. {selectedPrice}</span></> : null}
            </p>
            {isRepair ? <RepairWarrantyTag subcategoryName={selectedItemLabel} className="mb-4" /> : null}

            <form onSubmit={handleBook} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={100}
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  maxLength={15}
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  required
                  maxLength={200}
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  required
                  maxLength={80}
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(event) => setPincode(event.target.value)}
                  required
                  maxLength={10}
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !name.trim() || !phone.trim() || !address.trim() || !city.trim() || !isValidPincode(pincode)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {submitting ? "Booking..." : selectedPriceVisible ? `Book Now - Rs. ${selectedPrice}` : "Book Now"}
              </button>
            </form>

            <p className="mt-3 text-center text-[10px] text-muted-foreground">
              {isRepair ? "Professional repair at your doorstep" : "Free doorstep installation - No-bubble guarantee"}
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
