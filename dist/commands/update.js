"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = update;
const fs_1 = __importDefault(require("fs"));
const file_operations_1 = require("../workflow/file-operations");
const paths_1 = require("../workflow/paths");
function update() {
    const targetWorkflow = (0, paths_1.getTargetWorkflowPath)();
    if (!fs_1.default.existsSync(targetWorkflow)) {
        console.error("workflow folder not found.");
        console.error("Run this first: npx ailovecode-workflow init");
        process.exit(1);
    }
    (0, file_operations_1.copyDir)((0, paths_1.getSourceWorkflowPath)(), targetWorkflow);
    (0, file_operations_1.updateInstructionFiles)();
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
