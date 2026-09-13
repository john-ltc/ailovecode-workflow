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

function makeDirectory(t, prefix = "ailovecode-show-task-") {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));

  t.after(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  fs.mkdirSync(path.join(directory, "workflow", "tasks"), {
    recursive: true,
  });

  return directory;
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
    path.join(os.tmpdir(), "ailovecode-show-task-remote-")
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

function taskPath(repo, task) {
  return path.join(repo, "workflow", "tasks", task);
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function createTask(repo, task, content = "## Request\n") {
  writeFile(path.join(taskPath(repo, task), "task.md"), content);
}

function show(repo, task, ...options) {
  return run(process.execPath, [cli, "show-task", task, ...options], repo);
}

function showJson(repo, task) {
  const result = show(repo, task, "--json");
  assert.equal(result.status, 0, result.stderr);
  return { result, model: JSON.parse(result.stdout) };
}

function repositoryState(repo) {
  return {
    head: git(repo, ["rev-parse", "HEAD"]),
    index: git(repo, ["ls-files", "--stage"]),
    refs: git(repo, ["show-ref"]),
    status: git(repo, ["status", "--short", "--ignored"]),
  };
}

test("retrieves active working-tree artifacts and deterministic JSON", (t) => {
  const repo = makeRepository(t);
  const task = "20260913T1200_active-task";
  const root = taskPath(repo, task);

  createTask(repo, task, "original task\n");
  writeFile(path.join(root, "implementation-plan.md"), "plan\n");
  writeFile(path.join(root, "reviews", "20260913T120000.md"), "review\n");
  writeFile(path.join(repo, ".gitignore"), [
    `workflow/tasks/${task}/supporting-materials/ignored.txt`,
    "",
  ].join("\n"));
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "record active task"]);

  writeFile(path.join(root, "task.md"), "working tree task\n");
  writeFile(path.join(root, "supporting-materials", "note.txt"), "note\n");
  writeFile(path.join(root, "supporting-materials", "ignored.txt"), "secret\n");
  writeFile(
    path.join(root, "supporting-materials", "binary.dat"),
    Buffer.from([0, 1, 2, 3])
  );
  writeFile(
    path.join(root, "supporting-materials", "large.txt"),
    Buffer.alloc(256 * 1024 + 1, 65)
  );

  const before = repositoryState(repo);
  const first = show(repo, task, "--json");
  const second = show(repo, task, "--json");
  const after = repositoryState(repo);

  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(first.stdout, second.stdout);
  assert.deepEqual(after, before);

  const model = JSON.parse(first.stdout);
  assert.deepEqual(Object.keys(model), ["task", "status", "artifacts", "git"]);
  assert.equal(model.task, task);
  assert.equal(model.status, "Active");
  assert.equal(model.artifacts.task_md.content, "working tree task\n");
  assert.equal(model.artifacts.task_md.tracked, true);
  assert.equal(model.artifacts.task_md.git_recoverable, true);
  assert.equal(model.artifacts.reviews.length, 1);

  const materials = Object.fromEntries(
    model.artifacts.supporting_materials.map((file) => [
      path.basename(file.path),
      file,
    ])
  );
  assert.equal(materials["note.txt"].content, "note\n");
  assert.equal(materials["note.txt"].tracked, false);
  assert.equal(materials["note.txt"].git_recoverable, false);
  assert.equal(materials["ignored.txt"].ignored, true);
  assert.equal(materials["ignored.txt"].git_recoverable, false);
  assert.equal(materials["binary.dat"].binary, true);
  assert.equal(materials["binary.dat"].content, null);
  assert.equal(materials["large.txt"].binary, false);
  assert.equal(materials["large.txt"].content, null);
  assert.ok(model.git.recorded_commit.hash);
  assert.ok(model.git.recovery_commit.hash);
  assert.equal(model.git.deletion_commit, null);
  assert.equal(model.git.upstream, null);
});

