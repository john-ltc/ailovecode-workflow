"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const paths_1 = require("../workflow/paths");
const tasks_1 = require("../workflow/tasks");
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
    try {
        const createdTask = (0, tasks_1.createWorkflowTask)(targetWorkflow, { taskName });
        console.log("Task created:");
        console.log(path_1.default.relative(targetRoot, createdTask.taskPath));
    }
    catch (error) {
        console.error(error instanceof Error ? error.message : "Unable to create task.");
        process.exit(1);
    }
}
