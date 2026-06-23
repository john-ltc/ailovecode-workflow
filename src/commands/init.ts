import fs from "fs";
import path from "path";
import { copyDir, updateInstructionFiles } from "../workflow/file-operations";
import { getSourceWorkflowPath, getTargetRoot, getTargetWorkflowPath } from "../workflow/paths";

export function init(): void {
  const targetRoot = getTargetRoot();
  const targetWorkflow = getTargetWorkflowPath(targetRoot);

  if (fs.existsSync(targetWorkflow)) {
    console.log("Workflow already installed.");
    console.log("Use: npx ailovecode-workflow update");

    updateInstructionFiles();

    return;
  }

  copyDir(getSourceWorkflowPath(), targetWorkflow);

  fs.mkdirSync(path.join(targetWorkflow, "tasks"), {
    recursive: true,
  });

  updateInstructionFiles();

  console.log("AILoveCode Workflow installed.");
  console.log("");
  console.log("Created:");
  console.log("- workflow/");
  console.log("- workflow/tasks/");
  console.log("- AGENTS.md");
  console.log("- CLAUDE.md");
}
