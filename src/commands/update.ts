import fs from "fs";
import { copyDir, updateInstructionFiles } from "../workflow/file-operations";
import { getSourceWorkflowPath, getTargetWorkflowPath } from "../workflow/paths";

export function update(): void {
  const targetWorkflow = getTargetWorkflowPath();

  if (!fs.existsSync(targetWorkflow)) {
    console.error("workflow folder not found.");
    console.error("Run this first: npx ailovecode-workflow init");
    process.exit(1);
  }

  copyDir(getSourceWorkflowPath(), targetWorkflow);

  updateInstructionFiles();

  console.log("AILoveCode Workflow updated.");
  console.log("");
  console.log("Updated:");
  console.log("- workflow/guidelines.md");
  console.log("- workflow/README.md");
  console.log("- AGENTS.md");
  console.log("- CLAUDE.md");
  console.log("");
  console.log("Preserved:");
  console.log("- workflow/tasks/");
}
