# AILoveCode Workflow Guidelines

## Workflow Awareness

When the project contains AILoveCode Workflow files (such as `workflow/guidelines.md`, `AGENTS.md`, or `CLAUDE.md` referencing the workflow), AI should assume the workflow is active.

Rules:

* Do not ask whether AILoveCode Workflow exists if workflow files are already present.
* Read `workflow/guidelines.md` before performing workflow-related actions.
* Follow workflow instructions before applying generic AI behavior.
* Workflow rules take precedence over default task management behavior.

---

## Command-First Policy

When an official AILoveCode Workflow command exists for a workflow action, AI must attempt that command before using lower-level file operations.

Examples:

```bash
npx ailovecode-workflow create-task "task-name"
npx ailovecode-workflow update
```

Rules:

* Prefer official workflow commands over manual file creation.
* Prefer official workflow commands over direct file editing when a workflow command exists.
* Manual file operations are fallback mechanisms.
* Do not bypass official workflow commands without a valid reason.
* If a command fails, explain the failure and proceed with the documented fallback process.

---

## Task Creation

### Primary Method

When creating a new task, AI must first attempt to use the official task creation command.

```bash
npx ailovecode-workflow create-task "new-task"
```

Rules:

* AI must attempt the official command before performing manual task creation.
* The command should be executed using the agent's command execution capability when available.
* AI must not manually create task folders or files before attempting the official command.
* AI should not ask for confirmation when the user explicitly requests task creation.

### Fallback Method

Manual task creation is allowed only when:

* the command execution fails
* the command is not installed or unavailable in the environment
* the user explicitly requests manual creation

Required structure:

```txt
/workflow/tasks
  /YYYYMMDDTHHMM_task-name
    task.md
    implementation-plan.md

    /supporting-materials
```

Rules:

* `task.md` should be created using the recommended task template
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

### Recommended Template

```md
## Context

## Request

## Reference
```

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

Example:

```md
## Milestone 1 - Foundation

### Goal

Prepare the project structure.

### Tasks

- [ ] Create database migration
- [ ] Create model
- [ ] Create API endpoint

### Exit Criteria

API endpoint is functional.

### Implemented In

- app/Models/User.php
- database/migrations/xxxx.php
```

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

* answer questions
* clarify requirements
* discuss implementation approaches
* identify risks
* suggest considerations
* review additional requirements provided by the user

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
* Use the official workflow commands when available
* Follow the Command-First Policy
* Read workflow guidelines before workflow actions
* Respect task ownership boundaries
* Do not modify `task.md` unless explicitly requested
* Do not create or modify `implementation-plan.md` without explicit planning request
* Workflow commands are the preferred execution path and should be attempted before manual alternatives
