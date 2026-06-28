import { Award, CheckCircle2, Clock, MessageCircleQuestion, ShieldCheck, Star } from "lucide-react";

const signals = [
  { icon: ShieldCheck, title: "Certified Techs", desc: "Trained and background-verified professionals" },
  { icon: CheckCircle2, title: "Clear Scope", desc: "Service details confirmed before work begins" },
  { icon: Clock, title: "Fast Scheduling", desc: "Quick booking for doorstep service slots" },
  { icon: Award, title: "Quality Checks", desc: "Inspection and handover checks for completed jobs" },
];

const reviews = [
  {
    name: "Rahul K.",
    area: "HSR Layout",
    service: "Mobile screen repair",
    rating: 5,
    text: "Booking was simple, the technician explained the screen issue clearly, and I got updates before the visit. The whole experience felt organized.",
  },
  {
    name: "Priya S.",
    area: "Whitefield",
    service: "Laptop pickup repair",
    rating: 5,
    text: "I liked that the scope and estimate were discussed before work started. Pickup, diagnosis, and return were easy to follow.",
  },
  {
    name: "Amit R.",
    area: "Koramangala",
    service: "CCTV setup",
    rating: 5,
    text: "The camera points were planned properly, mobile viewing was set up, and playback was checked before handover. Very practical service.",
  },
];

const faqs = [
  {
    question: "How does Looplic booking work?",
    answer: "Choose a service, share your device or site details, add your address and preferred time, and Looplic support coordinates the next step with a technician.",
  },
  {
    question: "Do you provide doorstep service in Bangalore?",
    answer: "Yes. Looplic supports doorstep mobile repair, laptop pickup support, CCTV installation, desktop assembly, and IT support across many Bangalore areas.",
  },
  {
    question: "Will I know the price before repair starts?",
    answer: "The technician or support team confirms the repair scope and estimate before final work begins. If inspection changes the scope, you can review it first.",
  },
  {
    question: "Can I book CCTV installation or IT support too?",
    answer: "Yes. You can book CCTV installation, DVR/NVR setup, mobile viewing setup, desktop assembly, one-time IT support, and managed IT services.",
  },
  {
    question: "What details should I keep ready?",
    answer: "For device repair, keep the brand, model, issue, and location ready. For CCTV or IT work, share the site type, requirement, address, and preferred schedule.",
  },
];

export function TrustSignals() {
  return (
    <section className="bg-navy py-10 text-navy-foreground md:py-16">
      <div className="container max-w-6xl px-4 sm:px-6">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-accent">
            Reviews & FAQs
          </div>
          <h2 className="text-2xl font-semibold md:text-4xl">Clear service, real support, easy next steps.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 opacity-60">
            Looplic is built for customers who want repair, CCTV, and tech support to feel simple from booking to handover.
          </p>
        </div>

        <div className="mx-auto grid max-w-sm grid-cols-2 gap-2.5 md:max-w-3xl md:grid-cols-4 md:gap-3">
          {signals.map((signal) => (
            <div key={signal.title} className="rounded-2xl border border-primary/10 bg-primary/[0.06] p-3.5 backdrop-blur-sm">
              <div className="mb-2.5 flex size-9 items-center justify-center rounded-lg bg-accent/20">
                <signal.icon className="size-4 text-accent" />
              </div>
              <h3 className="text-[12px] font-semibold leading-tight">{signal.title}</h3>
              <p className="mt-1 text-[10px] leading-relaxed opacity-50">{signal.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">Customer reviews</h3>
                <p className="mt-1 text-xs font-semibold opacity-55">Simple feedback from common Looplic service journeys.</p>
              </div>
              <div className="hidden rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-right sm:block">
                <div className="flex justify-end">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-yellow-100">Helpful support</div>
              </div>
            </div>
            <div className="grid gap-3">
            {reviews.map((review) => (
              <article key={review.name} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-2xl gradient-brand text-sm font-extrabold text-primary-foreground">
                  {review.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black">{review.name}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold opacity-70">{review.area}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: review.rating }).map((_, index) => (
                          <Star key={index} className="size-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wide opacity-50">{review.service}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 opacity-70">{review.text}</p>
                  </div>
                </div>
              </article>
            ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <MessageCircleQuestion className="size-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Easy FAQs</h3>
                <p className="mt-1 text-xs font-semibold opacity-55">Quick answers before you book.</p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {faqs.map((faq) => (
                <details key={faq.question} className="group rounded-2xl border border-white/10 bg-black/10 p-4">
                  <summary className="cursor-pointer list-none text-sm font-extrabold leading-5">
                    <span className="flex items-start justify-between gap-3">
                      {faq.question}
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs transition-transform group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 opacity-65">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
