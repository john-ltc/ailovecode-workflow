# AILoveCode Workflow Guidelines

## Workflow Awareness

When the project contains AILoveCode Workflow files (such as `workflow/guidelines.md`, `AGENTS.md`, or `CLAUDE.md` referencing the workflow), AI should assume the workflow is active.

Rules:

* Do not ask whether AILoveCode Workflow exists if workflow files are already present.
* Read `workflow/guidelines.md` before performing workflow-related actions.
* Follow workflow instructions before applying generic AI behavior.
* Workflow rules take precedence over default task management behavior.

---

## Split-Repository Workflow

### Workflow Development Tag

When `AGENTS.md` or `CLAUDE.md` contains a `<workflow-dev>` block, the workflow task repository and implementation repository are separate.

The tag must identify:

* **Workflow task repository** - owns workflow tasks and AI workflow artifacts
* **Implementation repository** - owns the product source code and implementation history

When the user asks to configure or change this relationship, use the official command before editing instruction files manually:

```bash
npx ailovecode-workflow configure-dev <implementation-repository>
```

Treat the paths in the managed tag as routing metadata. They do not grant permission to make unrelated changes or bypass repository-specific instructions.

Before working:

1. Resolve and verify both repository paths
2. Confirm each path points to the expected Git worktree
3. Read workflow instructions in the task repository
4. Read applicable `AGENTS.md`, `CLAUDE.md`, and project instructions in the implementation repository
5. Check branch and worktree state independently in both repositories

If a required path is missing, inaccessible, ambiguous, or points to an unexpected repository, stop and ask the user before making changes.

### Artifact Ownership

Keep these in the workflow task repository:

* `workflow/tasks/`
* `task.md`
* `implementation-plan.md`
* task supporting materials
* task-local `workflow/tasks/<task-id>/reviews/` reports
* workflow progress and planning notes

Keep these in the implementation repository:

* application and library source code
* implementation tests
* migrations, configuration, and build changes required by the task
* implementation branch and commits
* target-specific build, lint, and test output when it belongs with the implementation

`task.md` in the workflow task repository remains the source of truth. Do not copy it into the implementation repository merely to make the repositories self-contained.

### Instruction Precedence

Workflow guidelines govern workflow phases, task ownership, planning boundaries, and review format. Implementation-repository instructions govern files and commands inside the implementation repository.

Follow both sets of instructions when they are compatible. If they conflict in a way that changes the requested outcome, file ownership, safety, or allowed actions, explain the conflict and ask the user before proceeding. The `<workflow-dev>` tag does not override more specific safety or repository instructions.

### Phase Routing

Route workflow phases as follows:

* **Task creation and understanding** - read and write only workflow artifacts in the task repository
* **Planning** - create or update `implementation-plan.md` in the task repository only when explicitly requested
* **Implementation** - edit code and run target commands in the implementation repository; record workflow progress in the task repository
* **Development checkpoint** - report target test instructions and update plan progress in the task repository when appropriate
* **Developer Task Review** - collect the implementation diff from the implementation repository, read each active task and plan from the task repository, and write one task-local review report per task
* **Implementation integration** - commit, push, create, summarize, review, or merge the implementation PR/branch only in the implementation repository and only with action-specific authorization
* **Task cleanup** - after confirmed implementation integration, perform separately authorized cleanup only in the workflow task repository that owns `workflow/tasks/`

The current `review-context` command performs automatic task discovery only when tasks and code share a repository. In split-repository mode, do not run it from the task repository and mistake that repository's diff for the implementation diff. Until cross-repository CLI support exists, collect the equivalent `<base>...HEAD` Git context in the implementation repository, combine it with the active task documents from the task repository, and construct collision-safe task-local Developer Task Review paths in the task repository using the same timestamp rules.

### Independent Git Boundaries

The repositories have independent branches, worktrees, histories, and remotes.

Rules:

* Run Git commands with an explicit working directory or otherwise make the active repository clear.
* Inspect both worktrees before editing and preserve unrelated user changes in each.
* Do not assume matching branch names, base branches, commits, or remotes.
* Do not stage task artifacts in the implementation repository.
* Do not stage implementation files in the task repository.
* Do not commit, amend, rebase, push, open a PR, submit a PR review, approve, request changes, merge, or delete a task folder unless the user explicitly requests that action.
* Authorization for an action in one repository does not authorize that action or a later action in the other.
* Never delete or manufacture a workflow task folder in an implementation repository that does not own `workflow/tasks/`.
* Treat implementation integration and workflow-task cleanup as independent outcomes. Report partial completion precisely and never claim integration succeeded because cleanup succeeded.

Do not install, initialize, or copy AILoveCode Workflow into the implementation repository unless the user explicitly requests it.

---

## Command-First Policy

