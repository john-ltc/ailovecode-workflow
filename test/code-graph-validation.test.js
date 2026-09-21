const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { parseAndValidateGraph, validateGraph } = require("../lib/code-graph/validation");
const { codeGraphPaths, loadAcceptedGraph, persistAcceptedGraph } = require("../lib/code-graph/storage");

const fixturePath = path.join(__dirname, "fixtures", "code-graph-sample", ".ailovecode", "code-graph", "graph.json");

function fixture() {
  return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

test("accepts the fixture and extensible node and edge types", () => {
  const graph = fixture();
  graph.nodes.push({ id: "custom:one", type: "future_custom_type", name: "Custom" });
  graph.edges.push({
    id: "edge:custom",
    from: "table:users",
    to: "custom:one",
    type: "FUTURE_RELATIONSHIP",
    evidence: [],
  });
  assert.deepEqual(validateGraph(graph), { valid: true, errors: [] });
});

test("reports malformed JSON without throwing", () => {
  const result = parseAndValidateGraph("{");
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /Invalid JSON/);
});

test("aggregates duplicate, dangling, path, line, confidence, and metadata errors", () => {
  const graph = fixture();
  graph.analysis.status = "done";
  graph.analysis.warnings = [{ code: "missing-message" }];
  graph.nodes[1].id = graph.nodes[0].id;
  graph.nodes[0].file = "../secret.env";
  graph.nodes[0].line_end = 1;
  graph.edges[0].to = "missing:node";
  graph.edges[0].confidence = 2;
  graph.edges[0].evidence[0].file = "C:\\secret.txt";

  const result = validateGraph(graph);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /analysis.status/);
  assert.match(result.errors.join("\n"), /Duplicate node id/);
  assert.match(result.errors.join("\n"), /project-relative/);
  assert.match(result.errors.join("\n"), /must not precede/);
  assert.match(result.errors.join("\n"), /missing node/);
  assert.match(result.errors.join("\n"), /between 0 and 1/);
});

test("persists a valid graph and preserves it when a later graph is invalid", (t) => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), "ailovecode-graph-storage-"));
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  const graph = fixture();
  const paths = persistAcceptedGraph(project, graph, { source: "test" });
  const before = fs.readFileSync(paths.graph, "utf8");

  const invalid = fixture();
  invalid.edges[0].to = "missing";
  assert.throws(() => persistAcceptedGraph(project, invalid), /validation failed/);
  assert.equal(fs.readFileSync(paths.graph, "utf8"), before);
  assert.equal(loadAcceptedGraph(project).graph.nodes.length, graph.nodes.length);
  assert.equal(codeGraphPaths(project).directory, path.join(project, ".ailovecode", "code-graph"));
});
