# AILoveCode Workflow Guidelines

These guidelines define the workflow rules for this project.

AILoveCode Workflow is a lightweight workflow for AI-assisted software development.

The goal is to keep development:

- simple
- traceable
- maintainable
- practical
- easy for humans and AI tools to follow

---

# Core Structure

```txt
/workflow
  guidelines.md

  /tasks
    /YYYYMMDDTHHMM_task-name
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

# Task Folder Naming

Each task folder must use this format:

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

- Use 24-hour time.
- Use lowercase kebab-case for the task name.
- Keep the task name short but meaningful.
- Do not manually remove the timestamp.
- The timestamp represents task creation time.

---

# task.md

`task.md` is the user-owned source of truth.

It may contain:

- requirements
- issues
- rough notes
- screenshots
- copied discussions
- implementation requests
- clarification questions

Rules:

- AI must read and follow `task.md`.
- AI must not modify `task.md` unless explicitly requested.
- AI must not silently rewrite user intent.
- AI must not remove or replace user-provided information.

---

# implementation-plan.md

`implementation-plan.md` is the AI/developer execution workspace.

It may contain:

- implementation planning
- architecture notes
- technical decisions
- testing plans
- progress tracking
- clarification findings
- risks
- suggested build order

Rules:

- AI may create and update `implementation-plan.md`.
- AI should keep it structured and clear.
- AI should use this file for planning before implementation.
- AI should update this file when meaningful implementation progress or decisions happen.
- AI should avoid unnecessary complexity.

---

# supporting-materials

`supporting-materials` is an optional folder for files that support the task.

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
Keep all task-related references together.
```

---

# AI Workflow Rules

Before implementation, AI should:

1. Read `workflow/guidelines.md`.
2. Read the relevant `task.md`.
3. Check `implementation-plan.md` if it already exists.
4. Create or update `implementation-plan.md`.
5. Wait for human approval if the user asks for approval before coding.
6. Implement only what is required by the task.
7. Keep changes focused.

---

# Important Rules

## Do

- Keep the workflow lightweight.
- Keep tasks self-contained.
- Keep documentation minimal.
- Prefer updating the relevant `implementation-plan.md`.
- Ask for clarification when requirements are unclear and implementation risk is high.
- Follow the existing project style and conventions.

## Do Not

- Do not create random documentation files.
- Do not modify `task.md` unless explicitly requested.
- Do not create unnecessary folders.
- Do not turn this workflow into a heavy project management system.
- Do not over-document small changes.
- Do not change core workflow files unless requested.

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

# Tool Integration

AI tool instruction files such as `AGENTS.md` and `CLAUDE.md` should reference this file instead of duplicating all workflow rules.

Recommended integration block:

```md
<ailovecode-workflow>
This project uses AILoveCode Workflow.

Before implementation:

1. Read `workflow/guidelines.md`.
2. Read the relevant `workflow/tasks/*/task.md`.
3. Use `implementation-plan.md` for planning and progress.
4. Do not modify `task.md` unless explicitly requested.

Core rule:

`task.md` is the user-owned source of truth.
</ailovecode-workflow>
```

---

# Final Principle

```txt
task.md = user intent
implementation-plan.md = execution plan
supporting-materials = task evidence/context
guidelines.md = workflow rules
```
