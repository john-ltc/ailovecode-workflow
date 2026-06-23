import fs from "fs";
import path from "path";
import { getTargetRoot, getTargetWorkflowPath } from "../workflow/paths";
import { createWorkflowTask } from "../workflow/tasks";

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

  try {
    const createdTask = createWorkflowTask(targetWorkflow, { taskName });

    console.log("Task created:");
    console.log(path.relative(targetRoot, createdTask.taskPath));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unable to create task.");
    process.exit(1);
  }
}
