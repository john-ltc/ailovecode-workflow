"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidTaskId = isValidTaskId;
exports.assertValidTaskId = assertValidTaskId;
exports.getTasksPath = getTasksPath;
exports.getWorkflowInfo = getWorkflowInfo;
exports.listTasks = listTasks;
exports.getTaskPath = getTaskPath;
exports.readTextFileIfExists = readTextFileIfExists;
exports.readTaskMarkdown = readTaskMarkdown;
exports.readTaskSections = readTaskSections;
exports.saveTaskSections = saveTaskSections;
exports.readImplementationPlan = readImplementationPlan;
exports.readGuidelines = readGuidelines;
exports.listSupportingMaterials = listSupportingMaterials;
exports.resolveSupportingMaterialPath = resolveSupportingMaterialPath;
exports.formatBytes = formatBytes;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const paths_1 = require("./paths");
const task_sections_1 = require("./task-sections");
const taskIdPattern = /^\d{8}T\d{4}_[a-z0-9][a-z0-9-]*$/;
function isValidTaskId(taskId) {
    return taskIdPattern.test(taskId);
}
function assertValidTaskId(taskId) {
    if (!isValidTaskId(taskId)) {
        throw new Error("Invalid task ID.");
    }
}
function getTasksPath(workflowPath) {
    return path_1.default.join(workflowPath, "tasks");
}
function getWorkflowInfo(workflowPath) {
    const tasks = listTasks(workflowPath);
    return {
        workflowPath,
        tasksPath: getTasksPath(workflowPath),
        taskCount: tasks.length,
    };
}
function listTasks(workflowPath) {
    const tasksPath = getTasksPath(workflowPath);
    if (!fs_1.default.existsSync(tasksPath)) {
        return [];
    }
    return fs_1.default
        .readdirSync(tasksPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .filter((entry) => isValidTaskId(entry.name))
        .map((entry) => {
        const id = entry.name;
        const name = id.replace(/^\d{8}T\d{4}_/, "").replace(/-/g, " ");
        const createdLabel = formatTaskTimestamp(id.slice(0, 13));
        const taskPath = path_1.default.join(tasksPath, id);
        const taskMarkdown = readTextFileIfExists(path_1.default.join(taskPath, "task.md"));
        const implementationPlan = readTextFileIfExists(path_1.default.join(taskPath, "implementation-plan.md"));
        const sections = (0, task_sections_1.parseTaskSections)(taskMarkdown);
        return {
            id,
            name,
            createdLabel,
            taskPath,
            requestPreview: extractTaskPreview(sections),
            hasTaskMarkdown: taskMarkdown.trim().length > 0,
            hasImplementationPlan: implementationPlan.trim().length > 0,
            supportingMaterialCount: countSupportingMaterialFiles(path_1.default.join(taskPath, "supporting-materials")),
        };
    })
        .sort((a, b) => b.id.localeCompare(a.id));
}
function extractTaskPreview(sections) {
    return firstMeaningfulLine(sections.Request) || firstMeaningfulLine(sections.Context);
}
function firstMeaningfulLine(value) {
    const line = value
        .split(/\r?\n/)
        .map((candidate) => candidate.trim())
        .find((candidate) => candidate.length > 0);
    if (!line)
        return "";
    return truncatePreview(stripMarkdownMarkers(line));
}
function stripMarkdownMarkers(value) {
    return value
        .replace(/^[-*+]\s+/, "")
        .replace(/^#+\s+/, "")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        .trim();
}
function truncatePreview(value) {
    const maxLength = 160;
    if (value.length <= maxLength)
        return value;
    return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}
function countSupportingMaterialFiles(materialsPath) {
    if (!fs_1.default.existsSync(materialsPath)) {
        return 0;
    }
    return fs_1.default.readdirSync(materialsPath, { withFileTypes: true }).reduce((count, entry) => {
        const entryPath = path_1.default.join(materialsPath, entry.name);
        if (entry.isDirectory()) {
            return count + countSupportingMaterialFiles(entryPath);
        }
        if (entry.isFile()) {
            return count + 1;
        }
        return count;
    }, 0);
}
function formatTaskTimestamp(timestamp) {
    const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})$/.exec(timestamp);
    if (!match)
        return timestamp;
    const [, year, month, day, hour, minute] = match;
    return `${year}-${month}-${day} ${hour}:${minute}`;
}
function getTaskPath(workflowPath, taskId) {
    assertValidTaskId(taskId);
    const taskPath = path_1.default.join(getTasksPath(workflowPath), taskId);
    if (!fs_1.default.existsSync(taskPath) || !fs_1.default.statSync(taskPath).isDirectory()) {
        throw new Error("Task not found.");
    }
    return taskPath;
}
function readTextFileIfExists(filePath) {
    if (!fs_1.default.existsSync(filePath) || !fs_1.default.statSync(filePath).isFile()) {
        return "";
    }
    return fs_1.default.readFileSync(filePath, "utf8");
}
function readTaskMarkdown(workflowPath, taskId) {
    return readTextFileIfExists(path_1.default.join(getTaskPath(workflowPath, taskId), "task.md"));
}
function readTaskSections(workflowPath, taskId) {
    return (0, task_sections_1.parseTaskSections)(readTaskMarkdown(workflowPath, taskId));
}
function saveTaskSections(workflowPath, taskId, sections) {
    const taskPath = getTaskPath(workflowPath, taskId);
    const taskMarkdownPath = path_1.default.join(taskPath, "task.md");
    const currentContent = readTextFileIfExists(taskMarkdownPath);
    const updatedContent = (0, task_sections_1.updateTaskSections)(currentContent, sections);
    fs_1.default.writeFileSync(taskMarkdownPath, updatedContent, "utf8");
}
function readImplementationPlan(workflowPath, taskId) {
    return readTextFileIfExists(path_1.default.join(getTaskPath(workflowPath, taskId), "implementation-plan.md"));
}
function readGuidelines(workflowPath) {
    return readTextFileIfExists(path_1.default.join(workflowPath, "guidelines.md"));
}
function listSupportingMaterials(workflowPath, taskId) {
    const materialsPath = path_1.default.join(getTaskPath(workflowPath, taskId), "supporting-materials");
    if (!fs_1.default.existsSync(materialsPath)) {
        return [];
    }
    const materials = [];
    collectSupportingMaterials(materialsPath, materialsPath, materials);
    return materials.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
function collectSupportingMaterials(rootPath, currentPath, materials) {
    for (const entry of fs_1.default.readdirSync(currentPath, { withFileTypes: true })) {
        const entryPath = path_1.default.join(currentPath, entry.name);
        if (entry.isDirectory()) {
            collectSupportingMaterials(rootPath, entryPath, materials);
            continue;
        }
        if (!entry.isFile()) {
            continue;
        }
        const relativePath = path_1.default.relative(rootPath, entryPath).split(path_1.default.sep).join("/");
        const stat = fs_1.default.statSync(entryPath);
        materials.push({
            name: entry.name,
            relativePath,
            size: stat.size,
        });
    }
}
function resolveSupportingMaterialPath(workflowPath, taskId, materialRelativePath) {
    const materialsPath = path_1.default.join(getTaskPath(workflowPath, taskId), "supporting-materials");
    const materialPath = (0, paths_1.safeResolveWithin)(materialsPath, materialRelativePath);
    if (!fs_1.default.existsSync(materialPath) || !fs_1.default.statSync(materialPath).isFile()) {
        throw new Error("Supporting material not found.");
    }
    return materialPath;
}
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    const kilobytes = bytes / 1024;
    if (kilobytes < 1024)
        return `${kilobytes.toFixed(1)} KB`;
    const megabytes = kilobytes / 1024;
    return `${megabytes.toFixed(1)} MB`;
}
