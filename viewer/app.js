(() => {
  const rootTypes = new Set(["api_endpoint", "job", "worker", "cli_command", "webhook", "event_listener"]);
  const state = { graph: null, visible: new Set(), selectedNode: null, selectedEdge: null };
  const svg = document.querySelector("#graph");
  const details = document.querySelector("#details");
  const search = document.querySelector("#search");
  const typeFilter = document.querySelector("#type-filter");

  function escapeText(value) {
    return String(value ?? "");
  }

  function roots() {
    const matches = state.graph.nodes.filter((node) => rootTypes.has(node.type));
    return matches.length ? matches : state.graph.nodes.slice(0, 25);
  }

  function related(nodeId) {
    const nodeMap = new Map(state.graph.nodes.map((node) => [node.id, node]));
    const result = [];
    state.graph.edges.forEach((edge) => {
      if (edge.from === nodeId) result.push({ direction: "outgoing", edge, node: nodeMap.get(edge.to) });
      if (edge.to === nodeId) result.push({ direction: "incoming", edge, node: nodeMap.get(edge.from) });
    });
    return result.filter((item) => item.node);
  }

  function reset() {
    state.visible = new Set(roots().map((node) => node.id));
    state.selectedNode = null;
    state.selectedEdge = null;
    render();
    showEmpty();
  }

  function expandSelected() {
    if (!state.selectedNode) return;
    related(state.selectedNode.id).forEach((item) => state.visible.add(item.node.id));
    render();
  }

  function collapseSelected() {
    if (!state.selectedNode) return;
    const rootIds = new Set(roots().map((node) => node.id));
    if (!rootIds.has(state.selectedNode.id)) state.visible.delete(state.selectedNode.id);
    state.selectedNode = null;
    render();
    showEmpty();
  }

  function point(index, count, width, height) {
    const columns = Math.max(1, Math.ceil(Math.sqrt(count * (width / Math.max(height, 1)))));
    const rows = Math.max(1, Math.ceil(count / columns));
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      x: ((column + 1) * width) / (columns + 1),
      y: ((row + 1) * height) / (rows + 1),
    };
  }

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function render() {
    const width = Math.max(svg.clientWidth, 480);
    const height = Math.max(svg.clientHeight, 320);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.replaceChildren();

    const defs = svgElement("defs");
    const marker = svgElement("marker", { id: "arrow", viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto-start-reverse" });
    marker.append(svgElement("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#60708d" }));
    defs.append(marker);
    svg.append(defs);

    const nodes = state.graph.nodes.filter((node) => state.visible.has(node.id));
    const positions = new Map(nodes.map((node, index) => [node.id, point(index, nodes.length, width, height)]));
    state.graph.edges.filter((edge) => positions.has(edge.from) && positions.has(edge.to)).forEach((edge) => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      const line = svgElement("line", { x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: `edge${state.selectedEdge?.id === edge.id ? " selected" : ""}` });
      line.addEventListener("click", () => selectEdge(edge));
      svg.append(line);
    });

    nodes.forEach((node) => {
      const position = positions.get(node.id);
      const group = svgElement("g", { class: `node${state.selectedNode?.id === node.id ? " selected" : ""}`, transform: `translate(${position.x} ${position.y})` });
      group.append(svgElement("circle", { r: "42" }));
      const name = svgElement("text", { y: "-2" });
      name.textContent = node.name.length > 18 ? `${node.name.slice(0, 16)}…` : node.name;
      const type = svgElement("text", { y: "16", class: "node-type" });
      type.textContent = node.type;
      group.append(name, type);
      group.addEventListener("click", () => selectNode(node));
      svg.append(group);
    });
    document.querySelector("#visible-count").textContent = `${nodes.length} visible`;
  }

  function locationText(item) {
    if (!item.file) return "Not supplied";
    return `${item.file}:${item.line_start}${item.line_end && item.line_end !== item.line_start ? `–${item.line_end}` : ""}`;
  }

  function field(label, value) {
    const labelElement = document.createElement("div");
    labelElement.className = "detail-label";
    labelElement.textContent = label;
    const valueElement = document.createElement("div");
    valueElement.className = "detail-value";
    valueElement.textContent = escapeText(value);
    details.append(labelElement, valueElement);
  }

  function selectNode(node) {
    state.selectedNode = node;
    state.selectedEdge = null;
    details.replaceChildren();
    const heading = document.createElement("h2");
    heading.textContent = node.name;
    details.append(heading);
    field("Type", node.type);
    field("ID", node.id);
    field("Source", locationText(node));
    const relationships = related(node.id);
    field("Outgoing", relationships.filter((item) => item.direction === "outgoing").length);
    field("Incoming", relationships.filter((item) => item.direction === "incoming").length);
    relationships.forEach((item) => {
      const card = document.createElement("div");
      card.className = "relationship";
      card.textContent = `${item.direction === "outgoing" ? "→" : "←"} ${item.edge.type} · ${item.node.name}`;
      card.addEventListener("click", () => selectEdge(item.edge));
      details.append(card);
    });
    document.querySelector("#expand").disabled = false;
    document.querySelector("#collapse").disabled = false;
    render();
  }

  function selectEdge(edge) {
    state.selectedEdge = edge;
    state.selectedNode = null;
    const nodeMap = new Map(state.graph.nodes.map((node) => [node.id, node]));
    details.replaceChildren();
    const heading = document.createElement("h2");
    heading.textContent = edge.type;
    details.append(heading);
    field("From", nodeMap.get(edge.from)?.name || edge.from);
    field("To", nodeMap.get(edge.to)?.name || edge.to);
    field("Confidence", edge.confidence ?? "Not supplied");
    field("Evidence", edge.evidence.length ? edge.evidence.map(locationText).join("\n") : "No source evidence supplied");
    document.querySelector("#expand").disabled = true;
    document.querySelector("#collapse").disabled = true;
    render();
  }

  function showEmpty() {
    details.className = "empty-state";
    details.textContent = "Select a node or relationship to inspect it.";
    document.querySelector("#expand").disabled = true;
    document.querySelector("#collapse").disabled = true;
  }

  function renderList() {
    const query = search.value.trim().toLowerCase();
    const type = typeFilter.value;
    const matches = state.graph.nodes.filter((node) =>
      (!type || node.type === type) &&
      (!query || node.name.toLowerCase().includes(query) || node.id.toLowerCase().includes(query))
    );
    const list = document.querySelector("#node-list");
    list.replaceChildren();
    matches.slice(0, 100).forEach((node) => {
      const button = document.createElement("button");
      button.textContent = node.name;
      const small = document.createElement("small");
      small.textContent = node.type;
      button.append(small);
      button.addEventListener("click", () => {
        state.visible.add(node.id);
        selectNode(node);
      });
      list.append(button);
    });
  }

  fetch("/api/graph").then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).then((graph) => {
    state.graph = graph;
    const types = [...new Set(graph.nodes.map((node) => node.type))].sort();
    types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      typeFilter.append(option);
    });
    const warningCount = graph.analysis.warnings.length;
    document.querySelector("#summary").textContent = `${graph.nodes.length} nodes · ${graph.edges.length} edges · ${graph.analysis.status}${warningCount ? ` · ${warningCount} warnings` : ""}`;
    reset();
    renderList();
  }).catch((error) => {
    details.textContent = `Unable to load graph: ${error.message}`;
  });

  search.addEventListener("input", renderList);
  typeFilter.addEventListener("change", renderList);
  document.querySelector("#reset").addEventListener("click", reset);
  document.querySelector("#expand").addEventListener("click", expandSelected);
  document.querySelector("#collapse").addEventListener("click", collapseSelected);
  window.addEventListener("resize", () => state.graph && render());
})();
