import { Laptop, Smartphone } from "lucide-react";
import Link from "next/link";

import { RepairCycleLabel } from "@/src/components/next/RepairCycleLabel";
import { buildBangaloreAreaServiceRoute } from "@/src/lib/service-areas";

type TabKey = "mobile-repair" | "laptop-repair";

const services = [
  { id: "mobile-repair", label: "Mobile Repair", shortLabel: "Mobile", href: "/service/mobile-repair", icon: Smartphone, color: "from-orange-500 to-red-500" },
  { id: "laptop-repair", label: "Laptop Repair", shortLabel: "Laptop", href: "/service/laptop-repair", icon: Laptop, color: "from-violet-500 to-purple-600" },
] as const;

export function CatalogServiceTabs({ active, currentAreaSlug }: { active: TabKey; currentAreaSlug?: string }) {
  return (
    <section className="sticky top-14 z-40 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container">
        <div className="flex items-center justify-center gap-1 py-1.5">
          {services.map((service) => {
            const Icon = service.icon;
            const isActive = service.id === active;
            const href = currentAreaSlug ? buildBangaloreAreaServiceRoute(currentAreaSlug, service.id) : service.href;

            return (
              <Link
                key={service.id}
                href={href}
                className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-300 sm:gap-2 sm:px-5 sm:text-sm ${
                  isActive ? "text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                {isActive ? <div className="absolute inset-0 rounded-xl border border-primary/20 bg-primary/10" /> : null}
                <span className="relative flex items-center gap-1.5 sm:gap-2">
                  <div className={`flex size-6 items-center justify-center rounded-lg bg-gradient-to-br ${service.color} shadow-sm`}>
                    <Icon className="size-3.5 text-white" />
                  </div>
                  <span className="hidden sm:inline">{service.label}</span>
                  <RepairCycleLabel device={service.id === "mobile-repair" ? "Mobile" : "Laptop"} />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
