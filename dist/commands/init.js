"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const file_operations_1 = require("../workflow/file-operations");
const paths_1 = require("../workflow/paths");
function init() {
    const targetRoot = (0, paths_1.getTargetRoot)();
    const targetWorkflow = (0, paths_1.getTargetWorkflowPath)(targetRoot);
    if (fs_1.default.existsSync(targetWorkflow)) {
        console.log("Workflow already installed.");
        console.log("Use: npx ailovecode-workflow update");
        (0, file_operations_1.updateInstructionFiles)();
        return;
    }
    (0, file_operations_1.copyDir)((0, paths_1.getSourceWorkflowPath)(), targetWorkflow);
    fs_1.default.mkdirSync(path_1.default.join(targetWorkflow, "tasks"), {
        recursive: true,
    });
    (0, file_operations_1.updateInstructionFiles)();
    console.log("AILoveCode Workflow installed.");
    console.log("");
    console.log("Created:");
    console.log("- workflow/");
    console.log("- workflow/tasks/");
    console.log("- AGENTS.md");
    console.log("- CLAUDE.md");
}
