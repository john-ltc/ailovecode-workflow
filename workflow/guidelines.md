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

### AI Code Review Phase

1. Determine the PR base branch
2. Collect the `<base>...HEAD` diff and changed-file status
3. Discover every task and implementation plan associated with the branch
4. Review each task independently for task alignment, plan alignment, and engineering quality
5. Perform a final PR-level review
6. Return standardized findings and an overall verdict
7. Keep human review as the final approval before merge

AI Code Review is read-only for implementation artifacts. It may create or update only the standardized AI-owned review report under `workflow/reviews/`. A request to review code does not authorize modifying code, task files, plans, commits, branches, pull requests, or merge state. Fixes should only be implemented when the user separately requests them.

The review workflow applies whether the implementation was written manually or with any AI or development tool.

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

## AI Code Review

### Review Trigger

When the user asks to review a PR, branch, or implementation, AI should perform the AI Code Review phase. When the official context command is available, follow the Command-First Policy:

```bash
npx ailovecode-workflow review-context <base>
```

The base may be omitted when it can be detected safely:

```bash
npx ailovecode-workflow review-context
```

The context command collects review inputs and prints the standardized review-report path. It does not perform the review, write the report, or determine the verdict.

### Base Branch

The base is the branch that the reviewed branch is intended to merge into.

Select it in this order:

1. A base explicitly provided by the user
2. Base-branch metadata from the pull request
3. The remote default branch
4. An existing `main` branch
5. An existing `master` branch
6. Ask the user when the base remains ambiguous

Use the merge-base comparison `<base>...HEAD`. Do not silently use a base that cannot be resolved.

### Review Inputs

Collect:

* changed-file name and status from `<base>...HEAD`
* the complete `<base>...HEAD` code diff
* each `task.md` or `implementation-plan.md` introduced, modified, renamed, or deleted by the branch
* the matching task/plan document in the same task directory when only one of the pair changed
* relevant repository and code context needed to validate the changes

Do not assume that a single PR contains only one task.

Exclude `workflow/reviews/**` from changed-file discovery and the complete branch diff. Generated review reports are outputs of the review process and must not affect later findings or verdicts.

### Task Discovery

Use changed files as the primary discovery mechanism. A task directory is implicated when its `task.md` or `implementation-plan.md` changed.

For every implicated directory:

1. Read `task.md` when it exists
2. Read `implementation-plan.md` when it exists
3. Keep the pair independent from other task directories
4. Report missing or deleted documents explicitly

If no task directory is discovered:

1. Look for task references in PR metadata, the branch name, commit messages, and repository context
2. Read the referenced task and plan when found
3. Ask the user which task the PR implements if discovery still fails

Do not introduce or require an additional task manifest solely for review discovery.

### Source of Truth

Use this authority order:

```text
task.md
  -> highest authority: required outcome
implementation-plan.md
  -> intended implementation approach
actual code
  -> implementation being reviewed
```

Rules:

* Code that contradicts or fails an important requirement in `task.md` is a functional problem.
* A deviation from `implementation-plan.md` is not automatically a defect.
* Report a meaningful plan deviation and assess whether it is justified.
* Recommend updating the plan when the implementation is valid but the plan no longer describes it.
* Do not treat an outdated plan as having higher authority than a satisfied task requirement.

### Review Dimensions

Review each discovered task independently across three dimensions.

#### Task Alignment

Check whether the implementation:

* achieves the requested outcome
* implements important requirements and acceptance conditions
* avoids behavior that contradicts the task
* avoids unrelated or out-of-scope changes

#### Plan Alignment

Check whether the implementation:

* follows the intended architecture and implementation steps
* includes expected code, database, API, configuration, and test changes
* explains or reasonably justifies meaningful deviations
* leaves the plan accurate enough to remain useful

#### Engineering Review

Review for actionable technical problems, including:

