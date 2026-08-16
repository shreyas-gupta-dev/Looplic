import { AsyncLocalStorage } from "async_hooks";

// Which business phone number a message came in on, threaded through the
// entire handling of that message via AsyncLocalStorage rather than as an
// explicit parameter on every send* call. This lets two (or more) WhatsApp
// numbers share one Meta app/WABA and one codebase: the webhook sets the
// active phone_number_id once per inbound message, and every reply generated
// while handling it — deep inside the wizard, notify.ts, the AI lane — goes
// out from that same number automatically.
const storage = new AsyncLocalStorage<string>();

export function runWithPhoneNumberId<T>(phoneNumberId: string, fn: () => T): T {
  return storage.run(phoneNumberId, fn);
}

export function activePhoneNumberId(): string | undefined {
  return storage.getStore();
}
