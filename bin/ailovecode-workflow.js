#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const command = process.argv[2];

const packageRoot = path.resolve(__dirname, "..");
const targetRoot = process.cwd();

const sourceWorkflow = path.join(packageRoot, "workflow");
const targetWorkflow = path.join(targetRoot, "workflow");

const taskTemplate = `## Context


## Request


## Reference
`;

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;

  fs.mkdirSync(dest, { recursive: true });

  for (const item of fs.readdirSync(src)) {
    if (item === "tasks") continue;
    if (item === "workflow-tag.md") continue;

    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function ensureWorkflowTag(fileName) {
  const filePath = path.join(targetRoot, fileName);

  const tagPath = path.join(
    sourceWorkflow,
    "workflow-tag.md"
  );

  if (!fs.existsSync(tagPath)) {
    return;
  }

  const tagContent = fs.readFileSync(tagPath, "utf8").trim();

  const startTag = "<ailovecode-workflow>";
  const endTag = "</ailovecode-workflow>";

  let content = "";

  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf8");
  }

  const regex = new RegExp(
    `${startTag}[\\s\\S]*?${endTag}`,
    "m"
  );

  if (regex.test(content)) {
    content = content.replace(regex, tagContent);
  } else {
    content =
      content.trimEnd() +
      (content.trim() ? "\n\n" : "") +
      tagContent +
      "\n";
  }

  fs.writeFileSync(filePath, content, "utf8");
}

function updateInstructionFiles() {
  ensureWorkflowTag("AGENTS.md");
  ensureWorkflowTag("CLAUDE.md");
}

function ensureWorkflowDirectories() {
  fs.mkdirSync(
    path.join(targetWorkflow, "tasks"),
    { recursive: true }
  );
  fs.mkdirSync(
    path.join(targetWorkflow, "reviews"),
    { recursive: true }
  );
}

function init() {
  if (fs.existsSync(targetWorkflow)) {
    console.log(
      "Workflow already installed."
    );
    console.log(
      "Use: npx ailovecode-workflow update"
    );

    updateInstructionFiles();

    return;
  }

  copyDir(sourceWorkflow, targetWorkflow);

  ensureWorkflowDirectories();

  updateInstructionFiles();

  console.log(
    "AILoveCode Workflow installed."
  );

  console.log("");
  console.log("Created:");
  console.log("- workflow/");
  console.log("- workflow/tasks/");
  console.log("- workflow/reviews/");
  console.log("- AGENTS.md");
  console.log("- CLAUDE.md");
}

function update() {
  if (!fs.existsSync(targetWorkflow)) {
    console.error(
      "workflow folder not found."
    );
    console.error(
      "Run this first: npx ailovecode-workflow init"
    );
    process.exit(1);
  }

  copyDir(
    sourceWorkflow,
    targetWorkflow
  );

  ensureWorkflowDirectories();

  updateInstructionFiles();

  console.log(
    "AILoveCode Workflow updated."
  );

  console.log("");
  console.log("Updated:");
  console.log(
    "- workflow/guidelines.md"
  );
  console.log(
    "- workflow/README.md"
  );
  console.log("- AGENTS.md");
  console.log("- CLAUDE.md");

  console.log("");
  console.log("Preserved:");
  console.log(
    "- workflow/tasks/"
  );
  console.log(
    "- workflow/reviews/"
  );
}

function toKebabCase(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function timestamp() {
  const now = new Date();

  const pad = (n) =>
    String(n).padStart(2, "0");

  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    "T" +
    pad(now.getHours()) +
    pad(now.getMinutes())
  );
}

