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

function write(repo, relativePath, content) {
  const filePath = path.join(repo, relativePath);
  fs.mkdirSync(path.dirname(filePath), {
    recursive: true,
  });
  fs.writeFileSync(filePath, content, "utf8");
}

function makeRepository(t) {
  const repo = fs.mkdtempSync(
    path.join(os.tmpdir(), "ailovecode-review-")
  );

  t.after(() => {
    fs.rmSync(repo, { recursive: true, force: true });
  });

  git(repo, ["init", "-b", "main"]);
  git(repo, ["config", "user.name", "AILoveCode Test"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  write(repo, "README.md", "# Fixture\n");
  write(
    repo,
    "workflow/tasks/existing-task/task.md",
    "## Request\n\nKeep existing behavior.\n"
  );
  write(
    repo,
    "workflow/tasks/existing-task/implementation-plan.md",
    "# Existing Plan\n"
  );
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "baseline"]);

  return repo;
}

function commitFeature(repo) {
  git(repo, ["switch", "-c", "feature/review"]);
  write(
    repo,
    "workflow/tasks/new-task/task.md",
    "## Request\n\nAdd the review feature.\n"
  );
  write(
    repo,
    "workflow/tasks/new-task/implementation-plan.md",
    "# Review Plan\n"
  );
  write(
    repo,
    "workflow/tasks/existing-task/implementation-plan.md",
    "# Existing Plan\n\nUpdated approach.\n"
  );
  write(repo, "feature.js", "module.exports = true;\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "add review feature"]);
}

test("collects explicit-base context for multiple tasks", (t) => {
  const repo = makeRepository(t);
  commitFeature(repo);

  const result = run(
    process.execPath,
    [cli, "review-context", "main"],
    repo
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /# AI Love Code - Review Context/);
  assert.match(result.stdout, /- Base: `main`/);
  assert.match(result.stdout, /- Head branch: `feature\/review`/);
  assert.match(
    result.stdout,
    /- Review report: `workflow\/reviews\/feature-review\.md`/
  );
  assert.match(
    result.stdout,
    /Task 1 - workflow\/tasks\/existing-task/
  );
  assert.match(
    result.stdout,
    /Task 2 - workflow\/tasks\/new-task/
  );
  assert.match(result.stdout, /Keep existing behavior\./);
  assert.match(result.stdout, /Updated approach\./);
  assert.match(result.stdout, /Add the review feature\./);
  assert.match(result.stdout, /diff --git a\/feature\.js b\/feature\.js/);
});

test("detects main automatically when no remote default exists", (t) => {
  const repo = makeRepository(t);
  commitFeature(repo);

  const result = run(
    process.execPath,
    [cli, "review-context"],
    repo
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /- Base: `main`/);
});

test("reports when a branch has no changed task documents", (t) => {
  const repo = makeRepository(t);
  git(repo, ["switch", "-c", "feature/code-only"]);
  write(repo, "feature.js", "module.exports = true;\n");
  write(
    repo,
    "workflow/reviews/feature-code-only.md",
    "# Previous Review\n"
  );
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "code-only change"]);

  const result = run(
    process.execPath,
    [cli, "review-context", "main"],
    repo
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /No changed task or implementation-plan documents were discovered\./
  );
  assert.match(result.stdout, /## Branch Diff/);
  assert.doesNotMatch(
    result.stdout,
    /A\s+workflow\/reviews\/feature-code-only\.md/
  );
  assert.doesNotMatch(
    result.stdout,
    /diff --git a\/workflow\/reviews\//
  );
});

test("uses the commit hash for a detached-HEAD report path", (t) => {
  const repo = makeRepository(t);
  commitFeature(repo);
  const commit = git(repo, ["rev-parse", "HEAD"]);
  git(repo, ["checkout", "--detach"]);

  const result = run(
    process.execPath,
    [cli, "review-context", "main"],
    repo
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /- Head branch: `HEAD \(detached\)`/);
  assert.ok(
    result.stdout.includes(
      `- Review report: \`workflow/reviews/detached-${commit.slice(0, 12)}.md\``
    )
  );
});

test("reports a deleted task document without crashing", (t) => {
  const repo = makeRepository(t);
  git(repo, ["switch", "-c", "feature/delete-task"]);
  fs.rmSync(
    path.join(repo, "workflow/tasks/existing-task/task.md")
  );
  write(
    repo,
    "workflow/tasks/existing-task/implementation-plan.md",
    "# Replacement Plan\n"
  );
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "remove task document"]);

  const result = run(
    process.execPath,
    [cli, "review-context", "main"],
    repo
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /task\.md\n\nDocument is missing or deleted/
  );
  assert.match(result.stdout, /# Replacement Plan/);
});

test("reads task documents from HEAD instead of the working tree", (t) => {
  const repo = makeRepository(t);
  commitFeature(repo);
  write(
    repo,
    "workflow/tasks/new-task/task.md",
    "## Request\n\nUncommitted replacement.\n"
  );

  const result = run(
    process.execPath,
    [cli, "review-context", "main"],
    repo
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Add the review feature\./);
  assert.doesNotMatch(result.stdout, /Uncommitted replacement/);
});

test("fails clearly for an invalid base", (t) => {
  const repo = makeRepository(t);

  const result = run(
    process.execPath,
    [cli, "review-context", "not-a-branch"],
    repo
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Base ref not found: not-a-branch/);
});

test("fails clearly outside a Git worktree", (t) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "ailovecode-no-git-")
  );

  t.after(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const result = run(
    process.execPath,
    [cli, "review-context", "main"],
    directory
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /must be run inside a Git worktree/);
});

test("existing commands remain available", (t) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "ailovecode-smoke-")
  );

  t.after(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const help = run(process.execPath, [cli, "help"], directory);
  const version = run(
    process.execPath,
    [cli, "version"],
    directory
  );
  const init = run(process.execPath, [cli, "init"], directory);
  const createTask = run(
    process.execPath,
    [cli, "create-task", "smoke task"],
    directory
  );
  const update = run(
    process.execPath,
    [cli, "update"],
    directory
  );

  assert.equal(help.status, 0, help.stderr);
  assert.match(
    help.stdout,
    /configure-dev "implementation repository"/
  );
  assert.match(help.stdout, /review-context \[base\]/);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /AILoveCode Workflow v1\.0\.0/);
  assert.equal(init.status, 0, init.stderr);
  assert.equal(createTask.status, 0, createTask.stderr);
  assert.equal(update.status, 0, update.stderr);
  assert.equal(fs.existsSync(path.join(directory, "workflow")), true);
  assert.equal(
    fs.existsSync(path.join(directory, "workflow", "reviews")),
    true
  );
  assert.equal(
    fs.readdirSync(path.join(directory, "workflow", "tasks")).length,
    1
  );
});
