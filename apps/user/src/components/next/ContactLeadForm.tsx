"use client";

import { Loader2, Mail, MessageSquare, Phone, Send, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { buildThankYouHref, trackGoogleAdsConversion } from "@/src/lib/gtag";
import { notifyLeadSubmission } from "@/src/lib/leads/client";

export function ContactLeadForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !message.trim() || (!phone.trim() && !email.trim())) {
      toast.error("Please share your name, message, and either phone or email.");
      return;
    }

    setSubmitting(true);
    const sent = await notifyLeadSubmission({
      source: "contact",
      title: "New Looplic contact enquiry",
      customer: {
        name,
        phone,
        email,
      },
      notes: message,
      metadata: {
        flow: "ContactLeadForm",
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
    trackGoogleAdsConversion("contact_form_submit", {
      lead_type: "contact",
      source: "contact_form",
    });
    toast.success("Thanks. Your enquiry has been sent.");
    router.push(buildThankYouHref({ type: "contact", source: "contact_form" }));
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">Send an enquiry</h2>
      <div className="mt-5 grid gap-3">
        <div className="relative">
          <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            maxLength={100}
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone number"
            maxLength={15}
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            maxLength={160}
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What do you need help with?"
            rows={4}
            maxLength={800}
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {submitting ? "Sending..." : "Send enquiry"}
      </button>
    </form>
  );
}