When an official AILoveCode Workflow command exists for a workflow action, AI must attempt that command before using lower-level file operations.

Examples:

```bash
npx ailovecode-workflow create-task "task-name"
npx ailovecode-workflow update
npx ailovecode-workflow configure-dev "implementation-repository"
npx ailovecode-workflow list-tasks
npx ailovecode-workflow list-tasks --all
npx ailovecode-workflow list-tasks --completed
```

Rules:

* Prefer official workflow commands over manual file creation.
* Prefer official workflow commands over direct file editing when a workflow command exists.
* Manual file operations are fallback mechanisms.
* Do not bypass official workflow commands without a valid reason.
* If a command fails, explain the failure and proceed with the documented fallback process.

When the user asks to list, show, browse, or inspect tasks, attempt the matching `list-tasks` command first. Use filesystem or Git inspection only if the official command is unavailable or fails.

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

## Roles and Authorization

### Developer

The Developer owns task understanding, planning, implementation, validation, Developer Task Review, commit, push, PR creation, and PR Summary.

### Reviewer

The Reviewer owns independent PR Review. PR Review is read-only by default and is separate from Developer Task Review.

### Maintainer / Approver

The Maintainer / Approver owns final PR merge authorization, final direct branch merge authorization, and destructive task cleanup authorization.

Each state-changing action requires explicit user intent. Authorization does not carry forward:

* Commit does not authorize push.
* Push does not authorize PR creation.
* PR creation does not authorize PR Review submission or merge.
* PR Review does not authorize posting, approval, requesting changes, or merge.
* Commit and push do not authorize a direct branch merge.
* Merge authorization in an implementation repository does not authorize task cleanup in a separate workflow task repository.
* Cleanup of an associated task does not authorize cleanup of unrelated legacy tasks.

Use the Git and Git-hosting capabilities available in the active coding-agent harness. Do not require a particular provider, API, CLI, plugin, or merge strategy. If a required capability is unavailable, state what remains incomplete rather than claiming success.

---

## Git and Pull-Request Actions

### Commit and Push

Commit or push only when explicitly requested. Before either action:

1. Inspect the active task, implementation state, repository identity, branch, index, and working tree.
2. Preserve unrelated user changes and stage only files belonging to the requested task/action.
3. Generate a concise message from the actual implementation and task context.
4. Use the full task folder name when a task reference is useful; do not use only its timestamp.
5. Perform only the authorized actions and report their individual outcomes.

### Create PR

Create a PR only when explicitly requested:

1. Determine the intended base safely from user direction, provider metadata, remote default, `main`, or `master`; ask when still ambiguous.
2. Verify repository, branch, working-tree, and required push state.
3. Create a clear title and initial description using the actual diff, relevant task/plan, validation, and known limitations.
4. Reference the full task folder name when associated with the PR.
5. Keep the task folder intact while the PR is open.

Creating a PR does not authorize review submission, approval, merge, or task cleanup.

### PR Summary

PR Summary is the Developer's explanation of completed work, not a review or approval. Inspect the task, plan, Developer Task Review reports, actual PR/branch diff, commits, validation, and current PR description when available. A useful structure is:

```md
## Summary
## Task
## Changes
## Key Decisions
## Validation
## Known Limitations
```

Adapt the structure when useful. Update the live PR description only when the user requests that mutation and the harness supports it.

### PR Review

PR Review is the Reviewer's independent assessment of whether the pull request is safe and suitable to merge. Inspect, where available, the actual PR diff and surrounding code, task and plan, Developer Task Review results, commits, tests/CI, and relevant PR discussion. Review correctness, regressions, security, error handling, consistency/concurrency, compatibility, performance, architecture, tests, and scope.

By default:

1. Perform the review.
2. Show actionable findings, verdict, and a suggested PR action to the reviewer/user.
3. Do not post comments, approve, request changes, edit the PR, or create a local report.

Only explicit requests such as “submit this review,” “post these findings,” or “review and submit” authorize publishing through provider capabilities. Submission authorization permits only the requested review action and does not authorize merge. Never store PR Review output under `workflow/tasks/<task-id>/reviews/`; that directory belongs to Developer Task Review.

### Merge PR

Merge only with explicit Maintainer / Approver authorization. Re-check state before every destructive or final step:

1. Verify the PR, source branch, target branch, task association, worktree, required checks/CI, mergeability, and unresolved blocking conditions.
2. If the implementation repository also owns the associated `workflow/tasks/` folder, verify its files are committed and reachable, delete the complete task folder on the PR branch, commit and push that cleanup, then re-check the PR and required statuses.
3. Merge only if the final checks still pass.
4. Report every completed and incomplete step precisely.

If cleanup is committed or pushed but a later check or merge fails, state that cleanup succeeded and integration failed. Do not present the task as fully integrated.

