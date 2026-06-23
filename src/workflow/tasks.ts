import fs from "fs";
import path from "path";
import { safeResolveWithin } from "./paths";
import { parseTaskSections, TaskSections, updateTaskSections } from "./task-sections";

export interface WorkflowInfo {
  workflowPath: string;
  tasksPath: string;
  taskCount: number;
}

export interface TaskSummary {
  id: string;
  name: string;
  createdLabel: string;
  taskPath: string;
}

export interface SupportingMaterial {
  name: string;
  relativePath: string;
  size: number;
}

const taskIdPattern = /^\d{8}T\d{4}_[a-z0-9][a-z0-9-]*$/;

export function isValidTaskId(taskId: string): boolean {
  return taskIdPattern.test(taskId);
}

export function assertValidTaskId(taskId: string): void {
  if (!isValidTaskId(taskId)) {
    throw new Error("Invalid task ID.");
  }
}

export function getTasksPath(workflowPath: string): string {
  return path.join(workflowPath, "tasks");
}

export function getWorkflowInfo(workflowPath: string): WorkflowInfo {
  const tasks = listTasks(workflowPath);

  return {
    workflowPath,
    tasksPath: getTasksPath(workflowPath),
    taskCount: tasks.length,
  };
}

export function listTasks(workflowPath: string): TaskSummary[] {
  const tasksPath = getTasksPath(workflowPath);

  if (!fs.existsSync(tasksPath)) {
    return [];
  }

  return fs
    .readdirSync(tasksPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => isValidTaskId(entry.name))
    .map((entry) => {
      const id = entry.name;
      const name = id.replace(/^\d{8}T\d{4}_/, "").replace(/-/g, " ");
      const createdLabel = formatTaskTimestamp(id.slice(0, 13));

      return {
        id,
        name,
        createdLabel,
        taskPath: path.join(tasksPath, id),
      };
    })
    .sort((a, b) => b.id.localeCompare(a.id));
}

function formatTaskTimestamp(timestamp: string): string {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})$/.exec(timestamp);

  if (!match) return timestamp;

  const [, year, month, day, hour, minute] = match;
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function getTaskPath(workflowPath: string, taskId: string): string {
  assertValidTaskId(taskId);

  const taskPath = path.join(getTasksPath(workflowPath), taskId);

  if (!fs.existsSync(taskPath) || !fs.statSync(taskPath).isDirectory()) {
    throw new Error("Task not found.");
  }

  return taskPath;
}

export function readTextFileIfExists(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  return fs.readFileSync(filePath, "utf8");
}

export function readTaskMarkdown(workflowPath: string, taskId: string): string {
  return readTextFileIfExists(path.join(getTaskPath(workflowPath, taskId), "task.md"));
}

export function readTaskSections(workflowPath: string, taskId: string): TaskSections {
  return parseTaskSections(readTaskMarkdown(workflowPath, taskId));
}

export function saveTaskSections(workflowPath: string, taskId: string, sections: TaskSections): void {
  const taskPath = getTaskPath(workflowPath, taskId);
  const taskMarkdownPath = path.join(taskPath, "task.md");
  const currentContent = readTextFileIfExists(taskMarkdownPath);
  const updatedContent = updateTaskSections(currentContent, sections);

  fs.writeFileSync(taskMarkdownPath, updatedContent, "utf8");
}

export function readImplementationPlan(workflowPath: string, taskId: string): string {
  return readTextFileIfExists(path.join(getTaskPath(workflowPath, taskId), "implementation-plan.md"));
}

export function readGuidelines(workflowPath: string): string {
  return readTextFileIfExists(path.join(workflowPath, "guidelines.md"));
}

export function listSupportingMaterials(workflowPath: string, taskId: string): SupportingMaterial[] {
  const materialsPath = path.join(getTaskPath(workflowPath, taskId), "supporting-materials");

  if (!fs.existsSync(materialsPath)) {
    return [];
  }

  const materials: SupportingMaterial[] = [];
  collectSupportingMaterials(materialsPath, materialsPath, materials);

  return materials.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function collectSupportingMaterials(rootPath: string, currentPath: string, materials: SupportingMaterial[]): void {
  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    const entryPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      collectSupportingMaterials(rootPath, entryPath, materials);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const relativePath = path.relative(rootPath, entryPath).split(path.sep).join("/");
    const stat = fs.statSync(entryPath);

    materials.push({
      name: entry.name,
      relativePath,
      size: stat.size,
    });
  }
}

export function resolveSupportingMaterialPath(
  workflowPath: string,
  taskId: string,
  materialRelativePath: string,
): string {
  const materialsPath = path.join(getTaskPath(workflowPath, taskId), "supporting-materials");
  const materialPath = safeResolveWithin(materialsPath, materialRelativePath);

  if (!fs.existsSync(materialPath) || !fs.statSync(materialPath).isFile()) {
    throw new Error("Supporting material not found.");
  }

  return materialPath;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${kilobytes.toFixed(1)} KB`;

  const megabytes = kilobytes / 1024;
  return `${megabytes.toFixed(1)} MB`;
}
