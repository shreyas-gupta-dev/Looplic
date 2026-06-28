export type RepairWarranty = {
  label: string;
  tone: "premium" | "standard" | "service";
};

function normalizeWarrantyName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function getRepairWarranty(subcategoryName: string): RepairWarranty | null {
  const name = normalizeWarrantyName(subcategoryName);

  if (!name) {
    return null;
  }

  if (name.includes("back glass") || name.includes("back panel") || name.includes("back cover") || name.includes("body housing") || name.includes("housing")) {
    return null;
  }

  if (name.includes("screen replacement") || name.includes("display") || name.includes("glass replacement")) {
    return { label: "3 mo to 1 yr warranty", tone: "premium" };
  }

  if (name.includes("battery")) {
    return { label: "3 to 6 mo warranty", tone: "standard" };
  }

  if (name.includes("motherboard") || name.includes("logic board") || name.includes("board repair")) {
    return { label: "6 mo warranty", tone: "standard" };
  }

  if (name.includes("mic") || name.includes("microphone") || name.includes("ringer") || name.includes("speaker") || name.includes("receiver") || name.includes("earpiece")) {
    return { label: "30 day sound warranty", tone: "service" };
  }

  if (name.includes("charging") || name.includes("charging port") || name.includes("connector") || name.includes("type c") || name.includes("usb")) {
    return { label: "30 to 90 day warranty", tone: "service" };
  }

  if (name.includes("camera")) {
    return { label: "30 to 90 day warranty", tone: "service" };
  }

  if (name.includes("finger") || name.includes("sensor") || name.includes("face id") || name.includes("touch id")) {
    return { label: "30 day part warranty", tone: "service" };
  }

  if (name.includes("keyboard") || name.includes("trackpad") || name.includes("touchpad")) {
    return { label: "3 mo warranty", tone: "standard" };
  }

  if (name.includes("ssd") || name.includes("ram") || name.includes("upgrade")) {
    return { label: "Brand warranty", tone: "standard" };
  }

  if (name.includes("hinge")) {
    return { label: "30 day service warranty", tone: "service" };
  }

  return null;
}
