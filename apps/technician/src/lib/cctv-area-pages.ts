import { bangaloreAreas, type BangaloreArea, buildBangaloreAreaServiceRoute } from "@/src/lib/service-areas";

const propertyProfiles = [
  {
    focus: "apartments, independent homes, and small offices",
    cameraPoints: "entrances, parking slots, staircases, corridors, and reception corners",
    risk: "visitor movement, delivery access, and late-evening blind spots",
    network: "router placement, DVR/NVR location, and mobile viewing reliability",
  },
  {
    focus: "shops, clinics, tuition centers, and street-facing businesses",
    cameraPoints: "billing counters, shutters, inventory racks, waiting areas, and storefronts",
    risk: "cash counter visibility, staff safety, stock movement, and after-hours monitoring",
    network: "recorder backup, app access, playback checks, and cable routing",
  },
  {
    focus: "PGs, shared homes, warehouses, and mixed-use buildings",
    cameraPoints: "gates, common entries, lift areas, loading zones, and terrace access points",
    risk: "common-area accountability, vehicle movement, and unattended entry points",
    network: "camera channel mapping, storage planning, LAN checks, and remote viewing setup",
  },
  {
    focus: "office floors, coworking spaces, showrooms, and service centers",
    cameraPoints: "front desks, work bays, meeting entries, storage rooms, and customer areas",
    risk: "asset monitoring, customer flow, team access, and service-floor visibility",
    network: "IP camera planning, NVR setup, switch/router checks, and viewing permissions",
  },
] as const;

const toneProfiles = [
  {
    promise: "clean coverage planning without unnecessary camera points",
    planning: "We start by understanding where people enter, where assets are kept, and which angles actually help during playback.",
  },
  {
    promise: "a practical CCTV setup that is easy to review after installation",
    planning: "We focus on camera height, glare, night visibility, cable route, power points, and whether the recorder is easy to access when needed.",
  },
  {
    promise: "reliable recording and mobile viewing for everyday monitoring",
    planning: "We check camera placement, network readiness, recording schedule, storage expectations, and app access before handover.",
  },
  {
    promise: "security camera installation planned around real site movement",
    planning: "We look at blind spots, customer movement, vehicle entry, common areas, and device placement before recommending the final setup.",
  },
] as const;

export type CctvAreaPageContent = {
  area: BangaloreArea;
  title: string;
  description: string;
  intro: string;
  planning: string;
  focus: string;
  cameraPoints: string;
  risk: string;
  network: string;
  highlights: string[];
  sections: Array<{
    title: string;
    text: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  bookingHref: string;
};

function profileIndex(area: BangaloreArea, length: number) {
  const score = [...area.slug].reduce((total, char) => total + char.charCodeAt(0), 0);
  return score % length;
}

export function getCctvAreaPageContent(area: BangaloreArea): CctvAreaPageContent {
  const property = propertyProfiles[profileIndex(area, propertyProfiles.length)];
  const tone = toneProfiles[profileIndex({ ...area, slug: `${area.slug}-cctv` }, toneProfiles.length)];
  const bookingHref = `/book/cctv?area=${area.slug}`;

  return {
    area,
    title: `CCTV Installation in ${area.name}, Bangalore`,
    description: `Book CCTV installation in ${area.name}, Bangalore for ${property.focus} with camera placement planning, DVR/NVR setup, mobile viewing, and handover checks.`,
    intro: `Looplic helps customers in ${area.name} plan CCTV installation for ${property.focus}. The goal is ${tone.promise}, with a booking flow that connects directly to CCTV service support.`,
    planning: tone.planning,
    focus: property.focus,
    cameraPoints: property.cameraPoints,
    risk: property.risk,
    network: property.network,
    highlights: [
      `${area.name} site visit planning`,
      "DVR/NVR setup and recording checks",
      "Mobile viewing and playback handover",
      "Indoor, outdoor, dome, bullet, and IP camera support",
    ],
    sections: [
      {
        title: `CCTV setup for ${property.focus}`,
        text: `Every ${area.name} site has a different security pattern. Homes may need entry and parking visibility, while businesses often need counter, stock, and shutter coverage. Looplic keeps the plan practical so each camera has a clear job.`,
      },
      {
        title: "Camera placement and cable route",
        text: `Recommended camera points usually include ${property.cameraPoints}. During planning, the technician checks angle, height, glare, wiring route, power access, and whether the recorder can be placed safely.`,
      },
      {
        title: "Recording, playback, and remote viewing",
        text: `A useful CCTV system should be easy to review. We help with DVR/NVR basics, channel checks, storage expectations, playback verification, and mobile viewing setup so customers in ${area.name} can monitor the site clearly.`,
      },
      {
        title: "Why Looplic is a strong choice",
        text: `Looplic connects area-specific CCTV pages to the booking flow, so customers can move from local service research to a real CCTV installation request without hunting for a separate contact path.`,
      },
    ],
    faqs: [
      {
        question: `Can I book CCTV installation in ${area.name} online?`,
        answer: `Yes. Use the booking CTA on this page to start a CCTV installation request for ${area.name}, Bangalore.`,
      },
      {
        question: "Can Looplic help with mobile viewing setup?",
        answer: "Yes. CCTV installation can include app setup, live-view checks, and basic playback guidance during handover.",
      },
      {
        question: "Do I need DVR or NVR setup?",
        answer: "That depends on your camera type, site size, network, and recording needs. The technician can inspect the site and explain the suitable setup before work begins.",
      },
    ],
    bookingHref,
  };
}

export const cctvAreaLinks = bangaloreAreas.map((area) => ({
  href: buildBangaloreAreaServiceRoute(area.slug, "cctv"),
  label: `${area.name} CCTV Installation`,
}));
