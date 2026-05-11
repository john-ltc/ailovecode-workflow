# AILoveCode Workflow

A lightweight workflow for AI-assisted software development.

## Philosophy

This project focuses on:

- lightweight workflow
- structured task management
- minimal documentation
- predictable implementation flow

The goal is to make AI-assisted development:

- cleaner
- more maintainable
- more traceable

---

# Core Concepts

## task.md

User-owned source of truth.

This file may contain:

- requirements
- issues
- rough notes
- screenshots
- copied discussions
- implementation requests

Rules:

- AI should read and follow `task.md`
- AI should NOT modify `task.md` unless explicitly requested

---

## implementation-plan.md

AI execution workspace with human review and approval.

This file may contain:

- implementation planning
- architecture notes
- technical decisions
- testing plans
- progress tracking
- clarification findings

---

## guidelines.md

Defines the workflow rules.

This file contains:

- project structure
- task rules
- AI workflow conventions
- documentation philosophy
- contributor expectations

---

# Workflow Structure

```txt
/workflow
  guidelines.md

  /tasks
    /20260429T1530_new-feature
      task.md
      implementation-plan.md

      /supporting-materials

  /tools
    /install
      install-workflow.sh
      install-workflow.bat

    /task
      create-task.sh
      create-task.bat
```

---

# Task Structure

Each task should follow:

```txt
/tasks
  /20260429T1530_new-feature
    task.md
    implementation-plan.md

    /supporting-materials
```

Task naming format:

```txt
YYYYMMDDTHHMM_task-name
```

Examples:

```txt
20260429T1530_create-project
20260429T1600_new-feature
20260429T1730_fix-issue
```

---

## supporting-materials

Optional files that support task implementation.

Examples:

- screenshots
- logs
- request payloads
- response payloads
- recordings
- exported files
- reference images
- copied discussions

Purpose:

```txt
Keep all task-related references together within task.
```

---

# Installation

Copy the `workflow/` directory into your project root.

Example:

```txt
my-project/
  workflow/
```

Then run the install tool.

## Windows

```powershell
.\workflow\tools\install\install-workflow.bat
```

## Linux/macOS

```bash
./workflow/tools/install/install-workflow.sh
```

The install tool updates:

- `AGENTS.md`
- `CLAUDE.md`

so AI tools can follow the workflow automatically.

---

# Create Task

The task creation tool helps create a new task structure automatically.

## Windows

```powershell
.\workflow\tools\task\create-task.bat "new feature"
```

## Linux/macOS

```bash
./workflow/tools/task/create-task.sh "new feature"
```

Example output:

```txt
/tasks
  /20260429T1530_new-feature
    task.md
    implementation-plan.md

    /supporting-materials
```

---

# Recommended Workflow

```txt
1. Human creates task folder
2. Human writes task.md
3. AI reads task.md
4. AI creates implementation-plan.md
5. Human reviews and approves implementation plan
6. AI implements changes
```

---

# Notes

- The workflow is intentionally lightweight.
- Tools are optional helpers.
- Tasks are the center of the workflow.
- Keep documentation minimal and practical.

---

# Contributing

Core workflow files should remain stable unless changes are discussed first.

---

# License

MIT
