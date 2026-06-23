import fs from "fs";
import path from "path";

export function getPackageRoot(): string {
  return path.resolve(__dirname, "../..");
}

export function getTargetRoot(): string {
  return process.cwd();
}

export function getSourceWorkflowPath(): string {
  return path.join(getPackageRoot(), "workflow");
}

export function getTargetWorkflowPath(targetRoot = getTargetRoot()): string {
  return path.join(targetRoot, "workflow");
}

export function ensureWorkflowExists(targetRoot = getTargetRoot()): string {
  const workflowPath = getTargetWorkflowPath(targetRoot);

  if (!fs.existsSync(workflowPath)) {
    throw new WorkflowNotFoundError();
  }

  return workflowPath;
}

export class WorkflowNotFoundError extends Error {
  constructor() {
    super("workflow folder not found.\nRun this first: npx ailovecode-workflow init");
    this.name = "WorkflowNotFoundError";
  }
}

export function pathIsWithin(parentPath: string, childPath: string): boolean {
  const relative = path.relative(parentPath, childPath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function safeResolveWithin(parentPath: string, relativePath: string): string {
  if (!relativePath || path.isAbsolute(relativePath) || relativePath.includes("\0")) {
    throw new Error("Invalid path.");
  }

  const resolvedPath = path.resolve(parentPath, relativePath);

  if (!pathIsWithin(parentPath, resolvedPath)) {
    throw new Error("Invalid path.");
  }

  return resolvedPath;
}
