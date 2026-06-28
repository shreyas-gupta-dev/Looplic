export function RepairCycleLabel({ device }: { device: "Mobile" | "Laptop" }) {
  return (
    <span className="service-tab-cycle sm:hidden" aria-label={`${device} Repair`}>
      <span className="service-tab-cycle__word service-tab-cycle__word--first" aria-hidden="true">
        {device}
      </span>
      <span className="service-tab-cycle__word service-tab-cycle__word--second" aria-hidden="true">
        Repair
      </span>
    </span>
  );
}
