# AILoveCode Workflow

A lightweight workflow that guides humans and AI through requirements, planning, implementation, review, and delivery. Tasks and plans live in files alongside your project.

## Installation

```bash
npm install -D github:john-ltc/ailovecode-workflow
npx ailovecode-workflow init
```

Initialization creates managed workflow guidance, `workflow/tasks/`, and instruction blocks in `AGENTS.md` and `CLAUDE.md`.

Update managed files without replacing tasks:

```bash
npm install -D github:john-ltc/ailovecode-workflow
npx ailovecode-workflow update
```

## Recommended Human and AI Workflow

Send these prompts to your coding agent. Include the full task-folder path when the active task is unclear. The agent follows [workflow/guidelines.md](workflow/guidelines.md) and uses official workflow commands where available.

### 1. Create Task

**Human → AI**

Prompt:

```text
Create task "add-user-profile"
```

Expected outcome:

- A new task folder with a requirements template, an empty implementation plan, and a supporting-materials folder.

### 2. Write Requirements

**Human**

Write the context, request, and references in the generated `task.md`.

### 3. Understand the Task

**Human → AI**

Prompt:

```text
Understand the task.
```

Expected outcome:

- Task summary, key requirements, and clarifications.
- Discussion of any open questions in chat.

### 4. Create Plan

**Human → AI**

Prompt:

```text
Create plan
```

Expected outcome:

- Milestones, implementation steps, and a testing approach in `implementation-plan.md`.

Read the plan and request any changes before implementation. Understanding alone does not start planning or implementation.

### 5. Implement the Plan

**Human → AI**

Prompt:

```text
Implement it
```

Expected outcome:

- Implementation changes, relevant checks, and progress updates.
- A Development Checkpoint when there is something meaningful to test.

### 6. Development Checkpoint

**Human**

When the implementation reaches a meaningful runnable or testable stage, the AI pauses and provides test steps. Test the checkpoint and share your results. If something fails, request a fix and retest before continuing.

**Human → AI**, after a successful checkpoint:

```text
It work. Continue.
```

Expected outcome:

- Work continues using your feedback.
- Further checkpoints when useful, until implementation is complete.

Small fixes and documentation changes may not need a checkpoint.

**Final validation:** Once implementation is complete, read the AI's completion summary and validation results, then test the finished behavior against your requirements. Request fixes and retest before task review, even if no checkpoint was needed.

### 7. Review the Task