test("retrieves an active task without Git and represents missing artifacts", (t) => {
  const directory = makeDirectory(t);
  const task = "20260913T1210_filesystem-task";
  createTask(directory, task, "filesystem only\n");

  const { model } = showJson(directory, task);

  assert.equal(model.status, "Active");
  assert.equal(model.artifacts.task_md.content, "filesystem only\n");
  assert.equal(model.artifacts.task_md.tracked, null);
  assert.equal(model.artifacts.task_md.ignored, null);
  assert.equal(model.artifacts.task_md.git_recoverable, false);
  assert.equal(model.artifacts.implementation_plan.available, false);
  assert.deepEqual(model.artifacts.reviews, []);
  assert.deepEqual(model.artifacts.supporting_materials, []);
  assert.deepEqual(model.git, {
    recorded_commit: null,
    deletion_commit: null,
    recovery_commit: null,
    upstream: null,
  });
});

test("matches all list-tasks lifecycle states and remains read-only", (t) => {
  const repo = makeRepository(t);
  const historical = "20260910T1200_historical-task";
  const pendingPush = "20260911T1200_pending-push-task";
  const pendingCommit = "20260912T1200_pending-commit-task";
  const active = "20260913T1200_active-task";

  for (const task of [historical, pendingPush, pendingCommit, active]) {
    createTask(repo, task, `${task}\n`);
  }
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "record lifecycle tasks"]);
  configureUpstream(t, repo);

  fs.rmSync(taskPath(repo, historical), { recursive: true });
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "remove historical task"]);
  git(repo, ["push"]);

  fs.rmSync(taskPath(repo, pendingPush), { recursive: true });
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "remove pending push task"]);

  fs.rmSync(taskPath(repo, pendingCommit), { recursive: true });
  const before = repositoryState(repo);
  const expected = new Map([
    [historical, "Historical"],
    [pendingPush, "Deleted Pending Push"],
    [pendingCommit, "Deleted Pending Commit"],
    [active, "Active"],
  ]);

  for (const [task, status] of expected) {
    const { model } = showJson(repo, task);
    assert.equal(model.status, status);
    assert.equal(model.artifacts.task_md.content, `${task}\n`);
  }

  const listing = run(
    process.execPath,
    [cli, "list-tasks", "--all", "--json"],
    repo
  );
  assert.equal(listing.status, 0, listing.stderr);
  const listed = JSON.parse(listing.stdout);
  const listStatuses = new Map();
  const labels = {
    active: "Active",
    deleted_pending_commit: "Deleted Pending Commit",
    deleted_pending_push: "Deleted Pending Push",
    historical: "Historical",
  };
  for (const [key, tasks] of Object.entries(listed)) {
    for (const entry of tasks) listStatuses.set(entry.task, labels[key]);
  }
  assert.deepEqual(listStatuses, expected);
  assert.deepEqual(repositoryState(repo), before);
});

test("recovers the latest committed state before the current deletion", (t) => {
  const repo = makeRepository(t);
  const task = "20260913T1230_recreated-task";

  createTask(repo, task, "first lifecycle\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "record first lifecycle"]);
  fs.rmSync(taskPath(repo, task), { recursive: true });
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "remove first lifecycle"]);

  createTask(repo, task, "second lifecycle\n");
  writeFile(
    path.join(taskPath(repo, task), "implementation-plan.md"),
    "second plan\n"
  );
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "record second lifecycle"]);
  const secondRecording = git(repo, ["rev-parse", "HEAD"]);
  fs.rmSync(taskPath(repo, task), { recursive: true });
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "remove second lifecycle"]);
  const secondDeletion = git(repo, ["rev-parse", "HEAD"]);

  const { model } = showJson(repo, task);

  assert.equal(model.status, "Deleted Pending Push");
  assert.equal(model.artifacts.task_md.content, "second lifecycle\n");
  assert.equal(model.artifacts.implementation_plan.content, "second plan\n");
  assert.equal(model.git.recorded_commit.hash, secondRecording);
  assert.equal(model.git.recovery_commit.hash, secondRecording);
  assert.equal(model.git.deletion_commit.hash, secondDeletion);
});

