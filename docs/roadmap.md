# AI CRM – Roadmap

## Phase 1: Usable cockpit (no AI required)
1. App shell (layout + navigation)
2. Deals list (basic CRUD later)
3. Tasks system:
   - Today dashboard view
   - Add-to-Today quick task from any record
4. Activities timeline per deal (manual log)
5. Stale detection (based on lastTouch from activities)
6. Export/Import JSON (safety net)

## Phase 2: Assistant (cost-minimized)
1. Deterministic command bar for common actions (no AI)
2. Action schema + validator + preview diff UI
3. AI fallback for ambiguous requests (JSON-only)
4. Audit log of assistant-applied changes

## Phase 3: Email logging (Outlook constraints)
1. Outbound logging via BCC to Gmail logger
2. Poll Gmail inbox + store metadata/snippet only
3. Update lastTouch + create activities
4. Inbound replies: manual log or Reply-To if possible
