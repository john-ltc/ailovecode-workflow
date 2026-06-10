# AILoveCode Workflow

A lightweight workflow for AI-assisted software development.

## Philosophy

This project focuses on:

* lightweight workflow
* structured task management
* minimal documentation
* predictable implementation flow

The goal is to make AI-assisted development:

* cleaner
* more maintainable
* more traceable

---

## Installation

Initialize the workflow in your project:

```bash
ailovecode-workflow init
```

This creates:

```txt
workflow/
├── guidelines.md
├── README.md
├── tasks/

AGENTS.md
CLAUDE.md
```

---

## Updating Workflow

Update an existing workflow installation:

```bash
ailovecode-workflow update
```

This updates:

* `workflow/guidelines.md`
* `workflow/README.md`
* workflow-managed sections in:

  * `AGENTS.md`
  * `CLAUDE.md`

This preserves:

```txt
workflow/tasks/
```

and any project-specific content outside the workflow-managed sections.

---

## Create Task

Create a new task:

```bash
ailovecode-workflow create-task "new-feature"
```

Example:

```bash
ailovecode-workflow create-task "add-user-profile"
```

Result:

```txt
workflow/tasks/
└── YYYYMMDDTHHMM_add-user-profile
    ├── task.md
    ├── implementation-plan.md
    └── supporting-materials/
```

---

## Recommended Workflow

### 1. Create Task

```bash
ailovecode-workflow create-task "new-feature"
```

### 2. Write Requirements

Write requirements in:

```txt
task.md
```

### 3. Understand the Task

```text
Understand the task.
```

### 4. Create Implementation Plan

```text
Create an implementation plan for this task.
```

### 5. Implement the Plan

```text
Implement the plan.
```

---

## Core Concepts

### task.md

User-owned source of truth.

Rules:

* AI should read and follow `task.md`
* AI should NOT modify `task.md` unless explicitly requested

### implementation-plan.md

AI execution workspace with human review and approval.

Used for:

* implementation planning
* architecture notes
* technical decisions
* testing plans
* progress tracking

### guidelines.md

Defines workflow rules and AI behavior.

---

## Project Structure

```txt
workflow/
├── guidelines.md
├── README.md
├── tasks/
│   └── YYYYMMDDTHHMM_task-name
│       ├── task.md
│       ├── implementation-plan.md
│       └── supporting-materials/
```

---

## Notes

* The workflow is intentionally lightweight.
* Tasks are the center of the workflow.
* Keep documentation minimal and practical.
* Workflow commands are optional conveniences, not hard requirements.

---

## License

MIT
