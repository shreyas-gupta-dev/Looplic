import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getServerSession } from "@/src/lib/auth/cognito-server";

const REGION = process.env.NEXT_PUBLIC_S3_REGION || process.env.AWS_REGION || "ap-south-1";
const BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || "looplic-assets";

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export function publicUrlFor(key: string) {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

// Uploads an image to S3 under <folder>/<path>. Admin/staff only.
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session.user) {
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

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: bytes,
        ContentType: file.type || "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    return NextResponse.json({ data: { key, publicUrl: publicUrlFor(key) }, error: null });
  } catch (err: any) {
    console.error("S3 upload error:", err);
    return NextResponse.json({ error: { message: err.message || "Upload failed" } }, { status: 500 });
  }
}
