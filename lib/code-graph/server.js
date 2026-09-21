const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { loadAcceptedGraph } = require("./storage");
const { resolveCodeGraphTarget } = require("./repository-context");

const assetRoot = path.resolve(__dirname, "..", "..", "viewer");
const assets = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
]);

function createGraphServer(graph) {
  return http.createServer((request, response) => {
    const url = new URL(request.url, "http://localhost");
    if (request.method !== "GET") {
      response.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
      response.end("Method not allowed");
      return;
    }

    if (url.pathname === "/api/graph") {
      response.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(JSON.stringify(graph));
      return;
    }

    const asset = assets.get(url.pathname);
    if (!asset) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": asset[1],
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'",
    });
    response.end(fs.readFileSync(path.join(assetRoot, asset[0])));
  });
}

function graphArguments(argumentsList) {
  let port = 4173;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--port") {
      const value = argumentsList[index + 1];
      if (!/^\d+$/.test(value || "")) {
        throw new Error("graph --port requires an integer from 0 to 65535.");
      }
      port = Number(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown graph option: ${argument}`);
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("graph --port requires an integer from 0 to 65535.");
  }
  return { port };
}

function startGraphCommand(options = {}) {
  const args = options.args || process.argv.slice(3);
  const cwd = options.cwd || process.cwd();
  const output = options.output || console.log;
  const { port } = graphArguments(args);
  const context = resolveCodeGraphTarget(cwd);
  const { graph, paths } = loadAcceptedGraph(context.projectRoot);
  const server = createGraphServer(graph);

  server.on("error", (error) => {
    console.error(`Unable to start Code Graph server: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () => {
    const address = server.address();
    output("AILoveCode Code Graph");
    output("");
    output(`Target: ${context.projectRoot}`);
    output(`Graph: ${paths.graph}`);
    output(`Nodes: ${graph.nodes.length}`);
    output(`Edges: ${graph.edges.length}`);
    output(`Status: ${graph.analysis.status}`);
    output("");
    output(`Open: http://127.0.0.1:${address.port}`);
  });

  return { context, graph, paths, server };
}

module.exports = {
  createGraphServer,
  graphArguments,
  startGraphCommand,
};
