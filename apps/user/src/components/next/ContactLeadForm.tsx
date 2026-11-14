"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mail, MessageSquare, Phone, Send, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { buildThankYouHref, trackGoogleAdsConversion } from "@/src/lib/gtag";
import { notifyLeadSubmission } from "@/src/lib/leads/client";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+() -]{10,20}$/, "Please enter a valid 10-digit phone number"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .or(z.literal("")),
  message: z.string().trim().min(5, "Message must be at least 5 characters").max(1000, "Message is too long"),
  website_hp: z.string().max(0, "Bot detected"),
});

export function ContactLeadForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const mountTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    mountTimeRef.current = Date.now();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    // 1. Anti-spam velocity check (submissions faster than 1.2s are automated bots)
    const elapsedMs = Date.now() - mountTimeRef.current;
    if (elapsedMs < 1200) {
      toast.success("Enquiry received.");
      return;
    }

    // 2. Validate form input via Zod schema
    const parseResult = contactSchema.safeParse({
      name,
      phone,
      email: email.trim(),
      message,
      website_hp: honeypot,
    });

    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string" && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      // Honeypot tripped: silently fail
      if (fieldErrors.website_hp) {
        toast.success("Enquiry received.");
        return;
      }
      toast.error(Object.values(fieldErrors)[0] || "Please check the form fields.");
      return;
    }

    setSubmitting(true);
    const sent = await notifyLeadSubmission({
      source: "contact",
      title: "New Looplic contact enquiry",
      customer: {
        name: parseResult.data.name,
        phone: parseResult.data.phone,
        email: parseResult.data.email || undefined,
      },
      notes: parseResult.data.message,
      metadata: {
        flow: "ContactLeadForm",
        hp: honeypot,
      },
    });
    setSubmitting(false);

    if (!sent) {
      toast.error("Unable to send enquiry right now. Please call or WhatsApp us.");
      return;
    }

    setName("");
    setPhone("");
    setEmail("");
    setMessage("");
    setHoneypot("");

    // Track conversion in Google Ads and GA4 without PII
    trackGoogleAdsConversion("contact_form_submit", {
      lead_type: "contact",
      source: "contact_form",
    });

    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "generate_lead", {
        event_category: "engagement",
        event_label: "contact_form",
      });
    }

    toast.success("Thanks. Your enquiry has been sent.");
    router.push(buildThankYouHref({ type: "contact", source: "contact_form" }));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">Send an enquiry</h2>
      <div className="mt-5 grid gap-3">
        {/* Anti-spam Honeypot Field */}
        <input
          type="text"
          name="website_hp"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] top-auto h-0 w-0 opacity-0"
        />

        {/* Name input */}
        <div className="relative">
          <label htmlFor="contact-name" className="sr-only">Your Name</label>
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="Your name *"
            maxLength={100}
            required
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
              errors.name ? "border-rose-500 focus:ring-rose-400/50" : "border-border focus:ring-primary/50"
            }`}
          />
          {errors.name && (
            <p id="name-error" role="alert" className="mt-1 text-xs font-semibold text-rose-600">
              {errors.name}
            </p>
          )}
        </div>

        {/* Phone input */}
        <div className="relative">
          <label htmlFor="contact-phone" className="sr-only">Phone Number</label>
          <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="contact-phone"
            type="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
            }}
            placeholder="Phone number (10 digits) *"
            maxLength={15}
            required
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
              errors.phone ? "border-rose-500 focus:ring-rose-400/50" : "border-border focus:ring-primary/50"
            }`}
          />
          {errors.phone && (
            <p id="phone-error" role="alert" className="mt-1 text-xs font-semibold text-rose-600">
              {errors.phone}
            </p>
          )}
        </div>

        {/* Email input (optional) */}
        <div className="relative">
          <label htmlFor="contact-email" className="sr-only">Email Address</label>
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
            }}
            placeholder="Email address (optional)"
            maxLength={160}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
              errors.email ? "border-rose-500 focus:ring-rose-400/50" : "border-border focus:ring-primary/50"
            }`}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="mt-1 text-xs font-semibold text-rose-600">
              {errors.email}
            </p>
          )}
        </div>

        {/* Message input */}
        <div className="relative">
          <label htmlFor="contact-message" className="sr-only">Message</label>
          <MessageSquare className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <textarea
            id="contact-message"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              if (errors.message) setErrors((prev) => ({ ...prev, message: "" }));
            }}
            placeholder="What do you need help with? *"
            rows={4}
            maxLength={800}
            required
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "message-error" : undefined}
            className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
              errors.message ? "border-rose-500 focus:ring-rose-400/50" : "border-border focus:ring-primary/50"
            }`}
          />
          {errors.message && (
            <p id="message-error" role="alert" className="mt-1 text-xs font-semibold text-rose-600">
              {errors.message}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {submitting ? "Sending..." : "Send enquiry"}
      </button>
    </form>
  );
}
