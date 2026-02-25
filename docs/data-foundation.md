# AI CRM – Data Foundation (Closest to HTML v1)

## Design Principle
- **Contacts** and **Companies** are the master records (real-world entities).
- There is **one canonical pipeline record** that **moves** through buckets:
  - Lead → Deal → Account
- Conversions are **updates**, not new records.
- Tasks and Activities attach to this canonical record to power the “Today” cockpit.

---

## Master Records

### Company
Represents an organization.

**Fields (v1)**
- id
- name (required)
- website (optional)
- industry (optional)
- createdAt / updatedAt

### Contact
Represents a person.

**Fields (v1)**
- id
- companyId (optional but preferred)
- fullName (required)
- email (optional, ideally unique when present)
- phone (optional)
- title (optional)
- createdAt / updatedAt

---

## Canonical Pipeline Record (Single record that converts)

### Engagement
This is the single record that appears as a Lead, Deal, or Account depending on **bucket**.

**Why**
- Avoid duplicate records across Leads/Deals/Accounts
- Preserve history and references (tasks, activities) across conversions

**Fields (base)**
- id
- companyId (required)
- primaryContactId (optional at first; preferred)
- bucket: LEAD | DEAL | ACCOUNT
- product (text/enum) e.g., NetSuite, Dynamics, Oracle
- source (text/enum) e.g., SelectHub, SoftwareConnect, Website, Outbound
- notes (text)
- nextStep (text)
- followUpRequired (boolean)
- lastTouchAt (datetime; v1 can store directly, later derive from activities)
- createdAt / updatedAt

**Deal-only fields (nullable unless bucket=DEAL)**
- dealStage: DISCOVERY | DEMO | PROPOSAL | ON_HOLD | CLOSED_WON | CLOSED_LOST
- meetingScheduledAt (datetime, optional)
- closeDateTarget (date/datetime, optional)
- value (number, optional)

**Account-only fields (nullable unless bucket=ACCOUNT)**
- accountStatus: ACTIVE | FORMER
- billingSchedule (text, optional)
- contractStart (date/datetime, optional)
- contractEnd (date/datetime, optional)

---

## Operational Records

### Task
A to-do item that powers the “Today” dashboard.

**Fields**
- id
- engagementId (required)
- title
- dueAt
- status: OPEN | DONE
- type: CALL | EMAIL | MEETING | INTERNAL
- priority (optional)
- createdAt / updatedAt

### Activity
An interaction (email/call/meeting/note).

**Fields**
- id
- engagementId (required)
- contactId (optional but recommended)
- type: EMAIL_OUT | EMAIL_IN | CALL | MEETING | NOTE
- occurredAt
- subject (optional)
- snippet (optional)
- externalMessageId (optional; for Gmail message id later)
- metadata (json; optional)
- createdAt / updatedAt

---

## Conversions (No new records)

### Lead → Deal
Update the same Engagement:
- bucket = DEAL
- dealStage = DISCOVERY (default)

### Deal → Account (Won)
Update the same Engagement:
- dealStage = CLOSED_WON
- bucket = ACCOUNT
- accountStatus = ACTIVE

### Account → Former
Update the same Engagement:
- accountStatus = FORMER

---

## UI Mapping (Closest to HTML)
- Leads tab: Engagements where bucket=LEAD
- Deals/Pipeline tab: Engagements where bucket=DEAL (grouped by dealStage)
- Accounts tab: Engagements where bucket=ACCOUNT (active/former sections)
- “Add to Today”: create Task with dueAt=today linked to engagementId
