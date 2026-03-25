import { NextRequest, NextResponse } from "next/server";

/**
 * Simple API key guard for internal CRM endpoints.
 *
 * Set CRM_API_KEY in your environment. If the key is not configured the
 * endpoint returns 503 so that an unconfigured deployment fails closed rather
 * than open. Returns null when the request is authorised.
 */
export function requireApiKey(req: NextRequest | Request): NextResponse | null {
  const key =
    (req as NextRequest).headers?.get("x-api-key") ??
    (req as Request).headers?.get("x-api-key");
  const expected = process.env.CRM_API_KEY;

  if (!expected) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 503 }
    );
  }

  if (key !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // authorised
}
