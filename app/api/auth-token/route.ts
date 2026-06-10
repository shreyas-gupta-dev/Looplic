import { NextResponse } from "next/server";
import { getServerSession } from "@/src/lib/auth/cognito-server";

export async function GET() {
  const session = await getServerSession();
  if (!session.user) {
    return NextResponse.json({ token: null });
  }
  return NextResponse.json({ token: session.user.id });
}
