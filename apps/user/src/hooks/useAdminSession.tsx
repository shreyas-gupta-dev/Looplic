import { useRoleSession } from "@/src/hooks/useRoleSession";

export function useAdminSession() {
  const session = useRoleSession("admin");

  return {
    user: session.user,
    isAdmin: session.hasRole,
    loading: session.loading,
    signIn: session.signIn,
    signOut: session.signOut,
  };
}
