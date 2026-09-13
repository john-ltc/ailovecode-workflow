# AILoveCode Workflow

A lightweight, file-based workflow for AI-assisted software development. It defines task, Git, pull-request, review, and cleanup behavior while relying on the active coding-agent harness for local Git and provider operations.

## Installation

```bash
npm install -D github:john-ltc/ailovecode-workflow
npx ailovecode-workflow init
```

Initialization creates managed workflow guidance, `workflow/tasks/`, and instruction blocks in `AGENTS.md` and `CLAUDE.md`.

Update managed files without replacing tasks:

```bash
npx ailovecode-workflow update
```

## Commands

```bash
npx ailovecode-workflow init
npx ailovecode-workflow update
npx ailovecode-workflow configure-dev "path/to/implementation-project"
npx ailovecode-workflow create-task "task name"
npx ailovecode-workflow list-tasks [--all | --completed] [--json]
npx ailovecode-workflow review-context [base] [--json]
npx ailovecode-workflow version
```

Workflow commands are the preferred interface. Manual filesystem or Git inspection is a fallback when an official command is unavailable or fails.

## Tasks

Create a task:

```bash
npx ailovecode-workflow create-task "add-user-profile"
```

```text
workflow/tasks/
└── YYYYMMDDTHHMM_add-user-profile/
    ├── task.md
    ├── implementation-plan.md
    └── supporting-materials/
```

`task.md` is the user-owned source of truth and is not changed unless explicitly requested. `implementation-plan.md` is created or updated only after an explicit planning request. Developer Task Review reports are created lazily under the task's `reviews/` directory.

## Listing Tasks

```bash
npx ailovecode-workflow list-tasks
npx ailovecode-workflow list-tasks --all
npx ailovecode-workflow list-tasks --completed
npx ailovecode-workflow list-tasks --all --json
```

The default command lists Active task directories. `--all` shows the complete task-folder lifecycle, and `--completed` shows all three non-active states:

- **Active** - task folder exists.
- **Deleted Pending Commit** - deleted from the working tree, not committed.
- **Deleted Pending Push** - deletion committed locally, not pushed.
- **Historical** - deletion committed and pushed according to the locally known upstream state.

`--completed` is only a task-folder lifecycle view. It does not prove that implementation was completed, reviewed, or merged.

Output is read-only, de-duplicated, lexically sorted, and preserves full task-folder names. JSON always uses four status arrays; the old ambiguous `completed` field has been removed:

```json
{
  "active": [{ "task": "20260913T1015_fix-payment-validation" }],
  "deleted_pending_commit": [],
  "deleted_pending_push": [],
  "historical": [{ "task": "20260910T2002_m10-end-to-end-validation-restart-recovery" }]
}
```

Active-only listing does not require Git. History-dependent views fail clearly when no usable Git history exists. The command never fetches: it checks the configured upstream's locally available ref. Without a usable upstream, committed deletions remain Deleted Pending Push and the command warns that push state cannot be confirmed. Fetch separately when fresher remote knowledge is required.

## Roles and Reviews

- **Developer** — task understanding, planning, implementation, validation, Developer Task Review, commit/push, PR creation, and PR Summary.
- **Reviewer** — independent PR Review.
- **Maintainer / Approver** — final PR/direct merge and destructive task-cleanup authorization.

Developer Task Review asks whether the task was implemented correctly. It evaluates task alignment, plan alignment, engineering quality, and branch-level scope. Its timestamped reports live at:

```text
workflow/tasks/<task-id>/reviews/YYYYMMDDTHHMMSS.md
```

Collect its branch context with:

```bash
npx ailovecode-workflow review-context main
npx ailovecode-workflow review-context main --json
```

`review-context` remains context-only: it does not create a report or directory. Existing generated reports are excluded from later diffs.

PR Review asks whether an actual pull request is safe to merge. It is read-only/private by default and is not stored in the task-local review directory. Posting comments, approving, or requesting changes requires a separate explicit request and uses the hosting capabilities of the coding-agent harness.

