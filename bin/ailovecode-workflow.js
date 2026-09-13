#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { TextDecoder } = require("util");

const command = process.argv[2];

const packageRoot = path.resolve(__dirname, "..");
const targetRoot = process.cwd();

const sourceWorkflow = path.join(packageRoot, "workflow");
const targetWorkflow = path.join(targetRoot, "workflow");

const showTaskTextLimit = 256 * 1024;

const taskTemplate = `## Context


## Request


## Reference
`;

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;

  fs.mkdirSync(dest, { recursive: true });

  for (const item of fs.readdirSync(src)) {
    if (item === "tasks") continue;
    if (item === "reviews") continue;
    if (item === "workflow-tag.md") continue;
    if (item === "workflow-dev-tag.md") continue;

    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function ensureWorkflowTag(fileName) {
  const filePath = path.join(targetRoot, fileName);

  const tagPath = path.join(
    sourceWorkflow,
    "workflow-tag.md"
  );

  if (!fs.existsSync(tagPath)) {
    return;
  }

  const tagContent = fs.readFileSync(tagPath, "utf8").trim();

  const startTag = "<ailovecode-workflow>";
  const endTag = "</ailovecode-workflow>";

  let content = "";

  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf8");
  }

  const regex = new RegExp(
    `${startTag}[\\s\\S]*?${endTag}`,
    "m"
  );

  if (regex.test(content)) {
    content = content.replace(regex, tagContent);
  } else {
    content =
      content.trimEnd() +
      (content.trim() ? "\n\n" : "") +
      tagContent +
      "\n";
  }

  fs.writeFileSync(filePath, content, "utf8");
}

function updateInstructionFiles() {
  ensureWorkflowTag("AGENTS.md");
  ensureWorkflowTag("CLAUDE.md");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function upsertManagedBlock(content, startTag, endTag, tagContent) {
  const regex = new RegExp(
    `${escapeRegExp(startTag)}[\\s\\S]*?${escapeRegExp(endTag)}`,
    "g"
  );
  const withoutBlock = content.replace(regex, "").trimEnd();

  return (
    withoutBlock +
    (withoutBlock.trim() ? "\n\n" : "") +
    tagContent.trim() +
    "\n"
  );
}

function gitTopLevel(directory) {
  const result = spawnSync(
    "git",
    ["-C", directory, "rev-parse", "--show-toplevel"],
    {
      encoding: "utf8",
      windowsHide: true,
    }
  );

  if (result.error || result.status !== 0) {
    return null;
  }

  return path.resolve(result.stdout.trim());
}

function samePath(first, second) {
  const normalize = (value) => {
    const normalized = path.normalize(value);
    return process.platform === "win32"
      ? normalized.toLowerCase()
      : normalized;
  };

  return normalize(first) === normalize(second);
}

function markdownPath(value) {
  return value.replace(/`/g, "\\`");
}

function tagPathIsSafe(value) {
  return !/[\r\n<>]/.test(value);
}

function configureDev() {
  const implementationInput = process.argv.slice(3).join(" ").trim();

  if (!implementationInput) {
    console.error("Please provide an implementation repository.");
    console.error(
      'Example: npx ailovecode-workflow configure-dev "C:\\path\\to\\project"'
    );
    process.exit(1);
  }

  if (
    !fs.existsSync(targetWorkflow) ||
    !fs.existsSync(path.join(targetWorkflow, "guidelines.md"))
  ) {
    console.error("workflow folder not found.");
    console.error("Run this first: npx ailovecode-workflow init");
    process.exit(1);
  }

  const taskRepository = gitTopLevel(targetRoot);

  if (!taskRepository || !samePath(taskRepository, targetRoot)) {
    console.error(
      "configure-dev must be run from the root of the workflow task Git repository."
    );
    process.exit(1);
  }

  const requestedImplementation = path.resolve(
    targetRoot,
    implementationInput
  );

  if (
    !fs.existsSync(requestedImplementation) ||
    !fs.statSync(requestedImplementation).isDirectory()
  ) {
    console.error(
      `Implementation repository not found: ${requestedImplementation}`
    );
    process.exit(1);
  }

  const implementationRepository = gitTopLevel(
    requestedImplementation
  );

  if (!implementationRepository) {
    console.error(
      `Implementation path is not a Git worktree: ${requestedImplementation}`
    );
    process.exit(1);
  }

  if (samePath(taskRepository, implementationRepository)) {
    console.error(
      "The implementation repository must be different from the workflow task repository."
    );
    process.exit(1);
  }

  if (
    !tagPathIsSafe(taskRepository) ||
    !tagPathIsSafe(implementationRepository)
  ) {
    console.error(
      "Repository paths containing line breaks or angle brackets are not supported in workflow tags."
    );
    process.exit(1);
  }

  const templatePath = path.join(
    sourceWorkflow,
    "workflow-dev-tag.md"
  );

  if (!fs.existsSync(templatePath)) {
    console.error("workflow-dev tag template not found.");
    process.exit(1);
  }

  const tagContent = fs
    .readFileSync(templatePath, "utf8")
    .replace(
      /{{IMPLEMENTATION_REPOSITORY}}/g,
      () => markdownPath(implementationRepository)
    )
    .replace(
      /{{WORKFLOW_TASK_REPOSITORY}}/g,
      () => markdownPath(taskRepository)
    )
    .trim();

  updateInstructionFiles();

  for (const fileName of ["AGENTS.md", "CLAUDE.md"]) {
    const filePath = path.join(targetRoot, fileName);
    const content = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, "utf8")
      : "";
    const updated = upsertManagedBlock(
      content,
      "<workflow-dev>",
      "</workflow-dev>",
      tagContent
    );

    fs.writeFileSync(filePath, updated, "utf8");
  }

  console.log("Workflow development repositories configured.");
  console.log("");
  console.log(`Workflow task repository: ${taskRepository}`);
  console.log(
    `Implementation repository: ${implementationRepository}`
  );
  console.log("");
  console.log("Updated:");
  console.log("- AGENTS.md");
  console.log("- CLAUDE.md");
}

function ensureWorkflowDirectories() {
  fs.mkdirSync(
    path.join(targetWorkflow, "tasks"),
    { recursive: true }
  );
}

function init() {
  if (fs.existsSync(targetWorkflow)) {
    console.log(
      "Workflow already installed."
    );
    console.log(
      "Use: npx ailovecode-workflow update"
    );

    updateInstructionFiles();

    return;
  }

  copyDir(sourceWorkflow, targetWorkflow);

  ensureWorkflowDirectories();

  updateInstructionFiles();

  console.log(
    "AILoveCode Workflow installed."
  );

  console.log("");
  console.log("Created:");
  console.log("- workflow/");
  console.log("- workflow/tasks/");
  console.log("- AGENTS.md");
  console.log("- CLAUDE.md");
}

function update() {
  if (!fs.existsSync(targetWorkflow)) {
    console.error(
      "workflow folder not found."
    );
    console.error(
      "Run this first: npx ailovecode-workflow init"
    );
    process.exit(1);
  }

  copyDir(
    sourceWorkflow,
    targetWorkflow
  );

  ensureWorkflowDirectories();

  updateInstructionFiles();

  console.log(
    "AILoveCode Workflow updated."
  );

  console.log("");
  console.log("Updated:");
  console.log(
    "- workflow/guidelines.md"
  );
  console.log(
    "- workflow/README.md"
  );
  console.log("- AGENTS.md");
  console.log("- CLAUDE.md");

  console.log("");
  console.log("Preserved:");
  console.log(
    "- workflow/tasks/"
  );
}

function toKebabCase(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function timestamp() {
  const now = new Date();

  const pad = (n) =>
    String(n).padStart(2, "0");

  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    "T" +
    pad(now.getHours()) +
    pad(now.getMinutes())
  );
}

function reviewTimestamp() {
  const override = process.env.AILOVECODE_WORKFLOW_REVIEW_TIMESTAMP;

  if (override) {
    if (!/^\d{8}T\d{6}$/.test(override)) {
      console.error(
        "AILOVECODE_WORKFLOW_REVIEW_TIMESTAMP must use YYYYMMDDTHHMMSS."
      );
      process.exit(1);
    }

    return override;
  }

  const now = new Date();

  const pad = (n) =>
    String(n).padStart(2, "0");

  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    "T" +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

function createTask() {
  const taskName =
    process.argv.slice(3).join(" ");

  if (!taskName) {
    console.error(
      'Please provide a task name.'
    );

    console.error(
      'Example: npx ailovecode-workflow create-task "add login page"'
    );

    process.exit(1);
  }

  if (!fs.existsSync(targetWorkflow)) {
    console.error(
      "workflow folder not found."
    );

    console.error(
      "Run this first: npx ailovecode-workflow init"
    );

    process.exit(1);
  }

  const folderName =
    `${timestamp()}_${toKebabCase(taskName)}`;

  const taskPath = path.join(
    targetWorkflow,
    "tasks",
    folderName
  );

  fs.mkdirSync(
    path.join(
      taskPath,
      "supporting-materials"
    ),
    {
      recursive: true,
    }
  );

  fs.writeFileSync(
    path.join(taskPath, "task.md"),
    taskTemplate,
    "utf8"
  );

  fs.writeFileSync(
    path.join(
      taskPath,
      "implementation-plan.md"
    ),
    "",
    "utf8"
  );

  console.log("Task created:");
  console.log(
    path.relative(targetRoot, taskPath)
  );
}

function listTasksArguments() {
  let mode = "active";
  let json = false;

  for (const argument of process.argv.slice(3)) {
    if (argument === "--json") {
      json = true;
      continue;
    }

    if (argument === "--all" || argument === "--completed") {
      const requestedMode = argument === "--all" ? "all" : "completed";

      if (mode !== "active") {
        console.error("list-tasks accepts only one of --all or --completed.");
        process.exit(1);
      }

      mode = requestedMode;
      continue;
    }

    console.error(`Unknown list-tasks option: ${argument}`);
    process.exit(1);
  }

  return { mode, json };
}

function activeTasks() {
  const tasksPath = path.join(targetWorkflow, "tasks");

  if (!fs.existsSync(targetWorkflow) || !fs.existsSync(tasksPath)) {
    console.error("workflow/tasks folder not found.");
    console.error("Run this first: npx ailovecode-workflow init");
    process.exit(1);
  }

  return fs
    .readdirSync(tasksPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function ensureTaskHistory() {
  const repositoryCheck = git([
    "rev-parse",
    "--is-inside-work-tree",
  ]);

  if (
    repositoryCheck.error ||
    repositoryCheck.status !== 0 ||
    repositoryCheck.stdout.trim() !== "true"
  ) {
    console.error(
      "Task lifecycle states cannot be determined outside a Git worktree."
    );
    process.exit(1);
  }

  const reachableCommit = git([
    "rev-parse",
    "--verify",
    "--quiet",
    "HEAD^{commit}",
  ]);

  if (
    reachableCommit.error ||
    reachableCommit.status !== 0 ||
    !reachableCommit.stdout.trim()
  ) {
    console.error(
      "Task lifecycle states cannot be determined because no reachable Git history is available."
    );
    process.exit(1);
  }
}

function knownTasks() {
  const history = gitOutput(
    [
      "log",
      "--all",
      "--name-only",
      "--format=",
      "--",
      "workflow/tasks",
    ],
    "Unable to inspect reachable Git history for workflow tasks."
  );
  const tasks = new Set();

  for (const line of history.split(/\r?\n/)) {
    const normalized = line.trim().replace(/\\/g, "/");
    const match = normalized.match(/^workflow\/tasks\/([^/]+)\//);

    if (match) {
      tasks.add(match[1]);
    }
  }

  return [...tasks].sort();
}

function taskPathspec(task) {
  return `:(literal)workflow/tasks/${task}`;
}

function taskExistsAt(ref, task) {
  const result = git([
    "ls-tree",
    "-r",
    "--name-only",
    ref,
    "--",
    taskPathspec(task),
  ]);

  return !result.error &&
    result.status === 0 &&
    Boolean(result.stdout.trim());
}

function isAncestor(commit, ref) {
  const result = git([
    "merge-base",
    "--is-ancestor",
    commit,
    ref,
  ]);

  if (result.error || (result.status !== 0 && result.status !== 1)) {
    const detail = result.error
      ? result.error.message
      : (result.stderr || result.stdout || "").trim();

    console.error(
      "Unable to compare task deletion with the configured upstream."
    );

    if (detail) {
      console.error(detail);
    }

    process.exit(1);
  }

  return result.status === 0;
}

function fullDeletionCommit(task, ref) {
  const result = git([
    "log",
    "--full-history",
    "--format=%H",
    "--diff-filter=D",
    ref,
    "--",
    taskPathspec(task),
  ]);

  if (result.error || result.status !== 0) {
    return null;
  }

  for (const commit of result.stdout.split(/\r?\n/).filter(Boolean)) {
    if (!taskExistsAt(commit, task)) {
      return commit;
    }
  }

  return null;
}

function configuredUpstream() {
  const result = git([
    "rev-parse",
    "--abbrev-ref",
    "--symbolic-full-name",
    "@{upstream}",
  ]);

  if (result.error || result.status !== 0) {
    return { ref: null, reason: "no upstream is configured" };
  }

  const ref = result.stdout.trim();
  const verification = git([
    "rev-parse",
    "--verify",
    "--quiet",
    `${ref}^{commit}`,
  ]);

  if (!ref || verification.error || verification.status !== 0) {
    return {
      ref: null,
      reason: `configured upstream '${ref}' is not available locally`,
    };
  }

  return { ref, reason: null };
}

function taskLifecycleContext(active) {
  ensureTaskHistory();

  const activeSet = new Set(active);
  const deletedPendingCommit = [];
  const committedDeletions = [];
  const deletionCommits = new Map();

  for (const task of knownTasks()) {
    if (activeSet.has(task)) {
      continue;
    }

    if (taskExistsAt("HEAD", task)) {
      deletedPendingCommit.push(task);
      continue;
    }

    const deletionCommit = fullDeletionCommit(task, "HEAD") ||
      fullDeletionCommit(task, "--all");

    if (deletionCommit) {
      committedDeletions.push({ task, deletionCommit });
      deletionCommits.set(task, deletionCommit);
    }
  }

  const upstream = configuredUpstream();
  const deletedPendingPush = [];
  const historical = [];

  for (const deletion of committedDeletions) {
    if (
      upstream.ref &&
      isAncestor(deletion.deletionCommit, upstream.ref)
    ) {
      historical.push(deletion.task);
    } else {
      deletedPendingPush.push(deletion.task);
    }
  }

  if (!upstream.ref && committedDeletions.length) {
    console.error(
      `Push state cannot be confirmed because ${upstream.reason}; ` +
      "committed deletions are shown as Deleted Pending Push."
    );
  }

  return {
    lifecycle: {
      active,
      deleted_pending_commit: deletedPendingCommit.sort(),
      deleted_pending_push: deletedPendingPush.sort(),
      historical: historical.sort(),
    },
    deletionCommits,
    upstream,
  };
}

function taskLifecycle(active) {
  return taskLifecycleContext(active).lifecycle;
}

function taskEntries(tasks) {
  return tasks.map((task) => ({ task }));
}

function textTaskSection(title, description, tasks) {
  return [
    title,
    "-".repeat(title.length),
    description,
    "",
    ...(tasks.length ? tasks : ["No tasks found."]),
  ].join("\n");
}

function listTasks() {
  const options = listTasksArguments();
  const active = activeTasks();
  const lifecycle = options.mode === "active"
    ? {
      active,
      deleted_pending_commit: [],
      deleted_pending_push: [],
      historical: [],
    }
    : taskLifecycle(active);

  if (options.mode === "completed") {
    lifecycle.active = [];
  }

  if (options.json) {
    console.log(JSON.stringify(Object.fromEntries(
      Object.entries(lifecycle).map(([status, tasks]) => [
        status,
        taskEntries(tasks),
      ])
    ), null, 2));
    return;
  }

  if (options.mode === "active") {
    console.log(textTaskSection(
      "Active",
      "Task folder exists.",
      lifecycle.active
    ));
    return;
  }

  const sections = [
    [
      "Deleted Pending Commit",
      "Deleted from working tree, not committed.",
      lifecycle.deleted_pending_commit,
    ],
    [
      "Deleted Pending Push",
      "Deletion committed locally, not pushed.",
      lifecycle.deleted_pending_push,
    ],
    [
      "Historical",
      "Deletion committed and pushed.",
      lifecycle.historical,
    ],
  ];

  if (options.mode === "all") {
    sections.unshift([
      "Active",
      "Task folder exists.",
      lifecycle.active,
    ]);
  }

  console.log(sections.map((section) =>
    textTaskSection(...section)
  ).join("\n\n"));
}

function showTaskArguments() {
  let task = null;
  let json = false;

  for (const argument of process.argv.slice(3)) {
    if (argument === "--json") {
      if (json) {
        console.error("show-task accepts --json only once.");
        process.exit(1);
      }

      json = true;
      continue;
    }

    if (argument.startsWith("--")) {
      console.error(`Unknown show-task option: ${argument}`);
      process.exit(1);
    }

    if (task) {
      console.error("show-task accepts exactly one task name.");
      process.exit(1);
    }

    task = argument;
  }

  if (!task) {
    console.error("Please provide a full task folder name.");
    console.error(
      "Example: npx ailovecode-workflow show-task " +
      "20260913T1638_git-pr-and-task-lifecycle-workflow"
    );
    process.exit(1);
  }

  if (!/^\d{8}T\d{4}_[a-z0-9]+(?:-[a-z0-9]+)*$/.test(task)) {
    console.error(`Invalid task folder name: ${task}`);
    console.error("Use the full YYYYMMDDTHHMM_lowercase-kebab-name.");
    process.exit(1);
  }

  return { task, json };
}

function gitCommit() {
  const result = git([
    "rev-parse",
    "--verify",
    "--quiet",
    "HEAD^{commit}",
  ]);

  if (result.error || result.status !== 0) {
    return null;
  }

  return result.stdout.trim() || null;
}

function commitParents(commit) {
  if (!commit) return [];

  const result = git(["rev-list", "--parents", "-n", "1", commit]);

  if (result.error || result.status !== 0) {
    return [];
  }

  return result.stdout.trim().split(/\s+/).slice(1).filter(Boolean);
}

function recoveryCommitForDeletion(task, deletionCommit) {
  for (const parent of commitParents(deletionCommit)) {
    if (taskExistsAt(parent, task)) {
      return parent;
    }
  }

  return null;
}

function recordedCommitForLifecycle(task, snapshotCommit) {
  if (!snapshotCommit || !taskExistsAt(snapshotCommit, task)) {
    return null;
  }

  let current = snapshotCommit;
  let recorded = snapshotCommit;

  while (current) {
    const parent = commitParents(current)[0];

    if (!parent || !taskExistsAt(parent, task)) {
      return recorded;
    }

    recorded = parent;
    current = parent;
  }

  return recorded;
}

function commitInfo(commit) {
  if (!commit) return null;

  const result = git([
    "show",
    "-s",
    "--format=%H%x00%cI%x00%s",
    commit,
  ]);

  if (result.error || result.status !== 0) {
    return null;
  }

  const [hash, timestampValue, subject] = result.stdout.trimEnd().split("\0");

  if (!hash) return null;

  return {
    hash,
    timestamp: timestampValue || null,
    subject: subject || null,
  };
}

function upstreamInfo(upstream) {
  if (!upstream || !upstream.ref) return null;

  const result = git([
    "rev-parse",
    "--verify",
    "--quiet",
    `${upstream.ref}^{commit}`,
  ]);

  if (result.error || result.status !== 0) return null;

  const commit = result.stdout.trim();

  return commit ? { ref: upstream.ref, commit } : null;
}

function normalizeArtifactPath(value) {
  return value.replace(/\\/g, "/");
}

function lexicalCompare(first, second) {
  if (first < second) return -1;
  if (first > second) return 1;
  return 0;
}

function textContent(buffer) {
  if (buffer.length > showTaskTextLimit || buffer.includes(0)) {
    return { binary: buffer.includes(0), content: null };
  }

  try {
    return {
      binary: false,
      content: new TextDecoder("utf-8", { fatal: true }).decode(buffer),
    };
  } catch {
    return { binary: true, content: null };
  }
}

function missingArtifact(task, relativePath, source) {
  return {
    path: `workflow/tasks/${task}/${relativePath}`,
    available: false,
    source,
    size: null,
    binary: null,
    tracked: null,
    ignored: null,
    git_recoverable: false,
    content: null,
  };
}

function activeGitState(relativePath) {
  const trackedResult = git(["ls-files", "--error-unmatch", "--", relativePath]);
  const ignoredResult = git(["check-ignore", "-q", "--", relativePath]);
  const historyResult = git([
    "log",
    "-1",
    "--format=%H",
    "--",
    `:(literal)${relativePath}`,
  ]);
  const gitAvailable = !trackedResult.error &&
    (trackedResult.status === 0 || trackedResult.status === 1) &&
    !ignoredResult.error &&
    (ignoredResult.status === 0 || ignoredResult.status === 1);

  if (!gitAvailable) {
    return { tracked: null, ignored: null, gitRecoverable: false };
  }

  return {
    tracked: trackedResult.status === 0,
    ignored: ignoredResult.status === 0,
    gitRecoverable: trackedResult.status === 0 &&
      !historyResult.error &&
      historyResult.status === 0 &&
      Boolean(historyResult.stdout.trim()),
  };
}

function workingTreeFiles(directory, relativeBase) {
  const files = [];

  function visit(currentDirectory, currentRelative) {
    const entries = fs.readdirSync(currentDirectory, { withFileTypes: true })
      .sort((first, second) => lexicalCompare(first.name, second.name));

    for (const entry of entries) {
      const filePath = path.join(currentDirectory, entry.name);
      const relativePath = normalizeArtifactPath(
        path.posix.join(currentRelative, entry.name)
      );

      if (entry.isDirectory()) {
        visit(filePath, relativePath);
        continue;
      }

      const stat = fs.lstatSync(filePath);
      const gitState = activeGitState(relativePath);

      if (entry.isSymbolicLink()) {
        files.push({
          path: relativePath,
          available: true,
          source: "working_tree",
          size: stat.size,
          binary: null,
          tracked: gitState.tracked,
          ignored: gitState.ignored,
          git_recoverable: gitState.gitRecoverable,
          content: null,
        });
        continue;
      }

      if (!entry.isFile()) continue;

      const buffer = fs.readFileSync(filePath);
      const decoded = textContent(buffer);

      files.push({
        path: relativePath,
        available: true,
        source: "working_tree",
        size: buffer.length,
        binary: decoded.binary,
        tracked: gitState.tracked,
        ignored: gitState.ignored,
        git_recoverable: gitState.gitRecoverable,
        content: decoded.content,
      });
    }
  }

  visit(directory, relativeBase);
  return files.sort((first, second) => lexicalCompare(first.path, second.path));
}

function gitBuffer(args) {
  return spawnSync("git", args, {
    cwd: targetRoot,
    encoding: null,
    maxBuffer: 100 * 1024 * 1024,
    windowsHide: true,
  });
}

function gitTreeFiles(task, ref) {
  if (!ref) return [];

  const result = git([
    "ls-tree",
    "-r",
    "-z",
    "--name-only",
    ref,
    "--",
    taskPathspec(task),
  ]);

  if (result.error || result.status !== 0) return [];

  const paths = result.stdout.split("\0").filter(Boolean).sort();
  const files = [];

  for (const artifactPath of paths) {
    const blob = gitBuffer(["cat-file", "blob", `${ref}:${artifactPath}`]);

    if (blob.error || blob.status !== 0) continue;

    const buffer = blob.stdout;
    const decoded = textContent(buffer);

    files.push({
      path: normalizeArtifactPath(artifactPath),
      available: true,
      source: "git",
      size: buffer.length,
      binary: decoded.binary,
      tracked: true,
      ignored: false,
      git_recoverable: true,
      content: decoded.content,
    });
  }

  return files;
}

function groupArtifacts(task, source, files) {
  const prefix = `workflow/tasks/${task}/`;
  const byRelativePath = new Map(files.map((file) => [
    file.path.slice(prefix.length),
    file,
  ]));
  const taskDocument = byRelativePath.get("task.md") ||
    missingArtifact(task, "task.md", source);
  const planDocument = byRelativePath.get("implementation-plan.md") ||
    missingArtifact(task, "implementation-plan.md", source);
  const reviews = [];
  const supportingMaterials = [];

  for (const [relativePath, file] of byRelativePath) {
    if (relativePath.startsWith("reviews/")) {
      reviews.push(file);
    } else if (relativePath.startsWith("supporting-materials/")) {
      supportingMaterials.push(file);
    }
  }

  return {
    task_md: taskDocument,
    implementation_plan: planDocument,
    reviews: reviews.sort((first, second) => lexicalCompare(first.path, second.path)),
    supporting_materials: supportingMaterials.sort(
      (first, second) => lexicalCompare(first.path, second.path)
    ),
  };
}

function statusForTask(lifecycle, task) {
  const statuses = [
    ["active", "Active"],
    ["deleted_pending_commit", "Deleted Pending Commit"],
    ["deleted_pending_push", "Deleted Pending Push"],
    ["historical", "Historical"],
  ];

  for (const [key, label] of statuses) {
    if (lifecycle[key].includes(task)) return label;
  }

  return null;
}

function showTaskModel(task) {
  const active = activeTasks();
  const isActive = active.includes(task);
  let context = null;
  let status = "Active";
  let deletionCommit = null;
  let recoveryCommit = null;
  let upstream = null;

  if (!isActive) {
    context = taskLifecycleContext(active);
    status = statusForTask(context.lifecycle, task);

    if (!status) {
      console.error(`Task not found: ${task}`);
      process.exit(1);
    }

    deletionCommit = context.deletionCommits.get(task) || null;
    upstream = context.upstream;
    recoveryCommit = status === "Deleted Pending Commit"
      ? gitCommit()
      : recoveryCommitForDeletion(task, deletionCommit);
  } else {
    const head = gitCommit();
    recoveryCommit = head && taskExistsAt(head, task) ? head : null;
    const upstreamCandidate = configuredUpstream();
    upstream = upstreamCandidate.ref ? upstreamCandidate : null;
  }

  const source = isActive ? "working_tree" : "git";
  const files = isActive
    ? workingTreeFiles(
      path.join(targetWorkflow, "tasks", task),
      `workflow/tasks/${task}`
    )
    : gitTreeFiles(task, recoveryCommit);
  const recordedCommit = recordedCommitForLifecycle(task, recoveryCommit);

  return {
    task,
    status,
    artifacts: groupArtifacts(task, source, files),
    git: {
      recorded_commit: commitInfo(recordedCommit),
      deletion_commit: commitInfo(deletionCommit),
      recovery_commit: commitInfo(recoveryCommit),
      upstream: upstreamInfo(upstream),
    },
  };
}

function artifactText(file) {
  if (!file.available) return "Not available.";
  if (file.binary) return `[Binary file; ${file.size} bytes]`;
  if (file.content === null) return `[Content omitted; ${file.size} bytes]`;
  return file.content || "(empty)";
}

function artifactListText(files) {
  if (!files.length) return "No files found.";

  return files.map((file) => {
    const details = [
      `${file.size} bytes`,
      file.binary ? "binary" : "text",
      file.git_recoverable ? "Git-recoverable" : "not Git-recoverable",
    ].join(", ");
    const content = file.content === null ? "" : `\n${file.content || "(empty)"}`;
    return `${file.path} (${details})${content}`;
  }).join("\n\n");
}

function commitText(commit) {
  if (!commit) return "Unknown";
  return `${commit.hash} | ${commit.timestamp} | ${commit.subject || "(no subject)"}`;
}

function showTaskText(model) {
  const sections = [
    ["Task", model.task],
    ["Status", model.status],
    ["task.md", artifactText(model.artifacts.task_md)],
    ["implementation-plan.md", artifactText(model.artifacts.implementation_plan)],
    ["Reviews", artifactListText(model.artifacts.reviews)],
    ["Supporting Materials", artifactListText(model.artifacts.supporting_materials)],
    ["Git History", [
      `Task recorded: ${commitText(model.git.recorded_commit)}`,
      `Task removed: ${commitText(model.git.deletion_commit)}`,
      `Recovery snapshot: ${commitText(model.git.recovery_commit)}`,
      `Upstream: ${model.git.upstream
        ? `${model.git.upstream.ref} @ ${model.git.upstream.commit}`
        : "Unknown"}`,
    ].join("\n")],
  ];

  return sections.map(([title, content]) => [
    title,
    "-".repeat(title.length),
    content,
  ].join("\n")).join("\n\n");
}

function showTask() {
  const options = showTaskArguments();
  const model = showTaskModel(options.task);

  console.log(options.json
    ? JSON.stringify(model, null, 2)
    : showTaskText(model));
}

function git(args) {
  return spawnSync("git", args, {
    cwd: targetRoot,
    encoding: "utf8",
    maxBuffer: 100 * 1024 * 1024,
    windowsHide: true,
  });
}

function gitOutput(args, errorMessage) {
  const result = git(args);

  if (result.error || result.status !== 0) {
    const detail = result.error
      ? result.error.message
      : (result.stderr || result.stdout || "").trim();

    console.error(errorMessage);

    if (detail) {
      console.error(detail);
    }

    process.exit(1);
  }

  return result.stdout.trimEnd();
}

function refExists(ref) {
  const result = git([
    "rev-parse",
    "--verify",
    "--quiet",
    `${ref}^{commit}`,
  ]);

  return !result.error && result.status === 0;
}

function detectBase() {
  const remoteDefault = git([
    "symbolic-ref",
    "--quiet",
    "--short",
    "refs/remotes/origin/HEAD",
  ]);

  if (remoteDefault.status === 0) {
    const ref = remoteDefault.stdout.trim();

    if (ref && refExists(ref)) {
      return ref;
    }
  }

  for (const ref of [
    "main",
    "origin/main",
    "master",
    "origin/master",
  ]) {
    if (refExists(ref)) {
      return ref;
    }
  }

  console.error(
    "Unable to detect a base branch."
  );
  console.error(
    "Provide one explicitly: npx ailovecode-workflow review-context <base>"
  );
  process.exit(1);
}

function taskDocument(pathName) {
  const normalized = pathName.replace(/\\/g, "/");
  const match = normalized.match(
    /^workflow\/tasks\/([^/]+)\/(task\.md|implementation-plan\.md)$/
  );

  if (!match) {
    return null;
  }

  return {
    directory: `workflow/tasks/${match[1]}`,
    fileName: match[2],
  };
}

function changedTaskDirectories(nameStatus) {
  const directories = new Set();

  for (const line of nameStatus.split(/\r?\n/)) {
    if (!line) continue;

    const fields = line.split("\t");

    for (const pathName of fields.slice(1)) {
      const document = taskDocument(pathName);

      if (document) {
        directories.add(document.directory);
      }
    }
  }

  return [...directories].sort();
}

function taskDocumentAtHead(taskDirectory, fileName) {
  const relativePath = `${taskDirectory}/${fileName}`;
  const document = git([
    "show",
    `HEAD:${relativePath}`,
  ]);

  if (document.error || document.status !== 0) {
    return {
      path: relativePath,
      missing: true,
      content: null,
    };
  }

  return {
    path: relativePath,
    missing: false,
    content: document.stdout.trimEnd(),
  };
}

function markdownDocument(document) {
  const fileName = path.posix.basename(document.path);

  if (document.missing) {
    return `#### ${fileName}\n\nDocument is missing or deleted in the reviewed branch.`;
  }

  return [
    `#### ${fileName}`,
    "",
    "~~~markdown",
    document.content,
    "~~~",
  ].join("\n");
}

function availableReviewPath(taskDirectory, timestampValue) {
  const basePath = `${taskDirectory}/reviews/${timestampValue}`;
  let candidate = `${basePath}.md`;
  let sequence = 2;

  while (fs.existsSync(path.join(targetRoot, candidate))) {
    candidate = `${basePath}-${String(sequence).padStart(2, "0")}.md`;
    sequence += 1;
  }

  return candidate;
}

function reviewContextArguments() {
  let base = null;
  let json = false;

  for (const argument of process.argv.slice(3)) {
    if (argument === "--json") {
      json = true;
      continue;
    }

    if (argument.startsWith("-")) {
      console.error(`Unknown review-context option: ${argument}`);
      process.exit(1);
    }

    if (base) {
      console.error("review-context accepts at most one base ref.");
      process.exit(1);
    }

    base = argument;
  }

  return { base, json };
}

function reviewContext() {
  const repositoryCheck = git([
    "rev-parse",
    "--is-inside-work-tree",
  ]);

  if (
    repositoryCheck.error ||
    repositoryCheck.status !== 0 ||
    repositoryCheck.stdout.trim() !== "true"
  ) {
    console.error(
      "review-context must be run inside a Git worktree."
    );
    process.exit(1);
  }

  const options = reviewContextArguments();
  const requestedBase = options.base;
  const base = requestedBase || detectBase();

  if (base.startsWith("-") || !refExists(base)) {
    console.error(
      `Base ref not found: ${base}`
    );
    console.error(
      "Use an existing branch or ref, such as main or origin/main."
    );
    process.exit(1);
  }

  const mergeBase = gitOutput(
    ["merge-base", base, "HEAD"],
    `Unable to find a merge base between ${base} and HEAD.`
  );
  const currentBranchResult = git([
    "symbolic-ref",
    "--quiet",
    "--short",
    "HEAD",
  ]);
  const currentBranch = currentBranchResult.status === 0
    ? currentBranchResult.stdout.trim()
    : "HEAD (detached)";
  const headCommit = gitOutput(
    ["rev-parse", "HEAD"],
    "Unable to resolve HEAD."
  );
  const nameStatus = gitOutput(
    [
      "diff",
      "--name-status",
      "--find-renames",
      `${base}...HEAD`,
      "--",
      ".",
      ":(exclude)workflow/reviews/**",
      ":(exclude)workflow/tasks/*/reviews/**",
    ],
    `Unable to collect changed files for ${base}...HEAD.`
  );
  const diff = gitOutput(
    [
      "diff",
      "--find-renames",
      "--no-ext-diff",
      `${base}...HEAD`,
      "--",
      ".",
      ":(exclude)workflow/reviews/**",
      ":(exclude)workflow/tasks/*/reviews/**",
    ],
    `Unable to collect the diff for ${base}...HEAD.`
  );
  const taskDirectories = changedTaskDirectories(
    nameStatus
  );
  const reportTimestamp = reviewTimestamp();
  const tasks = taskDirectories.map((taskDirectory) => ({
    directory: taskDirectory,
    reportPath: availableReviewPath(taskDirectory, reportTimestamp),
    documents: {
      task: taskDocumentAtHead(taskDirectory, "task.md"),
      implementationPlan: taskDocumentAtHead(
        taskDirectory,
        "implementation-plan.md"
      ),
    },
  }));
  const context = {
    reviewTimestamp: reportTimestamp,
    repository: {
      base,
      headBranch: currentBranch,
      headCommit,
      mergeBase,
      comparison: `${base}...HEAD`,
    },
    changedFiles: nameStatus,
    tasks,
    branchDiff: diff,
  };

  if (options.json) {
    console.log(JSON.stringify(context, null, 2));
    return;
  }

  const sections = [
    "# AI Love Code - Developer Task Review Context",
    "",
    "## Repository",
    "",
    `- Base: \`${base}\``,
    `- Head branch: \`${currentBranch}\``,
    `- Head commit: \`${headCommit}\``,
    `- Merge base: \`${mergeBase}\``,
    `- Comparison: \`${base}...HEAD\``,
    `- Review timestamp: \`${reportTimestamp}\``,
    "",
    "## Changed Files",
    "",
    "~~~text",
    nameStatus || "No changed files.",
    "~~~",
    "",
    "## Discovered Tasks",
    "",
  ];

  if (tasks.length === 0) {
    sections.push(
      "No changed task or implementation-plan documents were discovered. Use PR metadata, branch context, or user clarification to identify the task before selecting a task-local review report path.",
      ""
    );
  } else {
    tasks.forEach(
      (task, index) => {
        sections.push(
          `### Task ${index + 1} - ${task.directory}`,
          "",
          `- Review report: \`${task.reportPath}\``,
          "",
          markdownDocument(task.documents.task),
          "",
          markdownDocument(task.documents.implementationPlan),
          ""
        );
      }
    );
  }

  sections.push(
    "## Branch Diff",
    "",
    "~~~diff",
    diff || "No branch diff.",
    "~~~"
  );

  console.log(sections.join("\n"));
}

function version() {
  const pkg = require(
    path.join(
      packageRoot,
      "package.json"
    )
  );

  console.log(
    `AILoveCode Workflow v${pkg.version}`
  );
}

function help() {
  console.log(`
AILoveCode Workflow

Usage:

  npx ailovecode-workflow init
  npx ailovecode-workflow update
  npx ailovecode-workflow configure-dev "implementation repository"
  npx ailovecode-workflow create-task "task name"
  npx ailovecode-workflow list-tasks [--all | --completed] [--json]
  npx ailovecode-workflow show-task <task> [--json]
  npx ailovecode-workflow review-context [base] [--json]
  npx ailovecode-workflow version

Aliases:

  npx ailovecode-workflow install
`);
}

switch (command) {
  case "init":
  case "install":
    init();
    break;

  case "update":
    update();
    break;

  case "configure-dev":
    configureDev();
    break;

  case "create-task":
    createTask();
    break;

  case "list-tasks":
    listTasks();
    break;

  case "show-task":
    showTask();
    break;

  case "review-context":
    reviewContext();
    break;

  case "version":
  case "--version":
  case "-v":
    version();
    break;

  case undefined:
  case "help":
  case "--help":
  case "-h":
    help();
    break;

  default:
    console.error(
      `Unknown command: ${command}`
    );

    help();

    process.exit(1);
}
