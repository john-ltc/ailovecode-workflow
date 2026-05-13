# AILoveCode Workflow Guidelines

## Task Creation

When creating a new task, use the official task creation tool if available.

### Windows

```powershell
.\workflow\tools\task\create-task.bat "task name"
```

### Linux/macOS

```bash
./workflow/tools/task/create-task.sh "task name"
```

If the tool is unavailable, AI should manually create the same structure.

Required structure:

```txt
/workflow/tasks
  /YYYYMMDDTHHMM_task-name
    task.md
    implementation-plan.md

    /supporting-materials
```

Rules:

- `task.md` must be created empty
- `implementation-plan.md` must be created empty
- Do not pre-generate implementation plans during task creation
- Human writes `task.md` first
- AI creates `implementation-plan.md` only after reading `task.md`

---

## Task Folder Naming

Task folders live under `workflow/tasks` and must follow:

```txt
YYYYMMDDTHHMM_task-name
```

Examples:

```txt
20260429T1530_create-project
20260429T1600_new-feature
20260429T1730_fix-issue
```

Rules:

- Use 24-hour time
- Use lowercase kebab-case
- Keep names short and meaningful

---

## task.md

`task.md` is the user-owned source of truth.

It may contain:

- requirements
- issues
- rough notes
- screenshots
- copied discussions
- implementation requests
- clarification notes

Rules:

- Read `task.md` before implementation
- Do not modify `task.md` unless explicitly requested
- Do not overwrite user intent
- Do not silently rewrite requirements

---

## implementation-plan.md

Use `implementation-plan.md` for:

- implementation planning
- architecture notes
- technical decisions
- progress tracking
- clarification findings
- testing plans

Rules:

- Create or update `implementation-plan.md` before implementation
- Keep implementation notes concise and practical
- Update the plan when meaningful decisions or progress happen
- Keep task-related implementation details inside the task folder

---

## implementation-plan.md Structure

`implementation-plan.md` should follow this structure:

```md
# Implementation Plan: Task Name

## Summary

## Goals

## Architecture

## Implementation Steps

## Testing

## Progress
```

---

## Milestone Format

Inside `Implementation Steps`, use milestones with checkboxes.

Example:

```md
## Implementation Steps

### Milestone 1: Example Milestone

- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

Exit criteria:

- [ ] Expected result

Implemented in:

- [path/to/file.php](path/to/file.php)
```

Rules:

- Use milestones for meaningful implementation phases
- Use checkboxes for trackable progress
- Each milestone should have exit criteria
- Add `Implemented in` section when implementation is completed
- Keep milestones focused and practical

---

## supporting-materials

Use `supporting-materials` for task-related files.

Examples:

- screenshots
- logs
- request payloads
- response payloads
- recordings
- exported files
- reference materials
- copied discussions

Purpose:

```txt
Keep all task-related references together.
```

---

## AI Workflow

Before implementation:

1. Read `workflow/guidelines.md`
2. Read `task.md`
3. Read `implementation-plan.md` if it exists
4. Update `implementation-plan.md`
5. Implement changes

---

## Documentation Rules

- Keep documentation minimal and practical
- Avoid unnecessary documentation files
- Avoid duplicate documentation
- Keep task-related information inside the relevant task folder
- Prefer updating existing files over creating new ones

---

## Important Rules

- Follow existing project conventions
- Keep changes focused
- Avoid unnecessary refactoring
- Do not modify workflow structure unless requested
- Use workflow tools when available
- Workflow tools are helpers, not hard dependencies