At this stage, review the implementation against the task and plan. This is [Developer Task Review](#roles-and-reviews).

**Human → AI (Developer)**

Prompt:

```text
Review the task
```

Expected outcome:

- Task alignment, plan alignment, and engineering findings.
- A timestamped task-local review report.

Request fixes separately, then request another review as needed. Specify the intended base branch if needed.

### 8. Commit, Push, and Create a PR

**Human → AI (Developer)**

Send each prompt separately when ready:

```text
Commit the changes
```

```text
Push the branch
```

```text
Create a pull request
```

Expected outcome:

- Each requested action is performed and its result reported.
- The PR includes the task reference, changes, and validation.

Ask `Prepare a PR summary.` for an explanation of completed work. Request a live PR-description update explicitly if needed.

### 9. Review the PR

**Human → AI (Reviewer)**

Prompt:

```text
Review the PR
```

Expected outcome:

- An independent, private review with findings, a verdict, and a suggested PR action.

See [Permission Boundaries](#permission-boundaries) before submitting the review.

### 10. Merge and Clean Up

**Human → AI (Maintainer / Approver)**

Choose the flow that matches where your code and task files are stored.

#### Code and tasks in one repository

Requesting a PR merge also authorizes the AI to automatically clean up the associated task as part of the merge workflow. You do not need a separate cleanup prompt.

Prompt:

```text
Merge this PR.
```

Expected outcome:

- The AI checks that the task files are saved in recoverable Git history.
- It removes the completed task folder, commits and pushes that cleanup on the PR branch, then rechecks and merges the PR.
- It reports the merge result or any step that could not be completed.

The AI performs this cleanup before merging, after checking that the task files are saved in recoverable Git history. The task folder stays present until this final stage. This is handled by the coding agent following the workflow; clicking Merge in the Git host does not run task cleanup. See [PR Flow](#pr-flow) for details.

#### Code and tasks in separate repositories

For example, your code is in `my-app` and your task files are in `workflow-dev`. Finish these as two separate operations:

**First, merge the code in `my-app`.**

```text
Merge the implementation PR.
```

Expected outcome: the code is merged. Automatic cleanup applies only to tasks owned by the repository being merged, so the task folder in `workflow-dev` stays in place and needs a separate cleanup request.

**After the code is merged, clean up the task in `workflow-dev`.**

```text
Clean up task <full-task-folder-name> in workflow-dev.
```

Replace the task folder and repository names with your own. The AI verifies the code was merged and the task files are saved in recoverable Git history, then removes that task folder from the task repository.

**Save and publish the cleanup in the task repository.** Request a commit and push for the cleanup. If that repository uses PRs, request a cleanup PR, review it, and request its merge too.

The code merge and task cleanup have separate Git histories and results. Merging the code completes the implementation; the task folder remains until you separately request and integrate its cleanup. See [Split-Repository Setup](#split-repository-setup) for details.

Where repository policy permits, use the [Direct-Merge Flow](#direct-merge-flow) as an alternative to steps 8 through 10.

## Commands

```bash
npx ailovecode-workflow init
npx ailovecode-workflow update
npx ailovecode-workflow configure-dev "path/to/implementation-project"
npx ailovecode-workflow create-task "task name"
npx ailovecode-workflow list-tasks [--all | --completed] [--json]
npx ailovecode-workflow show-task <task> [--json]
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

Listing is read-only and uses local Git state. It never fetches; fetch separately when you need current remote status.

<details>
<summary>Technical details: task listing and JSON output</summary>

Output is read-only, de-duplicated, lexically sorted, and preserves full task-folder names. JSON always uses four status arrays; the old ambiguous `completed` field has been removed:

```json
{
  "active": [{ "task": "20260913T1015_fix-payment-validation" }],
  "deleted_pending_commit": [],
  "deleted_pending_push": [],
  "historical": [{ "task": "20260910T2002_m10-end-to-end-validation-restart-recovery" }]
}
```

Active-only listing does not require Git. History-dependent views fail clearly when no usable Git history exists. History checks use the configured upstream's locally available ref. Without a usable upstream, committed deletions remain Deleted Pending Push and the command warns that push state cannot be confirmed.

</details>

## Showing a Task

```bash
npx ailovecode-workflow show-task 20260913T1015_fix-payment-validation
npx ailovecode-workflow show-task 20260913T1015_fix-payment-validation --json
```

`show-task` retrieves the latest current lifecycle of one task. Active artifacts come from the working tree, including untracked and ignored files. Deleted tasks are read from the latest committed task package immediately before the current deletion; files are never restored.

Use `show-task <task> --json` as the first step when asking a coding agent to inspect, summarize, explain, revisit, or casually review one task. The command retrieves context only: the agent still interprets it, and formal Developer Task Review remains a separate workflow.

<details>
<summary>Technical details: task artifacts and JSON output</summary>

JSON has stable top-level `task`, `status`, `artifacts`, and `git` fields. Task and plan content, task-local reviews, and supporting-material metadata are returned when available. UTF-8 text content up to 256 KiB is included; larger or binary files are represented by metadata with `content: null`. Untracked and ignored files are marked as not Git-recoverable, and Git metadata that cannot be established is `null`.

The command is deterministic, read-only, provider-neutral, and offline. It uses the same Active, Deleted Pending Commit, Deleted Pending Push, and Historical classification as `list-tasks`, reads only local Git state, and never fetches.

</details>

## Roles and Reviews

- **Developer** — task understanding, planning, implementation, validation, Developer Task Review, commit/push, PR creation, and PR Summary.
- **Reviewer** — independent PR Review.
- **Maintainer / Approver** — final PR/direct merge and destructive task-cleanup authorization.

Developer Task Review checks the implementation against the task and plan, including engineering quality and branch-level scope. It leaves implementation files unchanged and writes timestamped reports at:

```text
workflow/tasks/<task-id>/reviews/YYYYMMDDTHHMMSS.md
```

Collect its branch context with:

```bash
npx ailovecode-workflow review-context main
npx ailovecode-workflow review-context main --json
```

`review-context` collects context; the AI performs the review and writes the report. Existing generated reports are excluded from later diffs. For separate task and implementation repositories, see [split-repository review](#split-repository-review).

PR Review checks whether an actual pull request is safe to merge. It is read-only/private by default and is not stored in the task-local review directory. Publishing a review follows the [Permission Boundaries](#permission-boundaries) below.

## Permission Boundaries

Commit, push, PR creation, PR-review submission, approval, request changes, PR merge, direct branch merge, and destructive cleanup each require explicit user intent. Authorization does not carry to a later action or another repository.

For example, committing does not authorize pushing, reviewing does not authorize publishing or merging, and implementation integration does not authorize cleanup in a separate task repository.

The coding agent uses its available Git and hosting tools for these actions. If a required capability is unavailable, it reports what remains incomplete.

## PR Flow

```text
Developer: After task review → Commit/Push → Create PR → PR Summary

Reviewer:  PR Review (read-only) → optionally submit when explicitly requested

Maintainer: Explicit merge authorization → final checks
            → same-repository task cleanup + cleanup commit/push
            → re-check → merge PR
```

The task folder remains present while the PR is open. In a repository that owns both code and `workflow/tasks/`, its complete task package is removed only at the final integration stage after explicit authorization and history-preservation checks.

If cleanup succeeds but a later push, check, or merge fails, the agent reports partial completion and must not claim that integration succeeded.

## Direct-Merge Flow

```text
Developer: After task review → Commit/Push

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

The repositories have independent Git histories and permissions. First complete and verify implementation integration. Then separately authorize task cleanup in the workflow repository, after checking that its artifacts are committed and remain recoverable. Commit, push, and integrate that cleanup under the workflow repository's own policy. Report the outcomes for each repository separately.

### Split-Repository Review

`review-context` does not automatically combine repositories. For Developer Task Review, the AI collects the implementation diff using `<base>...HEAD` in the implementation repository and combines it with the task and plan from the workflow task repository. It writes the review report under that task's `reviews/` directory. The task repository's diff is not the implementation diff.

## Legacy Cleanup and History

Legacy task cleanup is a guided, conservative process—not a bulk deletion command. For every candidate, verify task status, reachable committed task/plan/reviews, supporting materials, absence of uncommitted-only files, and implementation integration where possible. Present the assessment before deletion and leave uncertain tasks untouched.

Use the full task folder name in cleanup metadata:

```text
chore(workflow): close task 20260910T2002_m10-end-to-end-validation-restart-recovery
```

See [Listing Tasks](#listing-tasks) for task-folder lifecycle states. Deleted artifacts are recoverable only if committed and still reachable; ignored or uncommitted files are not recoverable from Git. No archive or specific merge strategy is required, but the chosen strategy should preserve the history you need.

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
