import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { deleteRedisKeysByPrefix } from "@/src/lib/redis";

type RevalidateRequest = {
  paths?: string[];
  pagePaths?: string[];
  tags?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RevalidateRequest;
    const paths = Array.isArray(body.paths) ? body.paths : [];
    const pagePaths = Array.isArray(body.pagePaths) ? body.pagePaths : [];
    const tags = Array.isArray(body.tags) ? body.tags : [];

    for (const path of paths) {
      if (typeof path === "string" && path.startsWith("/")) {
        revalidatePath(path);
      }
    }

    for (const pagePath of pagePaths) {
      if (typeof pagePath === "string" && pagePath.startsWith("/")) {
        revalidatePath(pagePath, "page");
      }
    }

    for (const tag of tags) {
      if (typeof tag === "string" && tag.trim()) {
        revalidateTag(tag);
      }
    }

    const shouldPurgeCatalogRedis = tags.some((tag) => typeof tag === "string" && tag.startsWith("catalog"));
    const redisKeysDeleted = shouldPurgeCatalogRedis
      ? await deleteRedisKeysByPrefix(["looplic:catalog:v1:", "looplic:home:v1:"])
      : 0;

    return NextResponse.json({ revalidated: true, paths, pagePaths, tags, redisKeysDeleted });
  } catch {
    return NextResponse.json({ revalidated: false }, { status: 400 });
  }
}