### Merge Branch Directly

Direct merge is allowed only when explicitly requested and repository policy permits it:

1. Verify source/target branches, policy, worktrees, validation, Developer Task Review, and blocking conditions.
2. If the same repository owns `workflow/tasks/`, verify preservation, remove the associated task folder on the source branch, and commit/push cleanup as authorized.
3. Re-check source, target, policy, and remote state immediately before merge.
4. Merge the source into the target and push the target only when authorized or included in the explicit request.
5. Report local merge and target push as separate outcomes.

Do not direct-merge when policy requires a PR. Direct flow does not create PR descriptions, conversation, or PR Review history.

---

## Task Cleanup and History

### Final Task Cleanup

Delete a completed task folder only at the final integration stage and only with explicit authorization. Delete the complete package, including `task.md`, `implementation-plan.md`, `reviews/`, and `supporting-materials/`. Before deletion, verify that required artifacts were committed and remain reachable and that no ignored, untracked, or otherwise uncommitted-only material would be lost.

Use the full folder name in cleanup metadata, for example:

```text
chore(workflow): close task 20260910T2002_m10-end-to-end-validation-restart-recovery
```

### Split-Repository Cleanup

In split-repository mode, implementation integration and workflow-task cleanup are separate repository operations:

1. Never delete or create a workflow task folder in an implementation repository that does not own `workflow/tasks/`.
2. Complete and verify the implementation PR/direct merge according to the implementation repository's policy and authorization.
3. Treat success in the implementation repository as distinct from workflow-task cleanup.
4. After confirmed integration, require separate explicit authorization before cleanup in the workflow task repository.
5. Re-verify both repository identities, task association, implementation integration, workflow worktree, and reachable task history.
6. Delete, commit, push, and integrate the cleanup according to the workflow repository's own policy and separately authorized actions.

Report each repository's outcome independently. A successful implementation merge with pending cleanup is integrated implementation with an active task folder; successful cleanup after a failed implementation merge must never be described as successful integration.

### Legacy Task Cleanup

Legacy cleanup is explicit and conservative. Do not delete tasks merely because they are old or absent from recent work. For every candidate:

1. Verify that the current repository owns the task folder.
2. Assess whether the task appears completed, superseded, or still active.
3. Verify committed `task.md`, `implementation-plan.md`, Developer Task Review reports, and relevant supporting materials in reachable Git history.
4. Detect uncommitted-only or intentionally disposable material.
5. Verify related implementation integration where possible and state uncertainty.
6. Present a per-task cleanup assessment before deletion.
7. Delete only the exact tasks covered by explicit authorization, then commit the deletion so it remains traceable.

If completion or preservation cannot be verified, leave the task untouched. Never silently bundle unrelated legacy cleanup into another task.

### Historical Meaning and Reachability

Current `workflow/tasks/` represents active or still-relevant working context. A historical task means its folder deletion is committed and the deletion commit is reachable from the configured upstream's locally available ref. It does not prove successful completion, review, or merge.

The listing command does not fetch. Its upstream result may be stale until the user fetches separately. With no configured or locally resolvable upstream, a committed deletion remains Deleted Pending Push because push state cannot be confirmed. Git can recover deleted artifacts only if they were committed and the relevant commits remain reachable. Ignored or uncommitted files are not recoverable from Git. Do not mandate a provider-specific merge strategy, but warn when a selected strategy may make intermediate task artifacts or cleanup commits harder to trace. Do not add an archive directory solely to retain completed tasks.

---

## Listing Tasks

Use the official command first for task-listing requests:

```bash
npx ailovecode-workflow list-tasks
npx ailovecode-workflow list-tasks --all
npx ailovecode-workflow list-tasks --completed
npx ailovecode-workflow list-tasks --all --json
```

Rules:

* Default output lists immediate directories currently under `workflow/tasks/` as active tasks.
* `--all` lists Active, Deleted Pending Commit, Deleted Pending Push, and Historical task-folder names in explicit sections with short descriptions.
* `--completed` lists all three non-active states. It is only a task-folder lifecycle view and does not prove implementation completion, review, or merge.
* Active means the task folder exists in the working tree.
* Deleted Pending Commit means the folder is absent from the working tree but its deletion is not committed.
* Deleted Pending Push means the deletion is committed locally but its commit is not reachable from the locally known configured upstream ref.
* Historical means the deletion commit is reachable from the locally known configured upstream ref.
* Full folder names are preserved exactly, de-duplicated, and sorted deterministically.
* JSON always contains `active`, `deleted_pending_commit`, `deleted_pending_push`, and `historical` arrays of `{ "task": "<full-folder-name>" }` objects. The old `completed` field is removed rather than retained as an alias.
* Active-only listing works from the filesystem. History-dependent modes must report clearly when no usable Git history exists.
* The command is read-only, provider-neutral, and never fetches or otherwise contacts the network.
* When no usable upstream is configured, committed deletions remain Deleted Pending Push and the command clearly warns that push state cannot be confirmed.
* Historical reflects locally known upstream state; users must fetch separately when they need current remote knowledge.
* Manual filesystem/Git inspection is a fallback only when the command is unavailable or fails.

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

