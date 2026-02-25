import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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