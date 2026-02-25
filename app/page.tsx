import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function Card({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
    <div className="text-sm font-medium text-zinc-600">{title}</div>
    <div className="mt-1 text-2xl font-semibold text-zinc-900">{value}</div>
    {subtitle ? <div className="mt-1 text-sm text-zinc-500">{subtitle}</div> : null}
  </div>
  );
}

export default async function Home() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // Engagement counts
  const [leadCount, dealCount, accountCount] = await Promise.all([
    prisma.engagement.count({ where: { bucket: "LEAD" } }),
    prisma.engagement.count({ where: { bucket: "DEAL" } }),
    prisma.engagement.count({ where: { bucket: "ACCOUNT" } }),
  ]);

  // Deal stage distribution (DEAL bucket only)
  const dealsByStage = await prisma.engagement.groupBy({
    by: ["dealStage"],
    where: { bucket: "DEAL" },
    _count: { _all: true },
  });

  const stageOrder = [
    "DISCOVERY",
    "DEMO",
    "PROPOSAL",
    "ON_HOLD",
    "CLOSED_WON",
    "CLOSED_LOST",
  ] as const;

  const stageLabels: Record<(typeof stageOrder)[number], string> = {
    DISCOVERY: "Discovery",
    DEMO: "Demo",
    PROPOSAL: "Proposal",
    ON_HOLD: "On Hold",
    CLOSED_WON: "Closed Won",
    CLOSED_LOST: "Closed Lost",
  };

  const stageCounts = new Map<string, number>();
  for (const row of dealsByStage) {
    stageCounts.set(String(row.dealStage ?? "UNKNOWN"), row._count._all);
  }

  // Task overview
  const [tasksToday, tasksOverdue, tasksOpen] = await Promise.all([
    prisma.task.count({
      where: {
        status: "OPEN",
        dueAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.task.count({
      where: {
        status: "OPEN",
        dueAt: { lt: todayStart },
      },
    }),
    prisma.task.count({ where: { status: "OPEN" } }),
  ]);

  // Follow-up required (across all buckets)
  const followUpRequired = await prisma.engagement.count({
    where: { followUpRequired: true },
  });

  // Stale deals (no touch in 14+ days)
  const staleCutoff = new Date(now);
  staleCutoff.setDate(staleCutoff.getDate() - 14);

  const staleDeals = await prisma.engagement.count({
    where: {
      bucket: "DEAL",
      OR: [{ lastTouchAt: { lt: staleCutoff } }, { lastTouchAt: null }],
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Quick snapshot of pipeline and workload.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Leads" value={String(leadCount)} subtitle="Engagements in LEAD bucket" />
        <Card title="Deals" value={String(dealCount)} subtitle="Engagements in DEAL bucket" />
        <Card title="Accounts" value={String(accountCount)} subtitle="Engagements in ACCOUNT bucket" />
        <Card title="Follow-ups" value={String(followUpRequired)} subtitle="Marked followUpRequired" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="text-sm font-medium text-zinc-600">Deals by stage</div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stageOrder.map((s) => (
              <div key={s} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <div className="text-xs font-medium text-zinc-600">{stageLabels[s]}</div>
                <div className="mt-1 text-lg font-semibold text-zinc-900">
                  {String(stageCounts.get(s) ?? 0)}
                </div>
              </div>
            ))}
          </div>
          {stageCounts.get("UNKNOWN") ? (
            <div className="mt-3 text-sm text-zinc-500">
              Unknown stage: {String(stageCounts.get("UNKNOWN"))}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-zinc-600">Tasks</div>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-600">Overdue</div>
              <div className="text-base font-semibold text-zinc-900">{String(tasksOverdue)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-600">Due today</div>
              <div className="text-base font-semibold text-zinc-900">{String(tasksToday)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-600">Open total</div>
              <div className="text-base font-semibold text-zinc-900">{String(tasksOpen)}</div>
            </div>
          </div>

          <div className="mt-6 border-t border-zinc-100 pt-4">
            <div className="text-sm font-medium text-zinc-600">Stale deals</div>
            <div className="mt-1 text-2xl font-semibold text-zinc-900">{String(staleDeals)}</div>
            <div className="mt-1 text-sm text-zinc-500">No touch in 14+ days</div>
          </div>
        </div>
      </div>

      <div className="text-sm text-zinc-500">
        Note: This dashboard reads directly from Postgres via Prisma on the server.
      </div>
    </div>
  );
}