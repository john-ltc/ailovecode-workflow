# AILoveCode Workflow

This project uses a lightweight, file-based workflow for AI-assisted development. The detailed behavior and permission rules are in `guidelines.md`.

## Core Files

- `task.md` — user-owned source of truth; AI does not modify it unless explicitly requested.
- `implementation-plan.md` — planning, decisions, testing, and progress; AI updates it only after an explicit planning request.
- `supporting-materials/` — task-local references.
- `reviews/` — timestamped Developer Task Review reports created only when reviews are completed.

## Commands

```bash
npx ailovecode-workflow create-task "task name"
npx ailovecode-workflow list-tasks [--all | --completed] [--json]
npx ailovecode-workflow review-context [base] [--json]
```

Use official commands first. Manual filesystem or Git inspection is a fallback when a command is unavailable or fails.

### List Tasks

```bash
npx ailovecode-workflow list-tasks
npx ailovecode-workflow list-tasks --all
npx ailovecode-workflow list-tasks --completed
npx ailovecode-workflow list-tasks --all --json
```

The default view lists current task folders. `--all` includes historical folders found in reachable Git history; `--completed` shows only that historical-path view. Historical means “previously committed and absent from the current tree,” not verified completion or merge. Results preserve full folder names and are sorted deterministically. Listing is read-only.

### Developer Task Review Context

```bash
npx ailovecode-workflow review-context main
npx ailovecode-workflow review-context main --json
```

The command collects `<base>...HEAD` context and task-to-report-path mappings. It does not perform a review or write a file. Developer Task Review reports remain under:

```text
workflow/tasks/<task-id>/reviews/YYYYMMDDTHHMMSS.md
```

## Roles

- **Developer** — understand, plan, implement, validate, perform Developer Task Review, commit/push, create PRs, and prepare PR summaries.
- **Reviewer** — independently review actual pull requests.
- **Maintainer / Approver** — authorize and perform final integration and destructive task cleanup.

Developer Task Review asks: “Did we implement the task correctly?” Its reports are task-local.

PR Review asks: “Is this pull request safe to merge?” It is read-only/private by default. It is submitted to the PR provider only when explicitly requested and is never stored in the task-local `reviews/` directory.

## Permission Rules

Commit, push, PR creation, PR-review submission, approval, request changes, PR merge, direct branch merge, and destructive cleanup require explicit user intent. One action never authorizes a later action or the same action in another repository.

## PR Flow

```text
Developer
Create Task → Understand → Plan → Implement → Validate
→ Developer Task Review → Commit/Push → Create PR → PR Summary

Reviewer
PR Review (read-only) → optionally submit when explicitly requested

Maintainer / Approver
Explicit merge authorization → final checks
→ same-repository task cleanup and cleanup commit/push
→ re-check → merge PR
```

Keep the task folder while the PR is open. Cleanup occurs only at final integration, after explicit authorization and preservation checks. Re-check before destructive and final steps. If cleanup succeeds but merge fails, report partial completion and do not claim integration succeeded.

## Direct-Merge Flow

```text
Developer
Create Task → Understand → Plan → Implement → Validate
→ Developer Task Review → Commit/Push

Maintainer / Approver
Explicit direct-merge authorization → repository-policy and final checks
→ same-repository task cleanup and cleanup commit/push
→ re-check → merge source into target → push target as authorized
```

Do not direct-merge when repository policy requires a PR. Direct flow has no PR summary, conversation, or PR Review history.

## Split-Repository Workflow

Configure a separate implementation repository from the workflow task repository:

```bash
npx ailovecode-workflow configure-dev "path/to/implementation-project"
```

The workflow task repository owns tasks, plans, supporting materials, Developer Task Review reports, and task cleanup. The implementation repository owns source, tests, validation, implementation Git history, and its PR/direct merge.

Implementation integration and workflow-task cleanup are separate operations:

1. Complete and verify the implementation integration under that repository's policy and explicit authorization.
2. Do not delete or manufacture a task folder in an implementation repository that does not own it.
3. With separate explicit authorization, re-check the task repository, committed history, task association, and integration result.
4. Delete, commit, push, and integrate cleanup according to the workflow repository's own policy and authorization.
5. Report both repositories' results independently.

For split Developer Task Review, collect the implementation diff in the implementation repository and combine it with the task/plan in the workflow repository. `review-context` does not automatically combine repositories.

## Legacy Cleanup

Legacy cleanup is explicit and conservative:

1. Identify an exact task using its full folder name.
2. Assess whether it appears completed, superseded, or still active.
3. Verify committed task, plan, review, and supporting-material history remains reachable.
4. Detect ignored, untracked, or uncommitted-only files that Git cannot recover.
5. Verify related integration when possible and present uncertainty.
6. Present the cleanup assessment before deletion.
7. Delete only after explicit authorization and commit the deletion.

Do not silently bundle unrelated tasks or remove uncertain candidates.

## Historical Context

```text
Current workflow/tasks/ = active or still-relevant working context
PR description         = Developer's final summary
Git history            = reachable committed task/plan/review context
PR conversation        = submitted PR Review history
```

Deleted artifacts are recoverable only when committed and still reachable. Historical task discovery does not prove successful completion. No archive directory or provider-specific merge strategy is required, but agents should warn when a strategy can make historical artifacts harder to trace.

## Recommended Task Lifecycle

```text
Create Task → Write task.md → Understand → Plan → Implement → Validate
→ Developer Task Review → explicit Git/integration actions → final cleanup
```

For larger features, the AI may provide a Development Checkpoint when there is something meaningful to test.
