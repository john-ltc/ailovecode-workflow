#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

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

  fs.mkdirSync(
    path.join(targetWorkflow, "tasks"),
    {
      recursive: true,
    }
  );

  updateInstructionFiles();

  console.log(
    "AILoveCode Workflow installed."
  );

  console.log("");
  console.log("Created:");
  console.log("- workflow/");
  console.log("- workflow/tasks/");
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