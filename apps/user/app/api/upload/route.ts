import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/src/lib/auth/cognito-server";
import { getAdminSupabase } from "@/src/lib/supabase/server";

const BUCKET = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || process.env.NEXT_PUBLIC_S3_BUCKET || "looplic-assets";

// Uploads an image to Supabase Storage under <folder>/<path>. Admin/staff only.
export async function POST(req: NextRequest) {
  let user: any = null;
  const session = await getServerSession();
  if (session.user) {
    user = session.user;
  } else {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const admin = getAdminSupabase();
      const { data } = await admin.auth.getUser(token);
      if (data?.user) {
        user = data.user;
      }
    }
  }

  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folder = String(form.get("folder") || "uploads").replace(/[^a-zA-Z0-9_-]/g, "");
    const path = String(form.get("path") || "").replace(/^\/+/, "");

    if (!file || !path) {
      return NextResponse.json({ error: { message: "Missing file or path" } }, { status: 400 });
    }

    const key = `${folder}/${path}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const supabase = getAdminSupabase();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(key, bytes, {
        contentType: file.type || "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: { message: uploadError.message || "Upload failed" } }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(key);

    return NextResponse.json({ data: { key, publicUrl: publicUrlData.publicUrl }, error: null });
  } catch (err: any) {
    console.error("Storage upload error:", err);
    return NextResponse.json({ error: { message: err.message || "Upload failed" } }, { status: 500 });
  }
}
