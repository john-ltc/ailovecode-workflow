"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const file_operations_1 = require("../workflow/file-operations");
const paths_1 = require("../workflow/paths");
function toKebabCase(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function timestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return (now.getFullYear() +
        pad(now.getMonth() + 1) +
        pad(now.getDate()) +
        "T" +
        pad(now.getHours()) +
        pad(now.getMinutes()));
}
function createTask(args) {
    const taskName = args.join(" ");
    if (!taskName) {
        console.error("Please provide a task name.");
        console.error('Example: npx ailovecode-workflow create-task "add login page"');
        process.exit(1);
    }
    const targetRoot = (0, paths_1.getTargetRoot)();
    const targetWorkflow = (0, paths_1.getTargetWorkflowPath)(targetRoot);
    if (!fs_1.default.existsSync(targetWorkflow)) {
        console.error("workflow folder not found.");
        console.error("Run this first: npx ailovecode-workflow init");
        process.exit(1);
    }
    const folderName = `${timestamp()}_${toKebabCase(taskName)}`;
    const taskPath = path_1.default.join(targetWorkflow, "tasks", folderName);
    fs_1.default.mkdirSync(path_1.default.join(taskPath, "supporting-materials"), {
        recursive: true,
    });
    fs_1.default.writeFileSync(path_1.default.join(taskPath, "task.md"), file_operations_1.taskTemplate, "utf8");
    fs_1.default.writeFileSync(path_1.default.join(taskPath, "implementation-plan.md"), "", "utf8");
    console.log("Task created:");
    console.log(path_1.default.relative(targetRoot, taskPath));
}
