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
├── tasks/
└── reviews/

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
workflow/reviews/
```

including all existing tasks, supporting materials, and review reports.

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

## Collect PR Review Context

Collect the branch diff and related task documents before an AI code review:

```bash
npx ailovecode-workflow review-context main
```

`main` is the branch the current branch will merge into. The command uses the merge-base comparison `main...HEAD`, so it collects changes introduced by the current branch.

The base is optional:

```bash
npx ailovecode-workflow review-context
```

When omitted, the command checks the remote default branch, then existing `main` and `master` refs. An explicit base always takes precedence.

The generated Markdown includes:

* selected base, current branch, commits, and merge base
* the standardized `workflow/reviews/<branch-slug>.md` report path
* changed-file names and statuses
* every changed `workflow/tasks/*/task.md` or `implementation-plan.md` pair
* the complete branch diff

Generated files under `workflow/reviews/**` are excluded so a previous report cannot affect a later review. `review-context` only collects inputs and identifies the output path; it does not generate or write the report. The connected coding agent performs the review, saves the report, and returns the same result to the human responsible for final approval.

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

### 6. Create a Pull Request

**Human**

Create a pull request from the implementation branch into its intended base branch.

### 7. Run AI Code Review

**Human → AI**

Prompt:

```text
Review this PR.
```

Expected outcome:

* Task alignment review
* Implementation-plan alignment review
* Engineering review
* PR-level review
* Standardized findings, severity, and verdict
* Saved `workflow/reviews/<branch-slug>.md` report

The AI should use the official context command when available:

```bash
npx ailovecode-workflow review-context <base>
```

### 8. Human Review and Merge

**Human**

Review the implementation and AI findings, then decide whether the PR is ready to merge.

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

Human
  ↓
Create PR

Human → AI
  ↓
AI Code Review

Human
  ↓
Human Review and Merge
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

### AI Code Review

The review evaluates each task independently across:

* task alignment
* implementation-plan alignment
* engineering quality

It then performs a PR-level review for cross-task conflicts, unrelated changes, and excessive scope. Findings use Critical, High, Medium, or Low severity, with an overall verdict of PASS, WARNING, or CHANGES REQUESTED.

AI Code Review is read-only for code, task, and plan files unless the user separately requests fixes. Its only automatic write is the AI-owned report at `workflow/reviews/<branch-slug>.md`. Reruns replace the same branch report, and generated reports are excluded from future review diffs. The verdict informs human review and does not replace human approval.

### Review Report

Each branch has one current report:

```text
workflow/
├── tasks/
└── reviews/
    └── feature-add-code-review.md
```

The report contains review metadata, independent task reviews, the PR-level review, actionable findings, and the overall verdict. The AI creates or updates it after reviewing committed `HEAD`; it does not commit or push the report unless the user explicitly requests that action.

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
└── reviews/
    └── feature-branch-name.md
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