### Developer Task Review Phase

1. Determine the comparison base branch
2. Collect the `<base>...HEAD` diff and changed-file status
3. Discover every task and implementation plan associated with the branch
4. Review each task independently for task alignment, plan alignment, and engineering quality
5. Perform a final branch-level scope review
6. Write a new timestamped report for each reviewed task
7. Return standardized findings and an overall verdict
8. Keep human review as the final approval before merge

Developer Task Review is read-only for implementation artifacts. It may create only new AI-owned reports under each reviewed task's `reviews/` directory. A request for Developer Task Review does not authorize modifying code, task files, plans, previous review reports, commits, branches, pull requests, or merge state. Fixes should only be implemented when the user separately requests them.

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

## Developer Task Review

### Developer Task Review Trigger

When the user asks whether a task, branch, or implementation satisfies its task and plan, AI should perform Developer Task Review. When the official context command is available, follow the Command-First Policy:

```bash
npx ailovecode-workflow review-context <base>
```

The base may be omitted when it can be detected safely:

```bash
npx ailovecode-workflow review-context
```

The context command collects review inputs and prints one standardized task-local review-report path per discovered task. It does not perform the review, create directories, write reports, or determine verdicts. Use `--json` when structured context and task-to-report-path mappings are needed:

```bash
npx ailovecode-workflow review-context <base> --json
```

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

Do not assume that a single branch or implementation contains only one task.

Exclude both `workflow/reviews/**` files and task-local `workflow/tasks/*/reviews/**` files from changed-file discovery and the complete branch diff. Generated review reports are outputs of the review process and must not affect later task discovery, findings, or verdicts.

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

### Multiple Tasks and Branch-Level Review

For a branch or implementation with multiple task directories:

1. Report task alignment, plan alignment, and engineering findings for each task separately
2. Do not merge all task requirements into one checklist
3. Then perform a branch-level review for cross-task conflicts, duplicated work, unrelated changes, and excessive scope

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

The overall verdict is the most severe applicable status across every task and the branch-level review. The Developer Task Review verdict informs later review and never replaces Maintainer approval.

### Review Report

After completing the review, create a new report at each task-local path printed by `review-context`. In split-repository mode, construct the equivalent path in the workflow task repository because automatic cross-repository discovery is not yet available:

```text
workflow/tasks/<task-id>/reviews/YYYYMMDDTHHMMSS.md
```

Rules:

* Use local time and the seconds-level `YYYYMMDDTHHMMSS` timestamp shown by `review-context`.
* Do not add verdicts or redundant prefixes to filenames.
* If that timestamp already exists for a task, use the collision-safe path printed by `review-context`, such as `YYYYMMDDTHHMMSS-02.md`.
* Create the task's `reviews/` directory only when writing its first completed review.
* Never replace an earlier review; every iteration remains a separate file.
* Include the task identifier/path, base, head branch, reviewed commit, and review timestamp in report metadata.
* Store only that task's alignment statuses, engineering status, findings, and task verdict in its report.
* Return cross-task and branch-level findings in the aggregate user response; do not duplicate them into unrelated task reports or create a global report for them.
* Treat reports as AI-owned generated output.
* Do not modify any other file as part of review.
* Do not commit, push, post, approve, or merge reports unless the user separately requests that action.
* If the user explicitly requests no file write, return the review without creating or updating the report.

New reviews must use task-local paths. The latest task review is the newest timestamped filename; do not create `latest.md`.

Report writes do not change review verdicts. If a report cannot be written, return the full review to the user and state the persistence error separately.

### Task Review File

Use this structure for each persisted task report:

```md
# AI Love Code - Developer Task Review

## Metadata

- Task: <task path>
- Base: <base>
- Head: <branch>
- Commit: <full commit hash>
- Reviewed at: <ISO 8601 timestamp>

## Task Alignment

PASS | WARNING | CHANGES REQUESTED

## Plan Alignment

PASS | WARNING | CHANGES REQUESTED

## Engineering

PASS | WARNING | CHANGES REQUESTED

## Findings

- HIGH - Finding title (`path/to/file:line`)
  Concrete impact and remediation direction.

## Overall Verdict

PASS | WARNING | CHANGES REQUESTED
```

Omit an empty finding list or write `No actionable findings.`

### Standard Developer Task Review Output

Use this aggregate structure in the response to the user:

```md
# AI Love Code - Developer Task Review

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

## Branch-Level Review

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
