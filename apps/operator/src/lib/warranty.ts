export const WARRANTY_UNITS = ["days", "months", "years"] as const;
export type WarrantyUnit = (typeof WARRANTY_UNITS)[number];

export const WARRANTY_PRESETS = [
  { value: "none", label: "No warranty", durationValue: null, durationUnit: null },
  { value: "3_months", label: "3 months warranty", durationValue: 3, durationUnit: "months" },
  { value: "6_months", label: "6 months warranty", durationValue: 6, durationUnit: "months" },
  { value: "1_year", label: "1 year warranty", durationValue: 1, durationUnit: "years" },
  { value: "custom", label: "Custom warranty", durationValue: null, durationUnit: "months" },
] as const;

export type WarrantyInput = {
  preset?: string;
  value?: string | number | null;
  unit?: string | null;
};

export type WarrantyFields = {
  warranty_duration_value: number | null;
  warranty_duration_unit: WarrantyUnit | null;
  warranty_label: string | null;
};

function normalizeUnit(unit: string | null | undefined): WarrantyUnit | null {
  return WARRANTY_UNITS.includes(unit as WarrantyUnit) ? (unit as WarrantyUnit) : null;
}

function pluralizeUnit(value: number, unit: WarrantyUnit) {
  if (value === 1 && unit === "years") return "year";
  if (value === 1 && unit === "months") return "month";
  if (value === 1 && unit === "days") return "day";
  return unit;
}

export function formatWarrantyLabel(value: number | null | undefined, unit: string | null | undefined) {
  const normalizedUnit = normalizeUnit(unit);
  const normalizedValue = Number(value || 0);

  if (!normalizedUnit || !Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    return null;
  }

  return `${normalizedValue} ${pluralizeUnit(normalizedValue, normalizedUnit)} warranty`;
}

export function buildWarrantyFields(input: WarrantyInput): WarrantyFields {
  const preset = WARRANTY_PRESETS.find((item) => item.value === input.preset);

  if (preset && preset.value !== "custom") {
    return {
      warranty_duration_value: preset.durationValue,
      warranty_duration_unit: preset.durationUnit,
      warranty_label: preset.durationValue ? preset.label : null,
    };
  }

  const durationValue = Math.max(0, Math.floor(Number(input.value || 0)));
  const durationUnit = normalizeUnit(input.unit) || "months";
  const label = formatWarrantyLabel(durationValue, durationUnit);

  return {
    warranty_duration_value: label ? durationValue : null,
    warranty_duration_unit: label ? durationUnit : null,
    warranty_label: label,
  };
}

export function getWarrantyPreset(value: number | null | undefined, unit: string | null | undefined) {
  const preset = WARRANTY_PRESETS.find((item) => item.durationValue === value && item.durationUnit === unit);
  return preset?.value || (value && unit ? "custom" : "none");
}
