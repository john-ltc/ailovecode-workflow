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
      "Active Tasks",
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
  assert.equal(result.stdout.trim(), "Active Tasks\n\nNo tasks found.");
});

test("lists active and historical task paths without implying completion", (t) => {
  const repo = makeRepository(t);
  createTaskDirectory(repo, "20260910T1200_historical-task");
  createTaskDirectory(repo, "20260911T1200_active-committed-task");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "add tasks"]);

  fs.rmSync(
    path.join(repo, "workflow", "tasks", "20260910T1200_historical-task"),
    { recursive: true }
  );
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "remove historical task"]);
  createTaskDirectory(repo, "20260912T1200_active-untracked-task");

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
      "20260911T1200_active-committed-task",
      "20260912T1200_active-untracked-task",
      "",
      "Completed / Historical",
      "----------------------",
      "20260910T1200_historical-task",
    ].join("\n")
  );
  assert.equal(completed.status, 0, completed.stderr);
  assert.equal(
    completed.stdout.trim(),
    [
      "Completed / Historical",
      "----------------------",
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
  fs.rmSync(path.join(repo, "workflow", "tasks", "20260910T1200_old-task"), {
    recursive: true,
  });
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "remove old task"]);
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
    completed: [{ task: "20260910T1200_old-task" }],
  });
  assert.deepEqual(JSON.parse(active.stdout), {
    active: [{ task: "20260913T1200_active-task" }],
    completed: [],
  });
  assert.deepEqual(JSON.parse(completed.stdout), {
    active: [],
    completed: [{ task: "20260910T1200_old-task" }],
  });
});

test("fails historical modes clearly when Git history is unavailable", (t) => {
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