## Permission Boundaries

Commit, push, PR creation, PR-review submission, approval, request changes, PR merge, direct branch merge, and destructive cleanup each require explicit user intent. Authorization does not carry to a later action or another repository.

Examples:

- Commit does not authorize push.
- Push does not authorize PR creation.
- PR creation or review does not authorize submission or merge.
- Commit and push do not authorize direct merge.
- Implementation merge in a split repository does not authorize workflow-task cleanup.

## PR Flow

```text
Developer: Create Task → Understand → Plan → Implement → Validate
           → Developer Task Review → Commit/Push → Create PR → PR Summary

Reviewer:  PR Review (read-only) → optionally submit when explicitly requested

Maintainer: Explicit merge authorization → final checks
            → same-repository task cleanup + cleanup commit/push
            → re-check → merge PR
```

The task folder remains present while the PR is open. In a repository that owns both code and `workflow/tasks/`, its complete task package is removed only at the final integration stage after explicit authorization and history-preservation checks.

If cleanup succeeds but a later push, check, or merge fails, the agent reports partial completion and must not claim that integration succeeded.

## Direct-Merge Flow

```text
Developer: Create Task → Understand → Plan → Implement → Validate
           → Developer Task Review → Commit/Push

Maintainer: Explicit direct-merge authorization → policy/final checks
            → same-repository task cleanup + cleanup commit/push
            → re-check → merge source into target → push target as authorized
```

Direct merge is not performed when repository policy requires a PR. It does not create PR summaries, PR conversation, or PR Review history.

## Split-Repository Setup

Use split mode when workflow tasks belong in a development-management repository and implementation belongs elsewhere:

```bash
cd path/to/workflow-dev
npx ailovecode-workflow init
npx ailovecode-workflow configure-dev "path/to/implementation-project"
```

`configure-dev` verifies both Git worktrees and maintains one `<workflow-dev>` block in `AGENTS.md` and `CLAUDE.md`. It does not install workflow files in the implementation repository.

| Concern | Workflow task repository | Implementation repository |
| --- | --- | --- |
| Task, plan, supporting material | Owns | Reads as context |
| Developer Task Review reports | Owns | Supplies code diff/validation |
| Implementation code and tests | No changes | Owns |
| Implementation PR/direct merge | Separate operation | Owns |
| Task-folder cleanup | Separate operation; owns | Never performed if folder is absent |

Implementation integration and task cleanup have independent authorization, Git state, commits, pushes, policies, and outcomes. First complete and verify implementation integration. Then, with separate explicit authorization, re-check preservation and clean up the task in the workflow repository according to that repository's policy.

## Legacy Cleanup and History

Legacy task cleanup is a guided, conservative process—not a bulk deletion command. For every candidate, verify task status, reachable committed task/plan/reviews, supporting materials, absence of uncommitted-only files, and implementation integration where possible. Present the assessment before deletion and leave uncertain tasks untouched.

Use the full task folder name in cleanup metadata:

```text
chore(workflow): close task 20260910T2002_m10-end-to-end-validation-restart-recovery
```

Current `workflow/tasks/` is active working context; local Git and upstream reachability determine the remaining task-folder lifecycle states. Historical means the deletion commit is reachable from the locally known configured upstream; it does not prove successful implementation or merge. Deleted files are recoverable only if committed and still reachable. Ignored or uncommitted files are not recoverable from Git. The workflow does not require an archive or provider-specific merge strategy, but some strategies can make intermediate task artifacts or cleanup commits harder to trace.

## Project Structure

```text
workflow/
├── guidelines.md
├── README.md
└── tasks/
    └── YYYYMMDDTHHMM_task-name/
        ├── task.md
        ├── implementation-plan.md
        ├── supporting-materials/
        └── reviews/
            └── YYYYMMDDTHHMMSS.md
```

## License

MIT
