# AILoveCode Workflow Guidelines

## Task Creation

When creating a new task, use the official task creation command if available.

```bash
npx ailovecode-workflow create-task "new-task"
```

If the official task creation command is unavailable, AI should manually create the same structure.

Required structure:

```txt
/workflow/tasks
  /YYYYMMDDTHHMM_task-name
    task.md
    implementation-plan.md

    /supporting-materials
```

Rules:

* `task.md` must be created empty
* `implementation-plan.md` must be created empty
* Do not pre-generate implementation plans during task creation
* Human writes `task.md` first
* AI creates `implementation-plan.md` only after reading `task.md`

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

* Use 24-hour time
* Use lowercase kebab-case
* Keep names short and meaningful

---

## task.md

`task.md` is the user-owned source of truth.

It may contain:

* requirements
* issues
* rough notes
* screenshots
* copied discussions
* implementation requests
* clarification notes

Rules:

* Read `task.md` before implementation
* Do not modify `task.md` unless explicitly requested
* Do not overwrite user intent
* Do not silently rewrite requirements

---

## implementation-plan.md

Use `implementation-plan.md` for:

* implementation planning
* architecture notes
* technical decisions
* progress tracking
* clarification findings
* testing plans

Rules:

* Create or update `implementation-plan.md` only during the planning phase
* Keep implementation notes concise and practical
* Update the plan when meaningful decisions or progress happen
* Keep task-related implementation details inside the task folder

---

## implementation-plan.md Structure

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

Rules:

* Use milestones for meaningful implementation phases
* Use checkboxes for trackable progress
* Each milestone should have exit criteria
* Add `Implemented in` section when implementation is completed
* Keep milestones focused and practical

---

## Development Checkpoint

During implementation, the AI should identify the first meaningful point where the feature becomes runnable or testable.

At that point, the AI should pause and provide a Development Checkpoint update.

The purpose is to allow the user to test and validate the implementation before additional work continues.

A Development Checkpoint should only be created when there is something meaningful to test.

Do not create checkpoints for incomplete technical work that cannot be validated by the user.

The AI should use reasonable judgment to determine whether a Development Checkpoint provides value.

Small fixes, minor refactoring, documentation updates, or short tasks do not require a Development Checkpoint.

The goal is to provide checkpoints when they help the user validate progress, not to interrupt implementation unnecessarily.

---

## supporting-materials

Use `supporting-materials` for task-related files.

Examples:

* screenshots
* logs
* request payloads
* response payloads
* recordings
* exported files
* reference materials
* copied discussions

---

## AI Workflow

### Task Understanding Phase

1. Read `workflow/guidelines.md`
2. Read `task.md`
3. Provide a Task Understanding Response
4. Remain in discussion and clarification mode until planning is explicitly requested

### Planning Phase

1. Create or update `implementation-plan.md` only when explicitly requested by the user
2. Update the plan when meaningful decisions or changes occur

### Implementation Phase

1. Read `implementation-plan.md`
2. Implement changes
3. If the feature reaches a meaningful runnable or testable state before completion, create a Development Checkpoint
4. Continue implementation after user feedback or approval

---

## Task Understanding Response

When the user asks the AI to understand, analyze, review, or read a task, the AI should provide a concise task understanding summary before proceeding.

The response should include:

### Summary

A brief description of what the task is trying to achieve.

### Key Requirements

Important requirements identified from `task.md`.

### Clarifications

Any assumptions, risks, or unclear areas that may require confirmation.

### Next Step

State that the AI is ready for further discussion, clarification, or implementation planning.

---

## Planning Boundary

After providing a Task Understanding Response, the AI should remain in discussion and clarification mode.

The AI should not create, update, or modify `implementation-plan.md` unless the user explicitly requests planning.

Examples of explicit planning requests:

```text
Create an implementation plan for this task.
Update the implementation plan.
Generate the implementation plan.
Create a plan for this task.
```

During the discussion phase, the AI may:

- answer questions
- clarify requirements
- discuss implementation approaches
- identify risks
- suggest considerations
- review additional requirements provided by the user

However, the AI should not create or modify `implementation-plan.md` until planning is explicitly requested.

---

## Documentation Rules

* Keep documentation minimal and practical
* Avoid unnecessary documentation files
* Avoid duplicate documentation
* Keep task-related information inside the relevant task folder
* Prefer updating existing files over creating new ones

---

## Important Rules

* Follow existing project conventions
* Keep changes focused
* Avoid unnecessary refactoring
* Do not modify workflow structure unless requested
* Use the official workflow creation method when available
* Workflow commands are optional conveniences, not hard requirements.
