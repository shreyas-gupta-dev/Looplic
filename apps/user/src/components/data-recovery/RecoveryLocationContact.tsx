"use client";

import { useState } from "react";
import {
  MapPin,
  Phone,
  MessageSquare,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";
import { LAB_CONTACT } from "./recovery-data";

export function RecoveryLocationContact() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Price & Quote Inquiry");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    // Direct WhatsApp fallback / mailto
    const text = `Hi Looplic Data Recovery, my name is ${name} (${phone}). Topic: ${topic}. Message: ${message}`;
    const waUrl = `https://wa.me/${LAB_CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");

    setSending(false);
    setSent(true);
  };

  return (
    <section id="contact" className="scroll-mt-16 bg-slate-50 py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Visit, Call or Message the Lab
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Drop Off Your Device or Speak to an Engineer
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Our central lab is conveniently located in Bengaluru. Drop off your device directly or request free doorstep collection.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ─── Left Column: Location & Contact Info ─────────────────────────── */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h3 className="text-lg font-bold text-slate-900">Lab & Service Centre</h3>

              <div className="mt-5 space-y-4 text-xs text-slate-700">
                <div className="flex items-start gap-3">
                  <MapPin className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-bold">Bengaluru Central Lab:</strong>
                    <span>{LAB_CONTACT.labAddress}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-bold">Operating Hours:</strong>
                    <span>{LAB_CONTACT.workingHours}</span>
                    <span className="block text-emerald-700 font-semibold mt-0.5">{LAB_CONTACT.emergencyLine}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-bold">Phone Hotline:</strong>
                    <a href={`tel:${LAB_CONTACT.phoneClean}`} className="hover:underline font-semibold text-slate-900">
                      {LAB_CONTACT.phoneFormatted}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-bold">Direct WhatsApp:</strong>
                    <a
                      href={`https://wa.me/${LAB_CONTACT.whatsapp}?text=${encodeURIComponent("Hi Looplic Data Recovery, I need guidance for my failed drive.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-semibold hover:underline"
                    >
                      Chat with a lab engineer now →
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-bold">Email Support:</strong>
                    <a href={`mailto:${LAB_CONTACT.email}`} className="text-slate-700 hover:underline">
                      {LAB_CONTACT.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded Google Map */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <iframe
                title="Looplic Data Recovery Lab Location"
                src="https://maps.google.com/maps?q=12.9632,77.5784&z=15&output=embed"
                width="100%"
                height="220"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* ─── Right Column: Quick Contact Form ───────────────────────────── */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h3 className="text-lg font-bold text-slate-900">Send a Direct Question to the Lab</h3>
              <p className="mt-1 text-xs text-slate-600">
                Have a question before booking? Send a message and our engineers will reply shortly.
              </p>

              {sent ? (
                <div className="mt-8 rounded-2xl bg-emerald-50 p-6 text-center border border-emerald-200">
                  <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
                  <h4 className="mt-2 text-base font-bold text-emerald-950">Message Sent!</h4>
                  <p className="mt-1 text-xs text-emerald-800">
                    Your message has been transferred to our WhatsApp recovery desk. We will assist you right away.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="mt-4 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-topic" className="block text-xs font-semibold text-slate-700 mb-1">Topic *</label>
                    <select
                      id="contact-topic"
                      name="topic"
                      aria-label="Contact Topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                    >
                      <option value="Price & Quote Inquiry">Price & Quote Inquiry</option>
                      <option value="Clicking / Mechanical Drive">Clicking / Dropped Hard Drive</option>
                      <option value="MacBook Data Recovery">MacBook Logic Board Recovery</option>
                      <option value="RAID / Enterprise Server">RAID / Server Recovery</option>
                      <option value="Doorstep Pickup Request">Doorstep Pickup Question</option>
                      <option value="Existing Case Question">Existing Case Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">How can we help? *</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe what happened to your drive, capacity, brand, and key files..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                  >
                    <Send className="size-3.5" />
                    <span>Send Message to Engineer Desk</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
