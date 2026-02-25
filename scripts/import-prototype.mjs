import fs from "node:fs";
import path from "node:path";
import JSON5 from "json5";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- helpers ---
function parseLooseDate(s) {
  if (!s || typeof s !== "string") return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + "T00:00:00Z");
  // YYYY-MM
  if (/^\d{4}-\d{2}$/.test(s)) return new Date(s + "-01T00:00:00Z");
  // YYYY
  if (/^\d{4}$/.test(s)) return new Date(s + "-01-01T00:00:00Z");

  return null;
}

function mapDealStage(stage) {
  const x = (stage || "").toLowerCase().trim();
  if (x === "discovery") return "DISCOVERY";
  if (x === "demo") return "DEMO";
  if (x === "proposal") return "PROPOSAL";
  if (x === "on hold") return "ON_HOLD";
  if (x === "closed won") return "CLOSED_WON";
  if (x === "closed lost") return "CLOSED_LOST";
  return null;
}

function mapAccountStatus(status) {
  const x = (status || "").toLowerCase().trim();
  if (x === "active") return "ACTIVE";
  if (x === "former") return "FORMER";
  return "ACTIVE";
}

async function upsertCompanyByName(name) {
  const existing = await prisma.company.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.company.create({ data: { name } });
}

async function upsertContact({ fullName, email, companyId }) {
  // Prefer email for de-dupe
  if (email && email.trim()) {
    const existing = await prisma.contact.findFirst({ where: { email } });
    if (existing) return existing;
    return prisma.contact.create({ data: { fullName, email, companyId } });
  }

  // fallback: name + company
  const existing = await prisma.contact.findFirst({
    where: { fullName, companyId },
  });
  if (existing) return existing;

  return prisma.contact.create({ data: { fullName, companyId } });
}

function extractSeedObjectFromHtml(html) {
  const m = html.match(/var\s+SEED\s*=\s*({[\s\S]*?})\s*;/);
  if (!m) throw new Error("Could not find `var SEED = {...};` in crm.html");
  return JSON5.parse(m[1]);
}

// --- main ---
async function main() {
  // Put your prototype file here:
  const filePath = path.join(process.cwd(), "prototype", "crm.html");

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing file at ${filePath}. Create folder 'prototype' and copy crm.html into it.`
    );
  }

  const html = fs.readFileSync(filePath, "utf8");
  const seed = extractSeedObjectFromHtml(html);

  const { accounts = [], deals = [], leads = [] } = seed;

  console.log("Found:", {
    accounts: accounts.length,
    deals: deals.length,
    leads: leads.length,
  });

  // Optional safety: prevent re-import duplicates by tagging notes
  const importTag = "[imported-from-prototype]";

  // ACCOUNTS -> Engagement bucket ACCOUNT
  for (const a of accounts) {
    const company = await upsertCompanyByName(a.name);
    const contact = await upsertContact({
      fullName: a.contact || "Unknown",
      email: a.email || null,
      companyId: company.id,
    });

    await prisma.engagement.create({
      data: {
        bucket: "ACCOUNT",
        companyId: company.id,
        primaryContactId: contact.id,
        product: a.product || null,
        source: a.source || null,
        notes: [a.notes, importTag].filter(Boolean).join("\n"),
        nextStep: a.nextStep || null,
        followUpRequired: !!a.followUpRequired,
        lastTouchAt: parseLooseDate(a.lastContact),
        accountStatus: mapAccountStatus(a.status),
        billingSchedule: a.billingSchedule || null,
      },
    });
  }

  // DEALS -> Engagement bucket DEAL
  for (const d of deals) {
    const company = await upsertCompanyByName(d.name);
    const contact = await upsertContact({
      fullName: d.contact || "Unknown",
      email: d.email || null,
      companyId: company.id,
    });

    await prisma.engagement.create({
      data: {
        bucket: "DEAL",
        companyId: company.id,
        primaryContactId: contact.id,
        product: d.product || null,
        source: d.source || null,
        notes: [d.notes, importTag].filter(Boolean).join("\n"),
        nextStep: d.nextStep || null,
        followUpRequired: !!d.followUpRequired,
        lastTouchAt: parseLooseDate(d.lastContact),
        dealStage: mapDealStage(d.stage),
      },
    });
  }

  // LEADS -> Engagement bucket LEAD
  for (const l of leads) {
    const company = await upsertCompanyByName(l.name);
    const contact = await upsertContact({
      fullName: l.contact || "Unknown",
      email: l.email || null,
      companyId: company.id,
    });

    await prisma.engagement.create({
      data: {
        bucket: "LEAD",
        companyId: company.id,
        primaryContactId: contact.id,
        product: l.product || null,
        source: l.source || null,
        notes: [l.notes, importTag].filter(Boolean).join("\n"),
      },
    });
  }

  console.log("✅ Import complete.");
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });