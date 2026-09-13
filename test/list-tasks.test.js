const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const cli = path.resolve(
  __dirname,
  "..",
  "bin",
  "ailovecode-workflow.js"
);

function run(executable, args, cwd) {
  return spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });
}

function git(repo, args) {
  const result = run("git", args, repo);

  assert.equal(
    result.status,
    0,
    `git ${args.join(" ")} failed:\n${result.stderr}`
  );

  return result.stdout.trim();
}

function makeDirectory(t) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "ailovecode-list-tasks-")
  );

  t.after(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  fs.mkdirSync(path.join(directory, "workflow", "tasks"), {
    recursive: true,
  });

  return directory;
}

function createTaskDirectory(repo, taskName, content = "## Request\n") {
  const taskPath = path.join(repo, "workflow", "tasks", taskName);
  fs.mkdirSync(taskPath, { recursive: true });
  fs.writeFileSync(path.join(taskPath, "task.md"), content, "utf8");
}

function makeRepository(t) {
  const repo = makeDirectory(t);
  git(repo, ["init", "-b", "main"]);
  git(repo, ["config", "user.name", "AILoveCode Test"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  return repo;
}

function makeBareRepository(t) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "ailovecode-list-tasks-remote-")
  );

  t.after(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  git(directory, ["init", "--bare"]);
  return directory;
}

function configureUpstream(t, repo) {
  const remote = makeBareRepository(t);
  git(repo, ["remote", "add", "origin", remote]);
  git(repo, ["push", "-u", "origin", "main"]);
  return remote;
}

test("lists active task directories deterministically without Git", (t) => {
  const directory = makeDirectory(t);
  createTaskDirectory(directory, "20260913T1200_second-task");
  createTaskDirectory(directory, "20260912T1200_first-task");
  fs.writeFileSync(
    path.join(directory, "workflow", "tasks", "not-a-directory.txt"),
    "ignored\n",
    "utf8"
  );

  const result = run(process.execPath, [cli, "list-tasks"], directory);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    result.stdout.trim(),
    [
      "Active",
      "------",
      "Task folder exists.",
      "",
      "20260912T1200_first-task",
      "20260913T1200_second-task",
    ].join("\n")
  );
});

test("reports an empty active task list", (t) => {
  const directory = makeDirectory(t);
  const result = run(process.execPath, [cli, "list-tasks"], directory);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    result.stdout.trim(),
    "Active\n------\nTask folder exists.\n\nNo tasks found."
  );
});

test("lists all four task lifecycle states without changing the worktree", (t) => {
  const repo = makeRepository(t);
  createTaskDirectory(repo, "20260910T1200_historical-task");
  createTaskDirectory(repo, "20260911T1200_pending-push-task");
  createTaskDirectory(repo, "20260912T1200_staged-deletion-task");
  createTaskDirectory(repo, "20260913T1200_unstaged-deletion-task");
  createTaskDirectory(repo, "20260914T1200_active-committed-task");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "add tasks"]);
  configureUpstream(t, repo);

  fs.rmSync(
    path.join(repo, "workflow", "tasks", "20260910T1200_historical-task"),
    { recursive: true }
  );
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "remove historical task"]);
  git(repo, ["push"]);

  fs.rmSync(
    path.join(repo, "workflow", "tasks", "20260911T1200_pending-push-task"),
    { recursive: true }
  );
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "remove pending push task"]);

  fs.rmSync(
    path.join(repo, "workflow", "tasks", "20260912T1200_staged-deletion-task"),
    { recursive: true }
  );
  git(repo, ["add", "-A"]);
  fs.rmSync(
    path.join(repo, "workflow", "tasks", "20260913T1200_unstaged-deletion-task"),
    { recursive: true }
  );
  createTaskDirectory(repo, "20260915T1200_active-untracked-task");

  const statusBefore = git(repo, ["status", "--short"]);
  const all = run(process.execPath, [cli, "list-tasks", "--all"], repo);
  const completed = run(
    process.execPath,
    [cli, "list-tasks", "--completed"],
    repo
  );

  assert.equal(all.status, 0, all.stderr);
  assert.equal(
    all.stdout.trim(),
    [
      "Active",
      "------",
      "Task folder exists.",
      "",
      "20260914T1200_active-committed-task",
      "20260915T1200_active-untracked-task",
      "",
      "Deleted Pending Commit",
      "----------------------",
      "Deleted from working tree, not committed.",
      "",
      "20260912T1200_staged-deletion-task",
      "20260913T1200_unstaged-deletion-task",
      "",
      "Deleted Pending Push",
      "--------------------",
      "Deletion committed locally, not pushed.",
      "",
      "20260911T1200_pending-push-task",
      "",
      "Historical",
      "----------",
      "Deletion committed and pushed.",
      "",
      "20260910T1200_historical-task",
    ].join("\n")
  );
  assert.equal(completed.status, 0, completed.stderr);
  assert.equal(
    completed.stdout.trim(),
    [
      "Deleted Pending Commit",
      "----------------------",
      "Deleted from working tree, not committed.",
      "",
      "20260912T1200_staged-deletion-task",
      "20260913T1200_unstaged-deletion-task",
      "",
      "Deleted Pending Push",
      "--------------------",
      "Deletion committed locally, not pushed.",
      "",
      "20260911T1200_pending-push-task",
      "",
      "Historical",
      "----------",
      "Deletion committed and pushed.",
      "",
      "20260910T1200_historical-task",
    ].join("\n")
  );
  assert.equal(git(repo, ["status", "--short"]), statusBefore);
});

test("emits deterministic JSON for each listing mode", (t) => {
  const repo = makeRepository(t);
  createTaskDirectory(repo, "20260910T1200_old-task");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "add old task"]);
  configureUpstream(t, repo);
  fs.rmSync(path.join(repo, "workflow", "tasks", "20260910T1200_old-task"), {
    recursive: true,
  });
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "remove old task"]);
  git(repo, ["push"]);
  createTaskDirectory(repo, "20260913T1200_active-task");

  const all = run(
    process.execPath,
    [cli, "list-tasks", "--all", "--json"],
    repo
  );
  const active = run(
    process.execPath,
    [cli, "list-tasks", "--json"],
    repo
  );
  const completed = run(
    process.execPath,
    [cli, "list-tasks", "--completed", "--json"],
    repo
  );

  assert.equal(all.status, 0, all.stderr);
  assert.deepEqual(JSON.parse(all.stdout), {
    active: [{ task: "20260913T1200_active-task" }],
    deleted_pending_commit: [],
    deleted_pending_push: [],
    historical: [{ task: "20260910T1200_old-task" }],
  });
  assert.deepEqual(JSON.parse(active.stdout), {
    active: [{ task: "20260913T1200_active-task" }],
    deleted_pending_commit: [],
    deleted_pending_push: [],
    historical: [],
  });
  assert.deepEqual(JSON.parse(completed.stdout), {
    active: [],
    deleted_pending_commit: [],
    deleted_pending_push: [],
    historical: [{ task: "20260910T1200_old-task" }],
  });
  assert.equal(Object.hasOwn(JSON.parse(all.stdout), "completed"), false);
});

test("keeps committed deletions pending push when no upstream is configured", (t) => {
  const repo = makeRepository(t);
  createTaskDirectory(repo, "20260910T1200_pending-task");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "add task"]);
  fs.rmSync(path.join(repo, "workflow", "tasks", "20260910T1200_pending-task"), {
    recursive: true,
  });
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "remove task"]);

  const result = run(
    process.execPath,
    [cli, "list-tasks", "--completed", "--json"],
    repo
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /no upstream is configured/);
  assert.deepEqual(JSON.parse(result.stdout), {
    active: [],
    deleted_pending_commit: [],
    deleted_pending_push: [{ task: "20260910T1200_pending-task" }],
    historical: [],
  });
});

test("uses the local remote-tracking ref without fetching", (t) => {
  const repo = makeRepository(t);
  createTaskDirectory(repo, "20260910T1200_stale-upstream-task");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "add task"]);
  configureUpstream(t, repo);
  const upstreamBeforeDeletion = git(repo, ["rev-parse", "origin/main"]);

  fs.rmSync(
    path.join(repo, "workflow", "tasks", "20260910T1200_stale-upstream-task"),
    { recursive: true }
  );
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "remove task"]);
  git(repo, ["push"]);
  git(repo, ["update-ref", "refs/remotes/origin/main", upstreamBeforeDeletion]);

  const result = run(
    process.execPath,
    [cli, "list-tasks", "--all", "--json"],
    repo
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(git(repo, ["rev-parse", "origin/main"]), upstreamBeforeDeletion);
  assert.deepEqual(JSON.parse(result.stdout), {
    active: [],
    deleted_pending_commit: [],
    deleted_pending_push: [{ task: "20260910T1200_stale-upstream-task" }],
    historical: [],
  });
});

test("fails lifecycle modes clearly when Git history is unavailable", (t) => {
  const outsideGit = makeDirectory(t);
  const outsideResult = run(
    process.execPath,
    [cli, "list-tasks", "--completed"],
    outsideGit
  );

  assert.equal(outsideResult.status, 1);
  assert.match(outsideResult.stderr, /outside a Git worktree/);

  const emptyRepository = makeRepository(t);
  const emptyResult = run(
    process.execPath,
    [cli, "list-tasks", "--all"],
    emptyRepository
  );

  assert.equal(emptyResult.status, 1);
  assert.match(emptyResult.stderr, /no reachable Git history/);
});

test("rejects invalid options and missing workflow directories", (t) => {
  const directory = makeDirectory(t);
  const conflicting = run(
    process.execPath,
    [cli, "list-tasks", "--all", "--completed"],
    directory
  );
  const unknown = run(
    process.execPath,
    [cli, "list-tasks", "--unknown"],
    directory
  );
  const missingWorkflow = fs.mkdtempSync(
    path.join(os.tmpdir(), "ailovecode-list-missing-")
  );
  t.after(() => {
    fs.rmSync(missingWorkflow, { recursive: true, force: true });
  });
  const missing = run(
    process.execPath,
    [cli, "list-tasks"],
    missingWorkflow
  );

  assert.equal(conflicting.status, 1);
  assert.match(conflicting.stderr, /only one of --all or --completed/);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Unknown list-tasks option/);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /workflow\/tasks folder not found/);
});
