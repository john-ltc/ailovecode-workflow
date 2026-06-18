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

Install AILoveCode Workflow into your project:

```bash
npm install -D github:john-ltc/ailovecode-workflow
```

Initialize the workflow:

```bash
npx ailovecode-workflow init
```

This creates:

```txt
workflow/
├── guidelines.md
├── README.md
└── tasks/

AGENTS.md
CLAUDE.md
```

---

## Updating Workflow

Update the installed workflow files:

```bash
npx ailovecode-workflow update
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

including all existing tasks and supporting materials.

---

## Create Task

Create a new task:

```bash
npx ailovecode-workflow create-task "new-feature"
```

Example:

```bash
npx ailovecode-workflow create-task "add-user-profile"
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

## Check Version

```bash
npx ailovecode-workflow version
```


---

## Recommended Workflow

### 1. Create Task

**Human → AI**

Prompt:

```text
Create task "add-user-profile"
```

Expected outcome:

* A new task folder is created
* `task.md` is created
* `implementation-plan.md` is created
* `supporting-materials/` is created

Implementation detail:

```bash
npx ailovecode-workflow create-task "add-user-profile"
```

### 2. Write Requirements

**Human**

Write requirements in:

```txt
task.md
```

### 3. Understand the Task

**Human → AI**

Prompt:

```text
Understand the task.
```

Expected outcome:

* Task summary
* Key requirements
* Clarifications
* Ready for planning

### 4. Create Implementation Plan

**Human → AI**

Prompt:

```text
Create an implementation plan for this task.
```

Expected outcome:

* Implementation plan
* Architecture decisions
* Testing approach
* Milestones

### 5. Implement the Plan

**Human → AI**

Prompt:

```text
Implement the plan.
```

Expected outcome:

* Code changes
* Progress updates
* Development Checkpoint (when useful)
* Completed implementation

### Workflow Overview

```text
Human → AI
  ↓
Create Task

Human
  ↓
Write task.md

Human → AI
  ↓
Understand the task

Human → AI
  ↓
Create implementation plan

Human → AI
  ↓
Implement the plan
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
* Workflow commands are the preferred workflow interface.
* Manual file operations remain supported as a fallback.

---

## License

MIT
