const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const { createGraphServer, graphArguments } = require("../lib/code-graph/server");
const { filterNodes, neighbors, rootNodes } = require("../lib/code-graph/viewer-model");

const graph = JSON.parse(fs.readFileSync(
  path.join(__dirname, "fixtures", "code-graph-sample", ".ailovecode", "code-graph", "graph.json"),
  "utf8"
));

function request(port, requestPath, method = "GET") {
  return new Promise((resolve, reject) => {
    const call = http.request({ host: "127.0.0.1", port, path: requestPath, method }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => resolve({ status: response.statusCode, headers: response.headers, body }));
    });
    call.on("error", reject);
    call.end();
  });
}

test("selects roots and traverses relationships in both directions", () => {
  assert.deepEqual(rootNodes(graph).map((node) => node.id), ["api:post-users"]);
  const forward = neighbors(graph, "api:post-users", "outgoing");
  assert.equal(forward[0].node.id, "function:user-controller.create");
  const reverse = neighbors(graph, "table:users", "incoming");
  assert.equal(reverse[0].node.id, "repository:user.insert");
});

test("filters nodes by name, id, and open type", () => {
  assert.equal(filterNodes(graph, "UserService").length, 1);
  assert.equal(filterNodes(graph, "post-users").length, 1);
  assert.equal(filterNodes(graph, "", "db_table")[0].id, "table:users");
});

test("parses graph port options", () => {
  assert.deepEqual(graphArguments([]), { port: 4173 });
  assert.deepEqual(graphArguments(["--port", "0"]), { port: 0 });
  assert.throws(() => graphArguments(["--unknown"]), /Unknown/);
  assert.throws(() => graphArguments(["--port", "70000"]), /0 to 65535/);
});

test("serves local viewer assets and graph data without arbitrary files", async (t) => {
  const server = createGraphServer(graph);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const port = server.address().port;

  const index = await request(port, "/");
  assert.equal(index.status, 200);
  assert.match(index.body, /AILoveCode Code Graph/);
  assert.match(index.headers["content-security-policy"], /default-src/);

  const data = await request(port, "/api/graph");
  assert.equal(data.status, 200);
  assert.equal(JSON.parse(data.body).nodes.length, graph.nodes.length);

  assert.equal((await request(port, "/../../package.json")).status, 404);
  assert.equal((await request(port, "/api/graph", "POST")).status, 405);
});
