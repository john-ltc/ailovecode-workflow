const fs = require("node:fs");
const path = require("node:path");
const { parseAndValidateGraph, validateGraph } = require("./validation");

function codeGraphPaths(projectRoot) {
  const directory = path.join(projectRoot, ".ailovecode", "code-graph");
  return {
    directory,
    graph: path.join(directory, "graph.json"),
    metadata: path.join(directory, "metadata.json"),
    candidate: path.join(directory, "candidate.json"),
    request: path.join(directory, "analysis-request.md"),
    inventory: path.join(directory, "inventory.json"),
  };
}

function loadAcceptedGraph(projectRoot) {
  const paths = codeGraphPaths(projectRoot);
  if (!fs.existsSync(paths.graph)) {
    throw new Error(`Code Graph not found: ${paths.graph}`);
  }
  const result = parseAndValidateGraph(fs.readFileSync(paths.graph, "utf8"));
  if (!result.valid) {
    throw new Error(
      `Code Graph validation failed:\n${result.errors.map((item) => `- ${item}`).join("\n")}`
    );
  }
  return { graph: result.graph, paths };
}

function temporaryPath(filePath) {
  return `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function persistAcceptedGraph(projectRoot, graph, metadata = {}) {
  const validation = validateGraph(graph);
  if (!validation.valid) {
    throw new Error(
      `Code Graph validation failed:\n${validation.errors.map((item) => `- ${item}`).join("\n")}`
    );
  }

  const paths = codeGraphPaths(projectRoot);
  fs.mkdirSync(paths.directory, { recursive: true });

  const graphTemp = temporaryPath(paths.graph);
  const metadataTemp = temporaryPath(paths.metadata);
  const graphBackup = temporaryPath(`${paths.graph}.backup`);
  const metadataBackup = temporaryPath(`${paths.metadata}.backup`);
  const hadGraph = fs.existsSync(paths.graph);
  const hadMetadata = fs.existsSync(paths.metadata);

  fs.writeFileSync(graphTemp, `${JSON.stringify(graph, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    metadataTemp,
    `${JSON.stringify({
      schema_version: graph.schema_version,
      accepted_at: new Date().toISOString(),
      analysis_status: graph.analysis.status,
      warnings: graph.analysis.warnings,
      node_count: graph.nodes.length,
      edge_count: graph.edges.length,
      ...metadata,
    }, null, 2)}\n`,
    "utf8"
  );

  try {
    if (hadGraph) fs.renameSync(paths.graph, graphBackup);
    if (hadMetadata) fs.renameSync(paths.metadata, metadataBackup);
    fs.renameSync(metadataTemp, paths.metadata);
    fs.renameSync(graphTemp, paths.graph);
    if (hadGraph) fs.rmSync(graphBackup);
    if (hadMetadata) fs.rmSync(metadataBackup);
  } catch (error) {
    for (const target of [paths.graph, paths.metadata]) {
      if (fs.existsSync(target)) fs.rmSync(target);
    }
    if (hadGraph && fs.existsSync(graphBackup)) fs.renameSync(graphBackup, paths.graph);
    if (hadMetadata && fs.existsSync(metadataBackup)) {
      fs.renameSync(metadataBackup, paths.metadata);
    }
    throw error;
  } finally {
    for (const temporary of [graphTemp, metadataTemp, graphBackup, metadataBackup]) {
      if (fs.existsSync(temporary)) fs.rmSync(temporary);
    }
  }

  return paths;
}

module.exports = {
  codeGraphPaths,
  loadAcceptedGraph,
  persistAcceptedGraph,
};
