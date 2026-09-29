/**
 * The dashboard apps, their routes, and the seeded account each one needs.
 *
 * The existing sweep covers only `apps/user`, and only as an anonymous visitor.
 * That leaves two blind spots this file exists to close: the three dashboards were
 * never route-swept at all, and signed-in surfaces were audited only in their
 * redirect-to-login state.
 *
 * Credentials are the local `@looplic.local` test accounts from
 * docs/dashboard-access.md, seeded by scripts/seed-dashboard-users.cjs. They live on
 * that domain precisely so they can never receive real email, and they are the same
 * accounts scripts/verify-dashboard-users.cjs already asserts the role matrix for.
 */

export type DashboardApp = {
  /** Workspace name, for the dev-server command. */
  workspace: string;
  name: string;
  /** Port this sweep starts the app on — deliberately not the usual dev ports, so
   *  the sweep never collides with a dev server someone is already running. */
  port: number;
  loginPath: string;
  /** Where a successful sign-in lands. */
  landingPath: string;
  email: string;
  password: string;
  /** Routes to audit once signed in. */
  routes: { path: string; name: string }[];
  /** Routes that must NOT render for an anonymous visitor. */
  protectedRoutes: string[];
};

export const dashboardApps: DashboardApp[] = [
  {
    workspace: "@looplic/admin",
    name: "admin",
    port: 3211,
    loginPath: "/admin/login",
    landingPath: "/admin/dashboard",
    email: "admin@looplic.local",
    password: "Admin123!",
    routes: [
      { path: "/admin/login", name: "admin login" },
      { path: "/admin/dashboard", name: "admin dashboard" },
    ],
    protectedRoutes: ["/admin/dashboard"],
  },
  {
    workspace: "@looplic/technician",
    name: "technician",
    port: 3212,
    loginPath: "/technician/login",
    landingPath: "/technician",
    email: "technician@looplic.local",
    password: "Technician123!",
    routes: [
      { path: "/technician/login", name: "technician login" },
      { path: "/technician", name: "technician dashboard" },
    ],
    protectedRoutes: ["/technician"],
  },
  {
    workspace: "@looplic/operator",
    name: "operator",
    port: 3213,
    loginPath: "/operator/login",
    landingPath: "/operator",
    // Note the role is `operation`, not `operator` — see docs/dashboard-access.md.
    email: "operator@looplic.local",
    password: "Operator123!",
    routes: [
      { path: "/operator/login", name: "operator login" },
      { path: "/operator", name: "operator dashboard" },
    ],
    protectedRoutes: ["/operator"],
  },
];

/** The customer account, for auditing signed-in surfaces on the user app. */
export const customerAccount = {
  email: "customer@looplic.local",
  password: "Customer123!",
};

/**
 * Signed-in routes on the user app. `/account` is in the anonymous sweep too, where
 * it can only ever be observed redirecting to /auth — so the page itself has never
 * been audited.
 */
export const signedInUserRoutes = [
  { path: "/account", name: "account (signed in)" },
  { path: "/cart", name: "cart (signed in)" },
  { path: "/checkout", name: "checkout (signed in)" },
];
