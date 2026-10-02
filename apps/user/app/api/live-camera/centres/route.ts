import { NextResponse } from "next/server";
import { getRepairStreamConfig } from "@/src/lib/repair-stream/hls-config";
import { db } from "@/src/lib/db";
import { appSettings } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getRepairStreamConfig();

    // Check optional public camera controls (e.g., privacy shutter)
    let privacyShutterActive = false;
    try {
      const rows = await db
        .select({ value: appSettings.value })
        .from(appSettings)
        .where(eq(appSettings.key, "live_camera_privacy"))
        .limit(1);

      if (rows[0]?.value) {
        const val = typeof rows[0].value === "string" ? JSON.parse(rows[0].value) : rows[0].value;
        privacyShutterActive = Boolean(val?.privacyActive);
      }
    } catch {
      // Default to open
    }

    const benches = Object.entries(config.centres).map(([key, centre], index) => ({
      id: key,
      label: centre.label || `Bench ${index + 1}`,
      isDefault: key === config.defaultCentre,
    }));

    // If no centres configured yet, supply standard workshop preset benches
    const activeBenches = benches.length > 0 ? benches : [
      {
        id: "bench-1",
        label: "Bench 1: Display & Screen Replacement Lab",
        isDefault: true,
      },
      {
        id: "bench-2",
        label: "Bench 2: Motherboard & Chip-Level Diagnostics",
        isDefault: false,
      },
      {
        id: "bench-3",
        label: "Bench 3: Battery & Final Quality Testing",
        isDefault: false,
      },
    ];

    // Determine working hours in IST (UTC+5:30)
    const now = new Date();
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const istMinutes = (utcMinutes + 330) % 1440; // 5 hours 30 mins
    const istHour = Math.floor(istMinutes / 60);

    // Workshop hours: 10:00 AM to 8:30 PM IST (10 to 20:30)
    const isWithinWorkingHours = istHour >= 10 && (istHour < 20 || (istHour === 20 && istMinutes % 60 <= 30));

    let status: "online" | "break" | "offline" = "online";
    if (privacyShutterActive) {
      status = "break";
    } else if (!isWithinWorkingHours) {
      status = "offline";
    }

    return NextResponse.json({
      status,
      workingHours: "10:00 AM - 8:30 PM IST",
      location: "Bengaluru Flagship Workshop — Looplic HQ",
      activeBenches,
      defaultBench: activeBenches.find((b) => b.isDefault)?.id ?? activeBenches[0].id,
      notice: privacyShutterActive
        ? "Privacy Shutter Active: Technicians are currently taking a scheduled break. The live feed will resume shortly."
        : !isWithinWorkingHours
        ? "Our physical repair hub is closed for the night. Live workshop broadcasting resumes at 10:00 AM IST."
        : "Live CCTV broadcast from our certified technician workbenches.",
    });
  } catch (error) {
    console.error("[live-camera/centres] Error loading centres:", error);
    return NextResponse.json(
      {
        status: "online",
        workingHours: "10:00 AM - 8:30 PM IST",
        location: "Bengaluru Flagship Workshop",
        activeBenches: [
          { id: "bench-1", label: "Bench 1: Display & Glass Specialists", isDefault: true },
          { id: "bench-2", label: "Bench 2: Motherboard Diagnostics", isDefault: false },
        ],
        defaultBench: "bench-1",
      },
      { status: 200 }
    );
  }
}
