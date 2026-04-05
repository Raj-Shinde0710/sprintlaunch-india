
## Phase 1: UI Redesign — Sidebar Layout (Priority)
- Replace top Navbar with a fixed left sidebar using shadcn Sidebar component
- Sidebar items: Dashboard, Ideas, Sprints, Tasks, Repository, Timeline, AI Mentor, Trial Room, SOP/Playbook, Automation, Validation, Finance, Investor Tracker
- Icons + labels, active state highlighting, collapsible
- Create a new `AppLayout` wrapper component used by all pages
- Update all page routes to use the new layout

## Phase 2: Core New Pages (Static UI + Mock Data First)
- **Trial Room** (Hiring): Micro-task assignment UI, candidate scoring cards
- **SOP / Playbook**: Knowledge base with search + AI chat interface
- **Automation**: Visual workflow cards (predefined templates like "Task completed → notify team")
- **Validation (Fake Door)**: Landing page builder with click/conversion tracking UI
- **Finance (Runway)**: Cash/expense/revenue inputs with burn rate chart
- **Investor Tracker**: Pitch deck upload + slide-level analytics UI

## Phase 3: Backend Integration
- Create database tables for: trial_tasks, sop_documents, automations, validation_pages, financial_records, investor_decks
- Add RLS policies
- Wire up the UI to real data

## Phase 4: AI Integration
- AI Behavioral Test scenarios for hiring
- AI SOP query answering via edge function
- Advanced AI Mentor (already partially built)
- Automation suggestion engine

## Phase 5: Dashboard Enhancement
- Execution dashboard with progress %, risk level, success score
- Enhanced timeline with all new event types

---

**Recommendation**: Start with Phase 1 (sidebar redesign) + Phase 2 (page scaffolding) so you can see the full structure immediately. Then we iterate on backend/AI features. Shall I proceed with Phase 1 & 2?
