import fs from "fs";
import path from "path";
import { getSourceWorkflowPath, getTargetRoot, getTargetWorkflowPath } from "./paths";

export const taskTemplate = `## Context


## Request


## Reference
`;

export function copyDir(src: string, dest: string): void {
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

export function ensureWorkflowTag(fileName: string): void {
  const targetRoot = getTargetRoot();
  const filePath = path.join(targetRoot, fileName);
  const tagPath = path.join(getSourceWorkflowPath(), "workflow-tag.md");

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

  const regex = new RegExp(`${startTag}[\\s\\S]*?${endTag}`, "m");

  if (regex.test(content)) {
    content = content.replace(regex, tagContent);
  } else {
    content = content.trimEnd() + (content.trim() ? "\n\n" : "") + tagContent + "\n";
  }

  fs.writeFileSync(filePath, content, "utf8");
}

export function updateInstructionFiles(): void {
  ensureWorkflowTag("AGENTS.md");
  ensureWorkflowTag("CLAUDE.md");
}

export function getTargetWorkflow(): string {
  return getTargetWorkflowPath(getTargetRoot());
}
