import fs from "fs";
import path from "path";
import { safeResolveWithin } from "./paths";
import { buildTaskMarkdown, parseTaskSections, TaskSections, updateTaskSections } from "./task-sections";

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
  requestPreview: string;
  hasTaskMarkdown: boolean;
  hasImplementationPlan: boolean;
  supportingMaterialCount: number;
}

export interface SupportingMaterial {
  name: string;
  relativePath: string;
  size: number;
}

export interface CreateTaskInput {
  taskName: string;
  sections?: TaskSections;
}

export interface CreatedTask {
  id: string;
  taskPath: string;
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

function normalizeTaskSections(sections?: TaskSections): TaskSections {
  return {
    Context: sections?.Context ?? "",
    Request: sections?.Request ?? "",
    Reference: sections?.Reference ?? "",
  };
}

export function createWorkflowTask(workflowPath: string, input: CreateTaskInput): CreatedTask {
  const taskName = input.taskName.trim();

  if (!taskName) {
    throw new Error("Please provide a task name.");
  }

  const slug = toKebabCase(taskName);

  if (!slug) {
    throw new Error("Task name must include at least one letter or number.");
  }

  const id = `${timestamp()}_${slug}`;
  const taskPath = path.join(getTasksPath(workflowPath), id);

  if (fs.existsSync(taskPath)) {
    throw new Error("Task already exists. Try again in a minute or choose a different name.");
  }

  fs.mkdirSync(path.join(taskPath, "supporting-materials"), {
    recursive: true,
  });

  fs.writeFileSync(path.join(taskPath, "task.md"), buildTaskMarkdown(normalizeTaskSections(input.sections)), "utf8");
  fs.writeFileSync(path.join(taskPath, "implementation-plan.md"), "", "utf8");

  return {
    id,
    taskPath,
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
      const taskPath = path.join(tasksPath, id);
      const taskMarkdown = readTextFileIfExists(path.join(taskPath, "task.md"));
      const implementationPlan = readTextFileIfExists(path.join(taskPath, "implementation-plan.md"));
      const sections = parseTaskSections(taskMarkdown);

      return {
        id,
        name,
        createdLabel,
        taskPath,
        requestPreview: extractTaskPreview(sections),
        hasTaskMarkdown: taskMarkdown.trim().length > 0,
        hasImplementationPlan: implementationPlan.trim().length > 0,
        supportingMaterialCount: countSupportingMaterialFiles(path.join(taskPath, "supporting-materials")),
      };
    })
    .sort((a, b) => b.id.localeCompare(a.id));
}

function extractTaskPreview(sections: TaskSections): string {
  return firstMeaningfulLine(sections.Request) || firstMeaningfulLine(sections.Context);
}

function firstMeaningfulLine(value: string): string {
  const line = value
    .split(/\r?\n/)
    .map((candidate) => candidate.trim())
    .find((candidate) => candidate.length > 0);

  if (!line) return "";

  return truncatePreview(stripMarkdownMarkers(line));
}

function stripMarkdownMarkers(value: string): string {
  return value
    .replace(/^[-*+]\s+/, "")
    .replace(/^#+\s+/, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .trim();
}

function truncatePreview(value: string): string {
  const maxLength = 160;

  if (value.length <= maxLength) return value;

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function countSupportingMaterialFiles(materialsPath: string): number {
  if (!fs.existsSync(materialsPath)) {
    return 0;
  }

  return fs.readdirSync(materialsPath, { withFileTypes: true }).reduce((count, entry) => {
    const entryPath = path.join(materialsPath, entry.name);

    if (entry.isDirectory()) {
      return count + countSupportingMaterialFiles(entryPath);
    }

    if (entry.isFile()) {
      return count + 1;
    }

    return count;
  }, 0);
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
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
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