function createTask() {
  const taskName =
    process.argv.slice(3).join(" ");

  if (!taskName) {
    console.error(
      'Please provide a task name.'
    );

    console.error(
      'Example: npx ailovecode-workflow create-task "add login page"'
    );

    process.exit(1);
  }

  if (!fs.existsSync(targetWorkflow)) {
    console.error(
      "workflow folder not found."
    );

    console.error(
      "Run this first: npx ailovecode-workflow init"
    );

    process.exit(1);
  }

  const folderName =
    `${timestamp()}_${toKebabCase(taskName)}`;

  const taskPath = path.join(
    targetWorkflow,
    "tasks",
    folderName
  );

  fs.mkdirSync(
    path.join(
      taskPath,
      "supporting-materials"
    ),
    {
      recursive: true,
    }
  );

  fs.writeFileSync(
    path.join(taskPath, "task.md"),
    taskTemplate,
    "utf8"
  );

  fs.writeFileSync(
    path.join(
      taskPath,
      "implementation-plan.md"
    ),
    "",
    "utf8"
  );

  console.log("Task created:");
  console.log(
    path.relative(targetRoot, taskPath)
  );
}

function git(args) {
  return spawnSync("git", args, {
    cwd: targetRoot,
    encoding: "utf8",
    maxBuffer: 100 * 1024 * 1024,
    windowsHide: true,
  });
}

function gitOutput(args, errorMessage) {
  const result = git(args);

  if (result.error || result.status !== 0) {
    const detail = result.error
      ? result.error.message
      : (result.stderr || result.stdout || "").trim();

    console.error(errorMessage);

    if (detail) {
      console.error(detail);
    }

    process.exit(1);
  }

  return result.stdout.trimEnd();
}

function refExists(ref) {
  const result = git([
    "rev-parse",
    "--verify",
    "--quiet",
    `${ref}^{commit}`,
  ]);

  return !result.error && result.status === 0;
}

function detectBase() {
  const remoteDefault = git([
    "symbolic-ref",
    "--quiet",
    "--short",
    "refs/remotes/origin/HEAD",
  ]);

  if (remoteDefault.status === 0) {
    const ref = remoteDefault.stdout.trim();

    if (ref && refExists(ref)) {
      return ref;
    }
  }

  for (const ref of [
    "main",
    "origin/main",
    "master",
    "origin/master",
  ]) {
    if (refExists(ref)) {
      return ref;
    }
  }

  console.error(
    "Unable to detect a base branch."
  );
  console.error(
    "Provide one explicitly: npx ailovecode-workflow review-context <base>"
  );
  process.exit(1);
}

function taskDocument(pathName) {
  const normalized = pathName.replace(/\\/g, "/");
  const match = normalized.match(
    /^workflow\/tasks\/([^/]+)\/(task\.md|implementation-plan\.md)$/
  );

  if (!match) {
    return null;
  }

  return {
    directory: `workflow/tasks/${match[1]}`,
    fileName: match[2],
  };
}

function changedTaskDirectories(nameStatus) {
  const directories = new Set();

  for (const line of nameStatus.split(/\r?\n/)) {
    if (!line) continue;

    const fields = line.split("\t");

    for (const pathName of fields.slice(1)) {
      const document = taskDocument(pathName);

      if (document) {
        directories.add(document.directory);
      }
    }
  }

  return [...directories].sort();
}

function markdownDocument(taskDirectory, fileName) {
  const relativePath = `${taskDirectory}/${fileName}`;
  const document = git([
    "show",
    `HEAD:${relativePath}`,
  ]);

  if (document.error || document.status !== 0) {
    return `#### ${fileName}\n\nDocument is missing or deleted in the reviewed branch.`;
  }

  const content = document.stdout.trimEnd();

  return [
    `#### ${fileName}`,
    "",
    "~~~markdown",
    content,
    "~~~",
  ].join("\n");
}

