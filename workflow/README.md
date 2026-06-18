# AILoveCode Workflow

This project uses AILoveCode Workflow for AI-assisted software development.

## Quick Start

Most tasks can be completed using these four prompts:

### 1. Create Task

```text
Create task "new-task"
```

Example:

```text
Create task "add appointment booking"
```

### 2. Understand the Task

```text
Understand the task.
```

### 3. Create Implementation Plan

```text
Create an implementation plan for this task.
```

### 4. Implement the Plan

```text
Implement the plan.
```

The AI should follow the rules defined in `guidelines.md` throughout the process.

---

## Important Files

### guidelines.md

Workflow rules and AI behavior guidelines.

### task.md

User-owned source of truth.

May contain:

* requirements
* issues
* notes
* screenshots
* copied discussions
* implementation requests

Core rule:

```text
Do not modify task.md unless explicitly requested.
```

### implementation-plan.md

AI-owned implementation workspace.

May contain:

* implementation planning
* architecture notes
* technical decisions
* testing plans
* progress tracking

### supporting-materials

Task-related references.

Examples:

* screenshots
* logs
* request payloads
* response payloads
* recordings
* exported files
* copied discussions

---

## Recommended Workflow

```text
Create Task
    ↓
Write task.md
    ↓
Understand the task
    ↓
Create implementation plan
    ↓
Implement the plan
```

For larger features, AI may provide a Development Checkpoint when there is something meaningful to test.

---

## Recommended task.md Template

```md
## Context

## Request

## Reference
```

Example:

```md
## Context

I'm facing an issue where the Telegram preview displays unexpected spacing at the top when scrolling down on the campaign edit page.

## Request

Investigate the root cause and remove the extra spacing.

## Reference

supporting-materials/image.png
```
