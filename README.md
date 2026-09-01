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

## Split-Repository Setup

Use split-repository mode when workflow tasks should live in a development-management repository while implementation happens in a separate target repository.

Install and initialize AILoveCode Workflow only in the task repository, then link the implementation repository:

```bash
cd path/to/workflow-dev
npx ailovecode-workflow init
npx ailovecode-workflow configure-dev "path/to/implementation-project"
```

`configure-dev` validates both Git repositories, resolves their absolute paths, and creates or replaces a managed `<workflow-dev>` block in `AGENTS.md` and `CLAUDE.md`:

```text
<workflow-dev>
Implementation repository:

`C:\path\to\implementation-project`

Workflow task repository:

`C:\path\to\workflow-dev`
...
</workflow-dev>
```

The generated routing rules keep:

* tasks, plans, supporting materials, progress, and task-local review reports in the workflow task repository
* source code, implementation tests, builds, and implementation commits in the implementation repository

The command does not modify or install workflow files in the implementation repository. Run it again with a different target path to reconfigure the link; the existing managed block is replaced rather than duplicated.

### Split-Repository Flow

| Phase | Workflow task repository | Implementation repository |
| --- | --- | --- |
| Setup | Install AILoveCode Workflow and run `configure-dev` | Remains free of workflow files |
| Task | Create, write, and understand `task.md` | No changes |
| Plan | Create and maintain `implementation-plan.md` | Read target instructions and inspect relevant code |
| Implement | Track decisions and milestone progress | Change code and tests; run target validation |
| Review | Read each task and plan; store task-local review reports | Collect and review the target branch diff |
| Git handoff | Commit workflow artifacts only when requested | Commit implementation changes only when requested |

The two repositories keep independent branches and Git histories. A commit, push, or PR action in one repository does not authorize the same action in the other.

In the first split-repository version, `review-context` does not automatically combine repositories. The reviewing agent collects the target `<base>...HEAD` diff in the implementation repository, reads each active task and plan from the workflow repository, and stores each final report in its task directory in the workflow repository.

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

including all existing tasks, supporting materials, and task-local reviews. Updating does not create a global reviews directory.

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

Use JSON output for integrations or reliable multi-task path mapping:

```bash
npx ailovecode-workflow review-context main --json
```

The generated Markdown includes:

* selected base, current branch, commits, and merge base
* changed-file names and statuses
* every changed `workflow/tasks/*/task.md` or `implementation-plan.md` pair
* one `workflow/tasks/<task-id>/reviews/YYYYMMDDTHHMMSS.md` output path per discovered task
* the complete branch diff

Generated files under both `workflow/reviews/**` and task-local `workflow/tasks/*/reviews/**` paths are excluded so previous reports cannot affect later reviews. `review-context` only collects inputs and identifies output paths; it does not create directories, generate reports, or write files. The connected coding agent performs the review, saves one report per task, and returns the aggregate result to the human responsible for final approval.

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
* One saved `workflow/tasks/<task-id>/reviews/<timestamp>.md` report per task

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

AI Code Review is read-only for code, task, plan, and previous report files unless the user separately requests fixes. Its only automatic writes are new AI-owned reports under each task's `reviews/` directory. Reruns create new timestamped history instead of replacing earlier reviews, and generated reports are excluded from future review diffs. The verdict informs human review and does not replace human approval.

### Review Report

Each reviewed task receives a timestamped report:

```text
workflow/
└── tasks/
    └── YYYYMMDDTHHMM_task-name/
        └── reviews/
            ├── 20260901T230015.md
            └── 20260901T230047.md
```

Each report contains task and Git metadata, the task's three review dimensions, actionable findings, and its verdict. The newest timestamped filename is the latest review; no duplicated `latest.md` is created. Cross-task and PR-level findings remain in the aggregate response rather than a new global file. The AI does not commit or push reports unless the user explicitly requests that action.

---

## Project Structure

```txt
workflow/
├── guidelines.md
├── README.md
└── tasks/
│   └── YYYYMMDDTHHMM_task-name
│       ├── task.md
│       ├── implementation-plan.md
│       ├── supporting-materials/
│       └── reviews/
│           └── YYYYMMDDTHHMMSS.md
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
