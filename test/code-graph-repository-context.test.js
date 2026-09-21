const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const cli = path.resolve(__dirname, "..", "bin", "ailovecode-workflow.js");
const { resolveCodeGraphTarget } = require("../lib/code-graph/repository-context");
const { persistAcceptedGraph } = require("../lib/code-graph/storage");
const { startGraphCommand } = require("../lib/code-graph/server");

const fixturePath = path.join(
  __dirname,
  "fixtures",
  "code-graph-sample",
  ".ailovecode",
  "code-graph",
  "graph.json"
);

function run(executable, args, cwd) {
  return spawnSync(executable, args, { cwd, encoding: "utf8", windowsHide: true });
}

function makeRepository(t, prefix) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  assert.equal(run("git", ["init", "-q"], directory).status, 0);
  return directory;
}

test("resolves the current Git worktree in same-repository mode", (t) => {
  const repository = makeRepository(t, "ailovecode-graph-same-");
  const context = resolveCodeGraphTarget(repository);
  assert.equal(context.mode, "same-repository");
  assert.equal(context.projectRoot, repository);
});

test("reuses configure-dev output to resolve the implementation worktree", (t) => {
  const workflow = makeRepository(t, "ailovecode-graph-workflow-");
  const implementation = makeRepository(t, "ailovecode-graph-implementation-");

  assert.equal(run(process.execPath, [cli, "init"], workflow).status, 0);
  const configured = run(process.execPath, [cli, "configure-dev", implementation], workflow);
  assert.equal(configured.status, 0, configured.stderr);

  const context = resolveCodeGraphTarget(workflow);
  assert.equal(context.mode, "split-repository");
  assert.equal(context.projectRoot, implementation);
  assert.equal(context.workflowTaskRepository, workflow);
});

test("graph loads the implementation graph instead of a workflow-repository decoy", async (t) => {
  const workflow = makeRepository(t, "ailovecode-graph-decoy-workflow-");
  const implementation = makeRepository(t, "ailovecode-graph-decoy-implementation-");
  assert.equal(run(process.execPath, [cli, "init"], workflow).status, 0);
  assert.equal(run(process.execPath, [cli, "configure-dev", implementation], workflow).status, 0);

  const implementationGraph = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  implementationGraph.project.name = "implementation-graph";
  persistAcceptedGraph(implementation, implementationGraph);

  const decoyGraph = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  decoyGraph.project.name = "workflow-decoy";
  persistAcceptedGraph(workflow, decoyGraph);

  const started = startGraphCommand({ cwd: workflow, args: ["--port", "0"], output: () => {} });
  await new Promise((resolve) => started.server.once("listening", resolve));
  t.after(() => started.server.close());

  assert.equal(started.context.mode, "split-repository");
  assert.equal(started.context.projectRoot, implementation);
  assert.equal(started.graph.project.name, "implementation-graph");
  assert.match(started.paths.graph, /decoy-implementation-/);
});

test("rejects conflicting managed configuration instead of falling back", (t) => {
  const workflow = makeRepository(t, "ailovecode-graph-conflict-workflow-");
  const first = makeRepository(t, "ailovecode-graph-conflict-first-");
  const second = makeRepository(t, "ailovecode-graph-conflict-second-");
  assert.equal(run(process.execPath, [cli, "init"], workflow).status, 0);
  assert.equal(run(process.execPath, [cli, "configure-dev", first], workflow).status, 0);

  const agents = fs.readFileSync(path.join(workflow, "AGENTS.md"), "utf8");
  fs.writeFileSync(path.join(workflow, "CLAUDE.md"), agents.replaceAll(first, second), "utf8");
  assert.throws(() => resolveCodeGraphTarget(workflow), /Conflicting/);
});

test("rejects an unavailable configured implementation repository", (t) => {
  const workflow = makeRepository(t, "ailovecode-graph-missing-workflow-");
  const implementation = makeRepository(t, "ailovecode-graph-missing-implementation-");
  assert.equal(run(process.execPath, [cli, "init"], workflow).status, 0);
  assert.equal(run(process.execPath, [cli, "configure-dev", implementation], workflow).status, 0);
  fs.rmSync(implementation, { recursive: true, force: true });
  assert.throws(() => resolveCodeGraphTarget(workflow), /not found/);
});
