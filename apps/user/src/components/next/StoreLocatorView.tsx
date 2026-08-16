"use client";

import { Clock, ExternalLink, MapPin, Navigation, Phone, Star } from "lucide-react";

import { HomepageNavbar } from "@/src/components/next/HomepageNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";

const STORE = {
  name: "Looplic Store - Nagarathpete, Bangalore",
  address: "1st Floor, Shawkat Building, SJP Road, opp. Dasappa Hospital, near Town Hall, Dodpete, Nagarathpete, Bengaluru, Karnataka",
  pincode: "560002",
  phone: "+91 88844 45924",
  hours: {
    weekdays: "Monday – Saturday: 10:00 AM – 8:00 PM",
    sunday: "Sunday: Closed",
  },
  services: ["Sell Old Phone", "Buy Refurbished Phone", "Mobile Repair", "Laptop Repair", "Screen Guard", "CCTV Installation", "IT Support"],
  lat: 12.9632,
  lng: 77.5784,
  googleMapsUrl: "https://maps.google.com/?q=1st+Floor+Shawkat+Building+SJP+Road+Nagarathpete+Bengaluru+560002",
  googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.023!2d77.5762!3d12.9632!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sSJP+Road+Nagarathpete+Bengaluru!5e0!3m2!1sen!2sin!4v1690000000000!5m2!1sen!2sin",
  landmarks: ["Opposite Dasappa Hospital", "Near Town Hall", "SJP Road, Dodpete"],
};

export function StoreLocatorView() {
  return (
    <div className="min-h-screen bg-white">
      <HomepageNavbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-green-100">
            <MapPin className="size-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Visit Our Store</h1>
          <p className="mt-3 text-base text-gray-600">
            Walk in for instant device evaluation, sell your old phone, buy refurbished devices, or get doorstep repair booked.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">

          {/* Left: Store Details */}
          <div className="space-y-6">
            {/* Store Name Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-green-100">
                  <MapPin className="size-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Looplic Store</h2>
                  <p className="text-sm text-gray-500">Nagarathpete, Bangalore</p>
                </div>
              </div>

              {/* Address */}
              <div className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Address</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">
                  {STORE.address}
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">Pincode: {STORE.pincode}</p>
              </div>

              {/* Landmarks */}
              <div className="mt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Landmarks</h3>
                <ul className="mt-2 space-y-1">
                  {STORE.landmarks.map((landmark) => (
                    <li key={landmark} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="size-1.5 rounded-full bg-green-500" />
                      {landmark}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Timing Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100">
                  <Clock className="size-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Store Timings</h3>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-2.5">
                  <span className="text-sm font-medium text-gray-700">{STORE.hours.weekdays}</span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">OPEN</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-2.5">
                  <span className="text-sm font-medium text-gray-700">{STORE.hours.sunday}</span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">CLOSED</span>
                </div>
              </div>
            </div>

            {/* Contact Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100">
                  <Phone className="size-5 text-purple-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Contact</h3>
              </div>
              <div className="mt-4">
                <a
                  href={`tel:${STORE.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-3 rounded-xl bg-green-600 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-700"
                >
                  <Phone className="size-4" />
                  Call Store: {STORE.phone}
                </a>
                <p className="mt-3 text-xs text-gray-500">Call us for any queries about sell/buy/repair services</p>
              </div>
            </div>

            {/* Services Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900">Services Available</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {STORE.services.map((service) => (
                  <span
                    key={service}
                    className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={STORE.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
              >
                <Navigation className="size-4" />
                Get Directions
              </a>
              <a
                href={`tel:${STORE.phone.replace(/\s/g, "")}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-green-600 px-5 py-3.5 text-sm font-bold text-green-600 transition-colors hover:bg-green-50"
              >
                <Phone className="size-4" />
                Call Now
              </a>
            </div>
          </div>

          {/* Right: Google Map */}
          <div className="space-y-4">
            {/* Map Embed */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <iframe
                src={`https://maps.google.com/maps?q=${STORE.lat},${STORE.lng}&z=16&output=embed`}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Looplic Store Location"
                className="w-full"
              />
            </div>

            {/* Open in Google Maps link */}
            <a
              href={STORE.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ExternalLink className="size-4" />
              Open in Google Maps
            </a>

            {/* Visit Info Box */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-sm font-bold text-amber-900">How to Reach Us</h3>
              <ul className="mt-3 space-y-2 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                  Located on <strong>SJP Road</strong> (Sayyaji Rao Road), a major road in the Nagarathpete market area
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                  Directly <strong>opposite Dasappa Hospital</strong> — look for "Shawkat Building" on the 1st floor
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                  <strong>Near Town Hall</strong> — 5 min walk from Town Hall / Kempegowda Bus Station
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                  Nearest Metro: <strong>KR Market Metro Station</strong> (Purple Line)
                </li>
              </ul>
            </div>

            {/* Customer Review */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-900">4.7</span>
                <span className="text-xs text-gray-500">Google Rating</span>
              </div>
              <p className="mt-3 text-sm text-gray-600 italic">
                "Great service! Sold my old Samsung phone and got a fair price instantly. The staff was very professional and payment was immediate."
              </p>
              <p className="mt-2 text-xs font-medium text-gray-500">— Recent Google Review</p>
            </div>
          </div>
        </div>
      </section>

      <HomepageFooter />
    </div>
  );
}
