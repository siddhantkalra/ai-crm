import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  const engagements = await prisma.engagement.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      company: true,
      primaryContact: true,
    },
  });

  return NextResponse.json({ engagements });
}
