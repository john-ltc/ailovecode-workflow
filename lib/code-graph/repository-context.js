const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function normalizePath(value) {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function samePath(first, second) {
  return normalizePath(first) === normalizePath(second);
}

function gitTopLevel(directory) {
  const result = spawnSync(
    "git",
    ["-C", directory, "rev-parse", "--show-toplevel"],
    { encoding: "utf8", windowsHide: true }
  );

  if (result.error || result.status !== 0) return null;
  return path.resolve(result.stdout.trim());
}

function managedBlocks(content) {
  return [...content.matchAll(/<workflow-dev>([\s\S]*?)<\/workflow-dev>/g)]
    .map((match) => match[1]);
}

function configuredPaths(block, fileName) {
  const implementation = block.match(
    /Implementation repository:\s*\r?\n\s*`([^`\r\n]+)`/
  );
  const workflow = block.match(
    /Workflow task repository:\s*\r?\n\s*`([^`\r\n]+)`/
  );

  if (!implementation || !workflow) {
    throw new Error(
      `Invalid <workflow-dev> configuration in ${fileName}. ` +
      "Run configure-dev again to repair it."
    );
  }

  return {
    implementationRepository: path.resolve(implementation[1]),
    workflowTaskRepository: path.resolve(workflow[1]),
  };
}

function readConfigurations(repositoryRoot) {
  const configurations = [];

  for (const fileName of ["AGENTS.md", "CLAUDE.md"]) {
    const filePath = path.join(repositoryRoot, fileName);
    if (!fs.existsSync(filePath)) continue;

    const blocks = managedBlocks(fs.readFileSync(filePath, "utf8"));
    if (blocks.length > 1) {
      throw new Error(
        `Multiple <workflow-dev> configurations found in ${fileName}.`
      );
    }
    if (blocks.length === 1) {
      configurations.push({
        fileName,
        ...configuredPaths(blocks[0], fileName),
      });
    }
  }

  return configurations;
}

function resolveCodeGraphTarget(startDirectory = process.cwd()) {
  const invocationRoot = gitTopLevel(startDirectory);
  if (!invocationRoot) {
    throw new Error("Code Graph commands must be run inside a Git worktree.");
  }

  const configurations = readConfigurations(invocationRoot);
  if (!configurations.length) {
    return {
      mode: "same-repository",
      invocationRoot,
      projectRoot: invocationRoot,
      configurationFiles: [],
    };
  }

  const first = configurations[0];
  for (const configuration of configurations.slice(1)) {
    if (
      !samePath(first.implementationRepository, configuration.implementationRepository) ||
      !samePath(first.workflowTaskRepository, configuration.workflowTaskRepository)
    ) {
      throw new Error(
        "Conflicting <workflow-dev> configurations found in AGENTS.md and CLAUDE.md."
      );
    }
  }

  if (!samePath(first.workflowTaskRepository, invocationRoot)) {
    throw new Error(
      "The configured workflow task repository does not match the current Git worktree."
    );
  }

  if (
    !fs.existsSync(first.implementationRepository) ||
    !fs.statSync(first.implementationRepository).isDirectory()
  ) {
    throw new Error(
      `Configured implementation repository not found: ${first.implementationRepository}`
    );
  }

  const implementationRoot = gitTopLevel(first.implementationRepository);
  if (!implementationRoot || !samePath(implementationRoot, first.implementationRepository)) {
    throw new Error(
      "The configured implementation repository is not the root of a Git worktree: " +
      first.implementationRepository
    );
  }

  if (samePath(implementationRoot, invocationRoot)) {
    throw new Error(
      "Split-repository configuration must reference a different implementation worktree."
    );
  }

  return {
    mode: "split-repository",
    invocationRoot,
    projectRoot: implementationRoot,
    workflowTaskRepository: invocationRoot,
    implementationRepository: implementationRoot,
    configurationFiles: configurations.map((item) => item.fileName),
  };
}

module.exports = {
  gitTopLevel,
  readConfigurations,
  resolveCodeGraphTarget,
  samePath,
};
