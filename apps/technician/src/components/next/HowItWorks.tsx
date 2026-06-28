import { CalendarCheck, Search, ThumbsUp, Wrench } from "lucide-react";

const steps = [
  { icon: Search, title: "Search Model", desc: "Find your phone in seconds", num: "01" },
  { icon: CalendarCheck, title: "Pick a Slot", desc: "Choose a convenient time", num: "02" },
  { icon: Wrench, title: "We Come to You", desc: "Certified tech at your door", num: "03" },
  { icon: ThumbsUp, title: "Done!", desc: "Bubble-free, perfect finish", num: "04" },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="overflow-hidden bg-background py-10 md:py-16">
      <div className="container">
        <div className="mb-7 text-center">
          <h2 className="text-xl font-semibold text-foreground md:text-3xl">Simple as 1-2-3-4</h2>
          <p className="mt-1 text-xs text-muted-foreground">Book your installation in under a minute</p>
        </div>

        <div className="relative mx-auto max-w-sm md:max-w-3xl">
          <div className="absolute bottom-6 left-[19px] top-6 w-px bg-gradient-to-b from-primary/30 via-accent/30 to-transparent md:hidden" />

          <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-4">
            {steps.map((step) => (
              <div key={step.title} className="relative flex items-center gap-4 md:flex-1 md:flex-col md:items-center md:text-center">
                <div className="relative z-10 flex size-10 flex-shrink-0 items-center justify-center rounded-full gradient-brand shadow-lg">
                  <span className="text-xs font-extrabold text-primary-foreground">{step.num}</span>
                </div>

                <div className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 shadow-card-brand md:mt-3 md:px-4 md:py-5">
                  <div className="mb-1 flex items-center gap-2 md:justify-center">
                    <step.icon className="size-4 text-primary" />
                    <h3 className="text-[13px] font-semibold text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
