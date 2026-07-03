// The Drizzle schema + pooled client now live in the shared @looplic/db
// workspace package so every app (customer, admin, technician) uses one
// canonical database definition. Kept as a re-export so existing
// "@/src/lib/db" / "@/lib/db" imports across the app continue to work.
export * from "@looplic/db";
