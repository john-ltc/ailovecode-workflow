# AILoveCode Workflow

This project uses AILoveCode Workflow for AI-assisted software development.

## Quick Start

The development workflow uses these prompts and review steps:

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

### 5. Create a Pull Request

Create a pull request from the implementation branch into its intended base branch.

### 6. Review the Pull Request

```text
Review this PR.
```

The AI should collect the branch context with:

```bash
npx ailovecode-workflow review-context <base>
```

For example:

```bash
npx ailovecode-workflow review-context main
```

The base may be omitted when the remote default, `main`, or `master` can be detected safely.

### 7. Human Review and Merge

The AI saves the standardized result under `workflow/reviews/`, then returns the same result for final human review. It does not approve or merge the pull request.

The AI should follow the rules defined in `guidelines.md` throughout the process.

---

## Split-Repository Workflow

When tasks belong in this repository but implementation belongs in another Git repository, configure an explicit target:

```bash
npx ailovecode-workflow configure-dev "path/to/implementation-project"
```

The command writes one managed `<workflow-dev>` block to `AGENTS.md` and `CLAUDE.md`. It records the absolute workflow task and implementation repository paths and may be rerun safely to change the target.

Responsibilities are split as follows:

```text
Workflow task repository
├── task.md
├── implementation-plan.md
├── supporting-materials/
└── workflow/reviews/

Implementation repository
├── source code
├── implementation tests
├── builds and validation
└── implementation Git history
```

Before target work, the AI reads repository-specific instructions and checks branch/worktree state in both repositories. It does not install workflow files in the implementation repository or commit/push either repository without explicit permission.

For split-repository review, the AI combines the target repository's `<base>...HEAD` diff with the active task and plan from this repository, then saves the review report here. Automatic cross-repository `review-context` discovery is not part of the first version.

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

### reviews

AI-owned PR review reports stored as one current Markdown file per branch. The AI may create or update the applicable report during review but should not modify other workflow or implementation files without a separate request.

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
    ↓
Create PR
    ↓
AI Code Review
    ↓
Human Review
    ↓
Merge
```

For larger features, AI may provide a Development Checkpoint when there is something meaningful to test.

---

## AI Code Review

AI Code Review checks the complete `<base>...HEAD` branch diff against the task and plan that describe the intended change.

For every discovered task, the review reports:

* Task Alignment
* Plan Alignment
* Engineering

It then reports PR-level concerns such as cross-task conflicts, unrelated changes, or excessive scope. Findings use Critical, High, Medium, or Low severity. The overall verdict is PASS, WARNING, or CHANGES REQUESTED.

`task.md` remains the highest authority. A reasonable deviation from `implementation-plan.md` is not automatically a defect, but meaningful deviations should be explained or reflected in the plan.

Review mode is read-only for implementation, task, and plan files. Its only automatic write is the standardized AI-owned report. Asking for a review does not authorize fixes, commits, pushes, PR updates, approval, or merge operations.

### Review Report

Each branch has one current report:

```text
workflow/reviews/<branch-slug>.md
```

For example, `feature/add-code-review` uses:

```text
workflow/reviews/feature-add-code-review.md
```

The report contains the base, branch, reviewed commit, timestamp, discovered tasks, per-task findings, PR-level review, and overall verdict. The AI creates or replaces this file after each review so it always represents the current reviewed commit. It does not commit or push the report unless explicitly requested.

### Review Context Discovery

The official command collects review inputs without invoking an AI provider:

```bash
npx ailovecode-workflow review-context [base]
```

It discovers task directories when `task.md` or `implementation-plan.md` changed in the branch. When only one document changed, both available documents from that directory are included. Multiple task directories remain separate.

The output also identifies the deterministic report path. Files under `workflow/reviews/**` are excluded from changed-file discovery and the branch diff so an earlier generated report cannot affect a later review.

If no task documents are discovered, the AI checks PR metadata, branch context, and commit messages before asking the user which task the PR implements.

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