function reviewContext() {
  const repositoryCheck = git([
    "rev-parse",
    "--is-inside-work-tree",
  ]);

  if (
    repositoryCheck.error ||
    repositoryCheck.status !== 0 ||
    repositoryCheck.stdout.trim() !== "true"
  ) {
    console.error(
      "review-context must be run inside a Git worktree."
    );
    process.exit(1);
  }

  const requestedBase = process.argv[3];
  const base = requestedBase || detectBase();

  if (base.startsWith("-") || !refExists(base)) {
    console.error(
      `Base ref not found: ${base}`
    );
    console.error(
      "Use an existing branch or ref, such as main or origin/main."
    );
    process.exit(1);
  }

  const mergeBase = gitOutput(
    ["merge-base", base, "HEAD"],
    `Unable to find a merge base between ${base} and HEAD.`
  );
  const currentBranchResult = git([
    "symbolic-ref",
    "--quiet",
    "--short",
    "HEAD",
  ]);
  const currentBranch = currentBranchResult.status === 0
    ? currentBranchResult.stdout.trim()
    : "HEAD (detached)";
  const headCommit = gitOutput(
    ["rev-parse", "HEAD"],
    "Unable to resolve HEAD."
  );
  const nameStatus = gitOutput(
    [
      "diff",
      "--name-status",
      "--find-renames",
      `${base}...HEAD`,
      "--",
      ".",
      ":(exclude)workflow/reviews/**",
    ],
    `Unable to collect changed files for ${base}...HEAD.`
  );
  const diff = gitOutput(
    [
      "diff",
      "--find-renames",
      "--no-ext-diff",
      `${base}...HEAD`,
      "--",
      ".",
      ":(exclude)workflow/reviews/**",
    ],
    `Unable to collect the diff for ${base}...HEAD.`
  );
  const taskDirectories = changedTaskDirectories(
    nameStatus
  );
  const reportSlug = currentBranchResult.status === 0
    ? toKebabCase(currentBranch) || `branch-${headCommit.slice(0, 12)}`
    : `detached-${headCommit.slice(0, 12)}`;
  const reportPath = `workflow/reviews/${reportSlug}.md`;
  const sections = [
    "# AI Love Code - Review Context",
    "",
    "## Repository",
    "",
    `- Base: \`${base}\``,
    `- Head branch: \`${currentBranch}\``,
    `- Head commit: \`${headCommit}\``,
    `- Merge base: \`${mergeBase}\``,
    `- Comparison: \`${base}...HEAD\``,
    `- Review report: \`${reportPath}\``,
    "",
    "## Changed Files",
    "",
    "~~~text",
    nameStatus || "No changed files.",
    "~~~",
    "",
    "## Discovered Tasks",
    "",
  ];

  if (taskDirectories.length === 0) {
    sections.push(
      "No changed task or implementation-plan documents were discovered. Use PR metadata, branch context, or user clarification to identify the task.",
      ""
    );
  } else {
    taskDirectories.forEach(
      (taskDirectory, index) => {
        sections.push(
          `### Task ${index + 1} - ${taskDirectory}`,
          "",
          markdownDocument(taskDirectory, "task.md"),
          "",
          markdownDocument(
            taskDirectory,
            "implementation-plan.md"
          ),
          ""
        );
      }
    );
  }

  sections.push(
    "## Branch Diff",
    "",
    "~~~diff",
    diff || "No branch diff.",
    "~~~"
  );

  console.log(sections.join("\n"));
}

function version() {
  const pkg = require(
    path.join(
      packageRoot,
      "package.json"
    )
  );

  console.log(
    `AILoveCode Workflow v${pkg.version}`
  );
}

function help() {
  console.log(`
AILoveCode Workflow

Usage:

  npx ailovecode-workflow init
  npx ailovecode-workflow update
  npx ailovecode-workflow create-task "task name"
  npx ailovecode-workflow review-context [base]
  npx ailovecode-workflow version

Aliases:

  npx ailovecode-workflow install
`);
}

switch (command) {
  case "init":
  case "install":
    init();
    break;

  case "update":
    update();
    break;

  case "create-task":
    createTask();
    break;

  case "review-context":
    reviewContext();
    break;

  case "version":
  case "--version":
  case "-v":
    version();
    break;

  case undefined:
  case "help":
  case "--help":
  case "-h":
    help();
    break;

  default:
    console.error(
      `Unknown command: ${command}`
    );

    help();

    process.exit(1);
}
