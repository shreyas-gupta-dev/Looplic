import type { FlowStep } from "./types";

// Interactive rows/buttons carry an id that comes back to us on tap. We encode
// the step that produced the option into the id so a tap on a stale message
// (WhatsApp keeps every old list tappable forever) can be detected and handled
// instead of silently corrupting the wizard.
//
//   f:model:9f3c-…      → picked a model while on the "model" step
//   f:model:__more      → "show more" on the same step
//   nav:menu            → global navigation, valid from any step

const PREFIX = "f";

export const NAV = {
  more: "__more",
  back: "__back",
  skip: "__skip",
  menu: "nav:menu",
  cancel: "nav:cancel",
  agent: "nav:agent",
  restart: "nav:restart",
} as const;

export function optionId(step: FlowStep, value: string): string {
  return `${PREFIX}:${step}:${value}`;
}

export type ParsedId =
  | { kind: "option"; step: FlowStep; value: string }
  | { kind: "nav"; value: string }
  | null;

export function parseId(raw: string | null | undefined): ParsedId {
  if (!raw) return null;
  if (raw.startsWith("nav:")) return { kind: "nav", value: raw };
  const parts = raw.split(":");
  if (parts.length < 3 || parts[0] !== PREFIX) return null;
  return { kind: "option", step: parts[1] as FlowStep, value: parts.slice(2).join(":") };
}
