<workflow-dev>
This repository stores AILoveCode Workflow tasks for a separate implementation repository.

Implementation repository:

`{{IMPLEMENTATION_REPOSITORY}}`

Workflow task repository:

`{{WORKFLOW_TASK_REPOSITORY}}`

Routing rules:

- Keep `task.md`, `implementation-plan.md`, supporting materials, Developer Task Review reports, and task cleanup in the workflow task repository.
- Make implementation code and test changes in the implementation repository.
- Read and follow repository-specific instructions in both repositories before changing their files.
- Treat implementation integration and workflow-task cleanup as separate repository operations with independent state and outcomes.
- Do not delete or create task folders in an implementation repository that does not own `workflow/tasks/`.
- Treat the repositories as independent Git worktrees; authorization for commit, push, PR, merge, or cleanup in one does not authorize actions in the other.
- Do not install or copy AILoveCode Workflow into the implementation repository unless explicitly requested.
</workflow-dev>
