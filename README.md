# AI CRM

A lightweight sales CRM dashboard built for solo operators and small teams. Tracks leads, deals, accounts, tasks, and activity in a clean Next.js interface backed by PostgreSQL.

Built to replace spreadsheet-based pipeline tracking with something structured, fast, and actually usable day-to-day.

---

## What It Does

- **Pipeline view** — deals bucketed by stage (Discovery → Demo → Proposal → Closed Won/Lost)
- **Lead & account tracking** — separate buckets for leads, active deals, and managed accounts
- **Task management** — open tasks with due dates, overdue flagging, and task types (call, email, meeting, internal)
- **Activity log** — full history of outbound emails, calls, meetings, and notes per engagement
- **Dashboard** — at-a-glance counts for leads, deals, accounts, tasks due today, and overdue items

---

## Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL (Neon serverless)
- **Styling**: Tailwind CSS

---

## Data Model

```
Company → Contacts → Engagements (Lead / Deal / Account)
                           ↓
                    Tasks + Activities
```

Deal stages: `DISCOVERY → DEMO → PROPOSAL → ON_HOLD → CLOSED_WON / CLOSED_LOST`

---

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/siddhantkalra/ai-crm.git
cd ai-crm
npm install

# 2. Set up your database
cp .env.example .env
# edit .env: DATABASE_URL=your_postgres_connection_string

# 3. Run migrations
npx prisma migrate dev

# 4. Start
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
ai-crm/
├── app/
│   ├── page.tsx              # Main dashboard
│   └── api/
│       └── engagements/      # API routes
├── lib/
│   └── prisma.ts             # Prisma client
├── prisma/
│   └── schema.prisma         # Full data model
└── scripts/                  # Seed / migration scripts
```
