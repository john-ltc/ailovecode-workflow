import fs from "fs";
import path from "path";
import { taskTemplate } from "../workflow/file-operations";
import { getTargetRoot, getTargetWorkflowPath } from "../workflow/paths";

function toKebabCase(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function timestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    "T" +
    pad(now.getHours()) +
    pad(now.getMinutes())
  );
}

export function createTask(args: string[]): void {
  const taskName = args.join(" ");

  if (!taskName) {
    console.error("Please provide a task name.");
    console.error('Example: npx ailovecode-workflow create-task "add login page"');
    process.exit(1);
  }

  const targetRoot = getTargetRoot();
  const targetWorkflow = getTargetWorkflowPath(targetRoot);

  if (!fs.existsSync(targetWorkflow)) {
    console.error("workflow folder not found.");
    console.error("Run this first: npx ailovecode-workflow init");
    process.exit(1);
  }

  const folderName = `${timestamp()}_${toKebabCase(taskName)}`;
  const taskPath = path.join(targetWorkflow, "tasks", folderName);

  fs.mkdirSync(path.join(taskPath, "supporting-materials"), {
    recursive: true,
  });

  fs.writeFileSync(path.join(taskPath, "task.md"), taskTemplate, "utf8");
  fs.writeFileSync(path.join(taskPath, "implementation-plan.md"), "", "utf8");

  console.log("Task created:");
  console.log(path.relative(targetRoot, taskPath));
}
