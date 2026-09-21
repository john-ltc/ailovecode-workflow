const path = require("node:path");

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function validRelativePath(value) {
  if (!isNonEmptyString(value) || value.includes("\0")) return false;
  if (path.posix.isAbsolute(value) || path.win32.isAbsolute(value)) return false;
  if (value.includes("\\")) return false;

  const segments = value.split("/");
  return !segments.some((segment) => !segment || segment === "." || segment === "..");
}

function validateLocation(value, label, errors) {
  if (!isObject(value)) {
    errors.push(`${label} must be an object.`);
    return;
  }
  if (!validRelativePath(value.file)) {
    errors.push(`${label}.file must be a normalized project-relative path.`);
  }
  if (!Number.isInteger(value.line_start) || value.line_start < 1) {
    errors.push(`${label}.line_start must be a positive integer.`);
  }
  if (value.line_end !== undefined) {
    if (!Number.isInteger(value.line_end) || value.line_end < 1) {
      errors.push(`${label}.line_end must be a positive integer.`);
    } else if (Number.isInteger(value.line_start) && value.line_end < value.line_start) {
      errors.push(`${label}.line_end must not precede line_start.`);
    }
  }
}

function validateGraph(graph) {
  const errors = [];

  if (!isObject(graph)) {
    return { valid: false, errors: ["Graph must be a JSON object."] };
  }

  if (graph.schema_version !== "1") {
    errors.push('schema_version must be "1".');
  }
  if (!isObject(graph.project) || !isNonEmptyString(graph.project.name)) {
    errors.push("project.name must be a non-empty string.");
  }
  if (!isNonEmptyString(graph.generated_at) || Number.isNaN(Date.parse(graph.generated_at))) {
    errors.push("generated_at must be a valid ISO 8601 timestamp.");
  }
  if (!isObject(graph.analysis)) {
    errors.push("analysis must be an object.");
  } else {
    if (!["complete", "partial"].includes(graph.analysis.status)) {
      errors.push('analysis.status must be "complete" or "partial".');
    }
    if (!Array.isArray(graph.analysis.warnings)) {
      errors.push("analysis.warnings must be an array.");
    } else {
      graph.analysis.warnings.forEach((warning, index) => {
        if (
          !isObject(warning) ||
          !isNonEmptyString(warning.code) ||
          !isNonEmptyString(warning.message)
        ) {
          errors.push(
            `analysis.warnings[${index}] must contain non-empty code and message strings.`
          );
        }
      });
    }
    if (
      graph.analysis.coverage_notes !== undefined &&
      (!Array.isArray(graph.analysis.coverage_notes) ||
        graph.analysis.coverage_notes.some((note) => !isNonEmptyString(note)))
    ) {
      errors.push("analysis.coverage_notes must be an array of non-empty strings.");
    }
  }

  if (!Array.isArray(graph.nodes)) errors.push("nodes must be an array.");
  if (!Array.isArray(graph.edges)) errors.push("edges must be an array.");

  const nodeIds = new Set();
  if (Array.isArray(graph.nodes)) {
    graph.nodes.forEach((node, index) => {
      const label = `nodes[${index}]`;
      if (!isObject(node)) {
        errors.push(`${label} must be an object.`);
        return;
      }
      for (const field of ["id", "type", "name"]) {
        if (!isNonEmptyString(node[field])) {
          errors.push(`${label}.${field} must be a non-empty string.`);
        }
      }
      if (isNonEmptyString(node.id)) {
        if (nodeIds.has(node.id)) errors.push(`Duplicate node id: ${node.id}.`);
        nodeIds.add(node.id);
      }
      if (node.metadata !== undefined && !isObject(node.metadata)) {
        errors.push(`${label}.metadata must be an object.`);
      }
      if (node.file !== undefined) {
        validateLocation(node, label, errors);
      } else if (node.line_start !== undefined || node.line_end !== undefined) {
        errors.push(`${label} requires file when line information is supplied.`);
      }
    });
  }

  const edgeIds = new Set();
  if (Array.isArray(graph.edges)) {
    graph.edges.forEach((edge, index) => {
      const label = `edges[${index}]`;
      if (!isObject(edge)) {
        errors.push(`${label} must be an object.`);
        return;
      }
      for (const field of ["id", "from", "to", "type"]) {
        if (!isNonEmptyString(edge[field])) {
          errors.push(`${label}.${field} must be a non-empty string.`);
        }
      }
      if (isNonEmptyString(edge.id)) {
        if (edgeIds.has(edge.id)) errors.push(`Duplicate edge id: ${edge.id}.`);
        edgeIds.add(edge.id);
      }
      if (isNonEmptyString(edge.from) && !nodeIds.has(edge.from)) {
        errors.push(`${label}.from references missing node: ${edge.from}.`);
      }
      if (isNonEmptyString(edge.to) && !nodeIds.has(edge.to)) {
        errors.push(`${label}.to references missing node: ${edge.to}.`);
      }
      if (
        edge.confidence !== undefined &&
        (typeof edge.confidence !== "number" ||
          !Number.isFinite(edge.confidence) ||
          edge.confidence < 0 ||
          edge.confidence > 1)
      ) {
        errors.push(`${label}.confidence must be a number between 0 and 1.`);
      }
      if (!Array.isArray(edge.evidence)) {
        errors.push(`${label}.evidence must be an array.`);
      } else {
        edge.evidence.forEach((item, evidenceIndex) => {
          validateLocation(item, `${label}.evidence[${evidenceIndex}]`, errors);
        });
      }
      if (edge.metadata !== undefined && !isObject(edge.metadata)) {
        errors.push(`${label}.metadata must be an object.`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

function parseAndValidateGraph(content) {
  let graph;
  try {
    graph = JSON.parse(content);
  } catch (error) {
    return { valid: false, errors: [`Invalid JSON: ${error.message}`], graph: null };
  }
  const result = validateGraph(graph);
  return { ...result, graph };
}

module.exports = {
  parseAndValidateGraph,
  validRelativePath,
  validateGraph,
};
