const ROOT_TYPES = new Set([
  "api_endpoint",
  "job",
  "worker",
  "cli_command",
  "webhook",
  "event_listener",
]);

function rootNodes(graph) {
  const roots = graph.nodes.filter((node) => ROOT_TYPES.has(node.type));
  return roots.length ? roots : graph.nodes.slice(0, 25);
}

function neighbors(graph, nodeId, direction = "both") {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const related = [];

  for (const edge of graph.edges) {
    if ((direction === "outgoing" || direction === "both") && edge.from === nodeId) {
      related.push({ direction: "outgoing", edge, node: nodeById.get(edge.to) });
    }
    if ((direction === "incoming" || direction === "both") && edge.to === nodeId) {
      related.push({ direction: "incoming", edge, node: nodeById.get(edge.from) });
    }
  }

  return related.filter((item) => item.node);
}

function filterNodes(graph, query = "", type = "") {
  const normalized = query.trim().toLowerCase();
  return graph.nodes.filter((node) => {
    const matchesType = !type || node.type === type;
    const matchesQuery =
      !normalized ||
      node.name.toLowerCase().includes(normalized) ||
      node.id.toLowerCase().includes(normalized);
    return matchesType && matchesQuery;
  });
}

module.exports = { filterNodes, neighbors, rootNodes };