test("treats an untracked recreation as the latest active lifecycle", (t) => {
  const repo = makeRepository(t);
  const task = "20260913T1235_active-recreation";

  createTask(repo, task, "old lifecycle\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "record old lifecycle"]);
  fs.rmSync(taskPath(repo, task), { recursive: true });
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "remove old lifecycle"]);
  createTask(repo, task, "current untracked lifecycle\n");

  const { model } = showJson(repo, task);

  assert.equal(model.status, "Active");
  assert.equal(model.artifacts.task_md.content, "current untracked lifecycle\n");
  assert.equal(model.artifacts.task_md.tracked, false);
  assert.equal(model.artifacts.task_md.git_recoverable, false);
  assert.equal(model.git.recorded_commit, null);
  assert.equal(model.git.recovery_commit, null);
  assert.equal(model.git.deletion_commit, null);
});

test("renders concise human-readable task context", (t) => {
  const directory = makeDirectory(t);
  const task = "20260913T1240_human-output";
  createTask(directory, task, "human task\n");

  const result = show(directory, task);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Task\n----\n20260913T1240_human-output/m);
  assert.match(result.stdout, /Status\n------\nActive/);
  assert.match(result.stdout, /task\.md\n-------\nhuman task/);
  assert.match(result.stdout, /implementation-plan\.md\n----------------------\nNot available\./);
  assert.match(result.stdout, /Git History\n-----------\nTask recorded: Unknown/);
});

test("fails clearly for missing tasks and invalid invocations", (t) => {
  const repo = makeRepository(t);
  createTask(repo, "20260913T1250_known-task");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "record known task"]);

  const missing = show(repo, "20260913T1251_missing-task", "--json");
  const traversal = show(repo, "../task", "--json");
  const noTask = run(process.execPath, [cli, "show-task"], repo);
  const extra = run(
    process.execPath,
    [cli, "show-task", "20260913T1250_known-task", "extra"],
    repo
  );
  const unknown = show(repo, "20260913T1250_known-task", "--unknown");

  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Task not found/);
  assert.equal(traversal.status, 1);
  assert.match(traversal.stderr, /Invalid task folder name/);
  assert.equal(noTask.status, 1);
  assert.match(noTask.stderr, /provide a full task folder name/);
  assert.equal(extra.status, 1);
  assert.match(extra.stderr, /exactly one task name/);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Unknown show-task option/);
});

test("keeps locally stale upstream state offline", (t) => {
  const repo = makeRepository(t);
  const task = "20260913T1300_stale-upstream-task";
  createTask(repo, task, "stale upstream\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "record stale task"]);
  configureUpstream(t, repo);
  const upstreamBeforeDeletion = git(repo, ["rev-parse", "origin/main"]);

  fs.rmSync(taskPath(repo, task), { recursive: true });
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "remove stale task"]);
  git(repo, ["push"]);
  git(repo, ["update-ref", "refs/remotes/origin/main", upstreamBeforeDeletion]);
  git(repo, [
    "remote",
    "set-url",
    "origin",
    "https://example.invalid/ailovecode-workflow.git",
  ]);

  const { model } = showJson(repo, task);

  assert.equal(model.status, "Deleted Pending Push");
  assert.equal(model.git.upstream.ref, "origin/main");
  assert.equal(model.git.upstream.commit, upstreamBeforeDeletion);
  assert.equal(git(repo, ["rev-parse", "origin/main"]), upstreamBeforeDeletion);
});

test("advertises show-task in help output", (t) => {
  const directory = makeDirectory(t);
  const result = run(process.execPath, [cli, "--help"], directory);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /show-task <task> \[--json\]/);
});
