import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function jsonError(message: string, status: number, details?: unknown) {
  const includeDetails = process.env.NODE_ENV !== "production";
  return NextResponse.json(
    includeDetails && details ? { error: message, details } : { error: message },
    { status }
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return jsonError("Missing engagement id in route params", 400);
  }

  // 1) Parse JSON body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  // 2) Allow-list fields: prevents random/unsafe DB writes
  const allowed: Record<string, true> = {
    source: true,
    product: true,
    nextStep: true,
    notes: true,
    followUpRequired: true,
    lastTouchAt: true,
    bucket: true,
    dealStage: true,
    accountStatus: true,
  };

  // 3) Build a clean `data` object containing only allowed keys
  const data: Record<string, any> = {};
  for (const [k, v] of Object.entries(body ?? {})) {
    if (!allowed[k]) continue;
    data[k] = v;
  }

  if (Object.keys(data).length === 0) {
    return jsonError("No valid fields to update", 400, { allowed: Object.keys(allowed) });
  }

  // 4) Normalize lastTouchAt if it is sent as a string
  if (typeof data.lastTouchAt === "string") {
    const dt = new Date(data.lastTouchAt);
    if (isNaN(dt.getTime())) {
      return jsonError("Invalid lastTouchAt", 400);
    }
    data.lastTouchAt = dt;
  }

  // 5) Basic guardrails on enums
  if ("bucket" in data && !["LEAD", "DEAL", "ACCOUNT"].includes(data.bucket)) {
    return jsonError("Invalid bucket", 400);
  }

  if (
    "dealStage" in data &&
    data.dealStage !== null &&
    data.dealStage !== undefined &&
    !["DISCOVERY", "DEMO", "PROPOSAL", "ON_HOLD", "CLOSED_WON", "CLOSED_LOST"].includes(
      data.dealStage
    )
  ) {
    return jsonError("Invalid dealStage", 400);
  }

  if (
    "accountStatus" in data &&
    data.accountStatus !== null &&
    data.accountStatus !== undefined &&
    !["ACTIVE", "FORMER"].includes(data.accountStatus)
  ) {
    return jsonError("Invalid accountStatus", 400);
  }

  try {
    // 6) Confirm the record exists (otherwise Prisma throws a generic error)
    const existing = await prisma.engagement.findUnique({ where: { id } });
    if (!existing) {
      return jsonError("Engagement not found", 404, { id });
    }

    // 7) Update the engagement row in Postgres
    const updated = await prisma.engagement.update({
      where: { id },
      data,
      include: { company: true, primaryContact: true },
    });

    return NextResponse.json({ engagement: updated });
  } catch (e: any) {
    // Prisma errors often have `code` and `meta`.
    return jsonError("Update failed", 500, {
      message: e?.message,
      code: e?.code,
      meta: e?.meta,
    });
  }
}