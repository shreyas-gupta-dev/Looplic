import { db } from "@/src/lib/db";

export function createAdminClient() {
  return {
    auth: {
      admin: {
        async listUsers() {
          return { data: { users: [] }, error: null };
        },
        async getUserById(_id: string) {
          return { data: { user: null }, error: null };
        },
        async createUser(_opts: any) {
          return { data: { user: null }, error: null };
        },
        async deleteUser(_id: string) {
          return { data: {}, error: null };
        },
        async updateUserById(_id: string, _updates: any) {
          return { data: { user: null }, error: null };
        },
      },
    },
    from: (table: string) => ({
      select: (_fields?: string) => ({
        eq: (_col: string, _val: any) => ({
          maybeSingle: async () => ({ data: null, error: null }),
          single: async () => ({ data: null, error: null }),
          then: (resolve: any) => resolve({ data: [], error: null }),
        }),
        order: () => ({ then: (resolve: any) => resolve({ data: [], error: null }) }),
        then: (resolve: any) => resolve({ data: [], error: null }),
      }),
      insert: (_rows: any) => ({
        select: () => ({ single: async () => ({ data: null, error: null }) }),
        then: (resolve: any) => resolve({ data: null, error: null }),
      }),
      update: (_vals: any) => ({
        eq: (_col: string, _val: any) => ({ then: (resolve: any) => resolve({ data: null, error: null }) }),
      }),
      delete: () => ({
        eq: (_col: string, _val: any) => ({ then: (resolve: any) => resolve({ data: null, error: null }) }),
      }),
    }),
  };
}
