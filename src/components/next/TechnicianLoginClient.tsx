"use client";

import { Bike, Eye, EyeOff, Loader2, Lock, Mail, Phone, User, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useRoleSession } from "@/src/hooks/useRoleSession";
import { createClient } from "@/src/lib/supabase/client";
import { orderServiceTypes } from "@/src/lib/service-types";

export function TechnicianLoginClient() {
  const router = useRouter();
  const supabase = createClient() as any;
  const { signIn, hasRole, loading, user } = useRoleSession("technician");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showApplication, setShowApplication] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState("");
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [riderCity, setRiderCity] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [experience, setExperience] = useState("");
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>(["mobile_repair"]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!loading && user && hasRole) {
      router.replace("/technician");
    }
  }, [hasRole, loading, router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
    }
  }

  async function handleRiderApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setApplicationSuccess("");

    if (!email.trim() || !password || !riderName.trim() || !riderPhone.trim()) {
      setError("Add email, password, name, and phone to apply.");
      return;
    }
    if (selectedServiceTypes.length === 0) {
      setError("Select at least one service you can handle.");
      return;
    }
    if (!termsAccepted) {
      setError("Accept the Looplic technician terms and conditions to apply.");
      return;
    }

    setApplying(true);
    const signUpResult = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: riderName.trim(),
          phone: riderPhone.trim(),
          technician_terms_accepted: true,
          technician_terms_accepted_at: new Date().toISOString(),
        },
      },
    });

    if (signUpResult.error) {
      setApplying(false);
      setError(signUpResult.error.message || "Unable to create technician account.");
      return;
    }

    const applicationPayload = {
      user_id: signUpResult.data?.user?.id || null,
      email: email.trim(),
      full_name: riderName.trim(),
      phone: riderPhone.trim(),
      city: riderCity.trim() || null,
      vehicle_type: vehicleType || null,
      experience: experience.trim() || null,
      service_types: selectedServiceTypes,
      status: "pending",
    };
    let { error: applicationError } = await supabase.from("technician_applications").insert(applicationPayload);

    if (applicationError && String(applicationError.message || "").includes("service_types")) {
      const { service_types: _serviceTypes, ...fallbackPayload } = applicationPayload;
      const fallbackResult = await supabase.from("technician_applications").insert(fallbackPayload);
      applicationError = fallbackResult.error;
    }

    setApplying(false);
    if (applicationError) {
      setError(applicationError.message || "Account created, but application was not submitted.");
      return;
    }

    setApplicationSuccess("Application submitted. Admin or operator approval is required before login.");
    setRiderName("");
    setRiderPhone("");
    setRiderCity("");
    setVehicleType("");
    setExperience("");
    setSelectedServiceTypes(["mobile_repair"]);
    setTermsAccepted(false);
    setPassword("");
  }

  function toggleServiceType(serviceType: string) {
    setSelectedServiceTypes((current) => {
      if (current.includes(serviceType)) {
        return current.filter((item) => item !== serviceType);
      }

      return [...current, serviceType];
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Wrench className="size-5" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Technician Login</h1>
          <p className="mt-1 text-xs text-muted-foreground">Inspect assigned orders, manage pickup, create quotes, and close work cleanly.</p>
        </div>

        <form onSubmit={showApplication ? handleRiderApplication : handleSubmit} className="space-y-4 rounded-[2rem] border border-border bg-card p-6 shadow-card-brand">
          {showApplication ? (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={riderName}
                  onChange={(event) => setRiderName(event.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={riderPhone}
                  onChange={(event) => setRiderPhone(event.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </>
          ) : null}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="technician@looplic.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={showApplication ? "new-password" : "current-password"}
              required
              className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-12 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {showApplication ? (
            <>
              <input
                type="text"
                placeholder="City / service area"
                value={riderCity}
                onChange={(event) => setRiderCity(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="relative">
                <Bike className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={vehicleType}
                  onChange={(event) => setVehicleType(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Vehicle type</option>
                  <option value="Bike">Bike</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Car">Car</option>
                  <option value="Public transport">Public transport</option>
                </select>
              </div>
              <textarea
                placeholder="Experience, preferred areas, tools carried"
                value={experience}
                onChange={(event) => setExperience(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="rounded-2xl border border-border bg-background p-3">
                <div className="text-xs font-bold text-muted-foreground">Services you can handle</div>
                <div className="mt-3 grid gap-2">
                  {orderServiceTypes.map((service) => (
                    <label key={service.value} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold text-foreground">
                      <input
                        type="checkbox"
                        checked={selectedServiceTypes.includes(service.value)}
                        onChange={() => toggleServiceType(service.value)}
                        className="size-4 rounded border-border"
                      />
                      {service.label}
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-2xl border border-border bg-background p-3 text-xs leading-6 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  className="mt-1 size-4 rounded border-border"
                />
                <span>
                  I agree to the Looplic{" "}
                  <Link href="/terms-and-conditions#technician-terms" target="_blank" className="font-bold text-primary hover:underline">
                    technician terms and conditions
                  </Link>
                  , including no direct customer dealing, doorstep conduct, safety, privacy, and cost-recovery rules.
                </span>
              </label>
            </>
          ) : null}
          {error ? <p className="text-center text-xs font-medium text-destructive">{error}</p> : null}
          {applicationSuccess ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700">{applicationSuccess}</p> : null}
          {user && !hasRole ? <p className="text-center text-xs font-medium text-destructive">This account does not have technician access.</p> : null}
          <button type="submit" disabled={submitting || applying || (showApplication && !termsAccepted)} className="flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {submitting || applying ? <Loader2 className="size-4 animate-spin" /> : null}
            {showApplication ? (applying ? "Submitting..." : "Submit technician application") : submitting ? "Signing in..." : "Sign In"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowApplication((value) => !value);
              setError("");
              setApplicationSuccess("");
            }}
            className="w-full rounded-xl border border-border py-3 text-sm font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary"
          >
            {showApplication ? "Back to login" : "Become a technician"}
          </button>
        </form>
      </div>
    </main>
  );
}
