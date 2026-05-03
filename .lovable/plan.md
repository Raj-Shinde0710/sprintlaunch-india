# Department System Implementation Plan

This is a large architectural change. Here's the build plan.

## 1. Database Schema (Migration)

**New tables:**
- `departments` — `id, sprint_id, name, is_default, created_by, created_at`
- `department_members` — `id, department_id, user_id, sprint_id, joined_at` (unique on dept+user)
- `department_access_requests` — `id, department_id, sprint_id, user_id, message, status (pending/approved/rejected), created_at, decided_at`

**Altered tables (add nullable `department_id` for backward compat):**
- `tasks` — add `department_id`
- `sprint_messages` — add `department_id`
- `sprint_commits` (files) — add `department_id`
- `sprint_timeline` — add `department_id`
- `ai_chat_messages` — add `department_id` + `tool_type` (`mentor`/`planner`/`sop`)
- `sprint_applications` — add `department` (text, name selected at apply time)

**RLS policies:** All dept-scoped tables get a policy: visible if `auth.uid()` is sprint founder OR is a member of `department_id` (via `department_members`). Founder retains full access via existing sprint-founder check.

**Helper SQL function:** `is_department_member(_dept_id uuid, _user_id uuid)` SECURITY DEFINER to avoid RLS recursion.

**Trigger:** When a sprint is created, auto-insert the 8 default departments. When an application is approved (existing flow inserts into `sprint_members`), also insert into `department_members` for the chosen dept.

**Delete startup:** SQL function `delete_idea_cascade(idea_id)` callable by founder that removes idea + sprints + all related rows.

## 2. Frontend Changes

**New components:**
- `DepartmentSelector.tsx` — tab/dropdown at top of Sprint Workspace
- `DepartmentManager.tsx` — founder dialog: list, add (`+ Add Department`), delete
- `DepartmentAccessRequest.tsx` — builder "Request Access" dialog
- `FounderAccessRequests.tsx` — pending dept access requests panel

**Updated components:**
- `SprintWorkspace.tsx` — owns `selectedDepartmentId` state, passes to all children
- `SprintTaskBoard.tsx` — filter by `department_id`, set on insert
- `TeamChat.tsx` — filter messages by `department_id`
- `SprintRepository.tsx` — filter files by `department_id`
- `SprintTimeline.tsx` — filter timeline by `department_id`
- `AIMentor.tsx` — pass `departmentId` to edge fn, separate chat history
- `AISprintPlanner.tsx` — pass `departmentId`
- `SprintSOPSection.tsx` — pass `departmentId`
- `ApplicationFormDialog.tsx` — add department dropdown
- `FounderApplicationManager.tsx` — show selected dept; on approve, add to `department_members`
- `IdeaDetail.tsx` — add "Delete Startup" button (founder only) calling cascade RPC

## 3. Edge Functions

Update `ai-mentor-chat`, `ai-sop-chat`, `ai-sprint-planner`:
- Accept `departmentId`
- Filter tasks/members/timeline queries by that dept
- Inject department name + role focus into system prompt
- Persist `ai_chat_messages` rows with `department_id` + `tool_type`

## 4. Access Control Logic

Frontend gating: when loading Sprint Workspace, fetch user's accessible departments (`department_members` rows where `user_id = me`). Non-founders only see those depts in the selector. Founder sees all.

## 5. Default Department Seeding

Migration backfill: for every existing sprint, insert the 8 default departments and add the founder + all current `sprint_members` to a "General" dept (or all 8 to keep things working). I'll add them to all default depts so existing data stays visible to existing members.

## Out of scope / kept simple
- Tasks/files/messages without `department_id` (legacy) remain visible to all sprint members (RLS allows null dept_id) — avoids breaking existing data.
- "Delete Startup" hard-deletes; no soft-delete/recovery.

## Build order
1. Migration (schema + seed + trigger + delete RPC)
2. Edge functions update
3. Workspace state + selector + manager UI
4. Wire each section (tasks/chat/files/timeline/AI) to selected dept
5. Application flow: dept choice + access requests
6. Delete startup button

Confirm and I'll execute.