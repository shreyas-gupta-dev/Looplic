import { NextResponse } from "next/server";

import { withRedisCache } from "@/src/lib/redis";
import { createPublicClient } from "@/src/lib/supabase/public";

const CACHE_SECONDS = 300;
const CACHE_KEY = "looplic:staff-catalog:v1:repair-options";

export async function GET() {
  const data = await withRedisCache(CACHE_KEY, CACHE_SECONDS, async () => {
    const supabase = createPublicClient();
    const [categoryResult, subcategoryResult] = await Promise.all([
      supabase.from("repair_categories").select("id, name, service_type").order("name"),
      supabase.from("repair_subcategories").select("id, category_id, name, price").order("name"),
    ]);

    return {
      categories: categoryResult.data || [],
      subcategories: subcategoryResult.data || [],
      cachedAt: new Date().toISOString(),
    };
  });

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 4}`,
    },
  });
}