* incorrect logic and edge cases
* security, authentication, authorization, and input validation
* error handling and failure behavior
* transactions, data consistency, and concurrency
* API and backward compatibility
* performance and resource usage
* consistency with repository architecture and conventions
* missing or insufficient tests
* unnecessary complexity or unrelated changes

Review the complete diff; do not limit engineering review to files that can be assigned to a specific task.

### Multiple Tasks and PR-Level Review

For a PR with multiple task directories:

1. Report task alignment, plan alignment, and engineering findings for each task separately
2. Do not merge all task requirements into one checklist
3. Then perform a PR-level review for cross-task conflicts, duplicated work, unrelated changes, and excessive PR scope

When the relationship between a code change and a task is unclear, report that uncertainty rather than inventing an association.

### Finding Format

Report only actionable findings. Each finding should include:

* severity
* concise title
* affected file and line when available
* explanation of the concrete impact
* the task or plan requirement involved, when applicable
* a practical remediation direction

Use these severities:

* **Critical** - severe security, data-loss, or production risk; must not merge
* **High** - significant functional, security, or compatibility problem; should be fixed before merge
* **Medium** - important missing case, test gap, maintainability issue, or task-alignment problem
* **Low** - minor, non-blocking improvement with concrete value

Do not inflate severity for stylistic preferences. Do not report praise, summaries, or general observations as findings.

### Dimension Status and Overall Verdict

Use `PASS`, `WARNING`, or `CHANGES REQUESTED` for each review dimension and for the overall verdict.

Apply these rules:

* Any Critical or High finding results in `CHANGES REQUESTED`.
* A Medium finding that proves an important task requirement is missing or incorrect results in `CHANGES REQUESTED`.
* Other Medium findings result in at least `WARNING`.
* Low findings result in at least `WARNING`.
* No actionable findings results in `PASS`.
* Unresolved task discovery or insufficient context results in `WARNING`, with the limitation stated clearly.

The overall verdict is the most severe applicable status across every task and the PR-level review. The AI verdict informs human review and never replaces human approval.

### Review Report

After completing the review, create or update the report path printed by `review-context`:

```text
workflow/reviews/<branch-slug>.md
```

Rules:

* Convert the full branch name to lowercase kebab-case; for example, `feature/add-code-review` becomes `feature-add-code-review`.
* For detached HEAD, use `detached-<12-character-commit>.md`.
* Create `workflow/reviews/` when it does not exist.
* Write the same standardized review shown to the user into the report.
* Include the base, head branch, reviewed commit, review timestamp, and discovered task paths in report metadata.
* On rerun, replace the existing branch report so it represents the current reviewed commit; do not append another review to the same file.
* Treat the report as AI-owned generated output. Do not place it inside an individual task directory because one PR may implement multiple tasks.
* Do not modify any other file as part of review.
* Do not commit, push, post, approve, or merge the report unless the user separately requests that action.
* If the user explicitly requests no file write, return the review without creating or updating the report.

The report write does not change the review verdict. If the report cannot be written, return the full review to the user and state the persistence error separately.

### Standard Review Output

Use this structure:

```md
# AI Love Code - PR Review

## Metadata

- Base: <base>
- Head: <branch>
- Commit: <full commit hash>
- Reviewed at: <ISO 8601 timestamp>
- Tasks:
  - <task path>

## Task 1 - <task name>

Task Alignment: PASS | WARNING | CHANGES REQUESTED
Plan Alignment: PASS | WARNING | CHANGES REQUESTED
Engineering: PASS | WARNING | CHANGES REQUESTED

### Findings

- HIGH - Finding title (`path/to/file:line`)
  Concrete impact and remediation direction.

## PR-Level Review

- Cross-task conflicts: none found
- Unrelated changes: none found
- Scope: appropriate

## Overall Verdict

PASS | WARNING | CHANGES REQUESTED
```

Omit an empty task finding list or write `No actionable findings.` State discovery or context limitations before the overall verdict.

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
