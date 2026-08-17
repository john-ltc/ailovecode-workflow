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

function makeDirectory(t, prefix) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), prefix)
  );

  t.after(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  return directory;
}

function makeGitRepository(t, prefix) {
  const repository = makeDirectory(t, prefix);
  git(repository, ["init", "-b", "main"]);
  return repository;
}

function initWorkflow(repository, initialAgents = "") {
  if (initialAgents) {
    fs.writeFileSync(
      path.join(repository, "AGENTS.md"),
      initialAgents,
      "utf8"
    );
  }

  const result = run(
    process.execPath,
    [cli, "init"],
    repository
  );

  assert.equal(result.status, 0, result.stderr);
}

function occurrences(content, value) {
  return content.split(value).length - 1;
}

test("configures split repositories with one managed tag", (t) => {
  const taskRepository = makeGitRepository(
    t,
    "ailovecode task repo "
  );
  const implementationRepository = makeGitRepository(
    t,
    "ailovecode implementation repo "
  );
  initWorkflow(taskRepository, "# User-owned instructions\n");
  const targetStatusBefore = git(implementationRepository, [
    "status",
    "--short",
  ]);

  const result = run(
    process.execPath,
    [cli, "configure-dev", implementationRepository],
    taskRepository
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /Workflow development repositories configured\./
  );
  assert.match(result.stdout, /Workflow task repository:/);
  assert.match(result.stdout, /Implementation repository:/);

  for (const fileName of ["AGENTS.md", "CLAUDE.md"]) {
    const content = fs.readFileSync(
      path.join(taskRepository, fileName),
      "utf8"
    );

    assert.equal(occurrences(content, "<workflow-dev>"), 1);
    assert.equal(occurrences(content, "</workflow-dev>"), 1);
    assert.equal(
      occurrences(content, "<ailovecode-workflow>"),
      1
    );
    assert.match(content, /Implementation repository:/);
    assert.ok(content.includes(`\`${implementationRepository}\``));
    assert.ok(content.includes(`\`${taskRepository}\``));
  }

  const agents = fs.readFileSync(
    path.join(taskRepository, "AGENTS.md"),
    "utf8"
  );
  assert.match(agents, /# User-owned instructions/);
  assert.equal(
    fs.existsSync(
      path.join(
        taskRepository,
        "workflow",
        "workflow-dev-tag.md"
      )
    ),
    false
  );
  assert.equal(
    git(implementationRepository, ["status", "--short"]),
    targetStatusBefore
  );
});

test("configuration is idempotent and supports reconfiguration", (t) => {
  const taskRepository = makeGitRepository(
    t,
    "ailovecode task repo "
  );
  const firstImplementation = makeGitRepository(
    t,
    "ailovecode target one "
  );
  const secondImplementation = makeGitRepository(
    t,
    "ailovecode target two "
  );
  initWorkflow(taskRepository);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = run(
      process.execPath,
      [cli, "configure-dev", firstImplementation],
      taskRepository
    );
    assert.equal(result.status, 0, result.stderr);
  }

  const beforeReconfigure = fs.readFileSync(
    path.join(taskRepository, "AGENTS.md"),
    "utf8"
  );
  assert.equal(
    occurrences(beforeReconfigure, "<workflow-dev>"),
    1
  );

  const reconfigure = run(
    process.execPath,
    [cli, "configure-dev", secondImplementation],
    taskRepository
  );

  assert.equal(reconfigure.status, 0, reconfigure.stderr);

  for (const fileName of ["AGENTS.md", "CLAUDE.md"]) {
    const content = fs.readFileSync(
      path.join(taskRepository, fileName),
      "utf8"
    );
    assert.equal(occurrences(content, "<workflow-dev>"), 1);
    assert.ok(content.includes(secondImplementation));
    assert.equal(content.includes(firstImplementation), false);
  }
});

test("update preserves the workflow development tag", (t) => {
  const taskRepository = makeGitRepository(
    t,
    "ailovecode task repo "
  );
  const implementationRepository = makeGitRepository(
    t,
    "ailovecode implementation repo "
  );
  initWorkflow(taskRepository);

  const configure = run(
    process.execPath,
    [cli, "configure-dev", implementationRepository],
    taskRepository
  );
  assert.equal(configure.status, 0, configure.stderr);

  const update = run(
    process.execPath,
    [cli, "update"],
    taskRepository
  );
  assert.equal(update.status, 0, update.stderr);

  for (const fileName of ["AGENTS.md", "CLAUDE.md"]) {
    const content = fs.readFileSync(
      path.join(taskRepository, fileName),
      "utf8"
    );
    assert.equal(occurrences(content, "<workflow-dev>"), 1);
    assert.equal(
      occurrences(content, "<ailovecode-workflow>"),
      1
    );
    assert.ok(content.includes(implementationRepository));
  }
});

test("invalid targets fail before instruction files are changed", (t) => {
  const taskRepository = makeGitRepository(
    t,
    "ailovecode task repo "
  );
  const nonGitTarget = makeDirectory(
    t,
    "ailovecode non git target "
  );
  initWorkflow(taskRepository, "# Preserve this\n");

  const before = new Map(
    ["AGENTS.md", "CLAUDE.md"].map((fileName) => [
      fileName,
      fs.readFileSync(path.join(taskRepository, fileName), "utf8"),
    ])
  );
  const missingPath = path.join(
    taskRepository,
    "missing implementation"
  );
  const cases = [
    {
      argument: missingPath,
      message: /Implementation repository not found/,
    },
    {
      argument: nonGitTarget,
      message: /not a Git worktree/,
    },
    {
      argument: taskRepository,
      message: /must be different/,
    },
  ];

  for (const invalidCase of cases) {
    const result = run(
      process.execPath,
      [cli, "configure-dev", invalidCase.argument],
      taskRepository
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, invalidCase.message);

    for (const [fileName, content] of before) {
      assert.equal(
        fs.readFileSync(
          path.join(taskRepository, fileName),
          "utf8"
        ),
        content
      );
    }
  }
});

test("configure-dev requires an installed workflow and argument", (t) => {
  const taskRepository = makeGitRepository(
    t,
    "ailovecode task repo "
  );
  const implementationRepository = makeGitRepository(
    t,
    "ailovecode implementation repo "
  );

  const noArgument = run(
    process.execPath,
    [cli, "configure-dev"],
    taskRepository
  );
  assert.equal(noArgument.status, 1);
  assert.match(noArgument.stderr, /provide an implementation repository/);

  const noWorkflow = run(
    process.execPath,
    [cli, "configure-dev", implementationRepository],
    taskRepository
  );
  assert.equal(noWorkflow.status, 1);
  assert.match(noWorkflow.stderr, /workflow folder not found/);
});
