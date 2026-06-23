"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskTemplate = void 0;
exports.copyDir = copyDir;
exports.ensureWorkflowTag = ensureWorkflowTag;
exports.updateInstructionFiles = updateInstructionFiles;
exports.getTargetWorkflow = getTargetWorkflow;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const paths_1 = require("./paths");
exports.taskTemplate = `## Context


## Request


## Reference
`;
function copyDir(src, dest) {
    if (!fs_1.default.existsSync(src))
        return;
    fs_1.default.mkdirSync(dest, { recursive: true });
    for (const item of fs_1.default.readdirSync(src)) {
        if (item === "tasks")
            continue;
        if (item === "workflow-tag.md")
            continue;
        const srcPath = path_1.default.join(src, item);
        const destPath = path_1.default.join(dest, item);
        if (fs_1.default.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        }
        else {
            fs_1.default.copyFileSync(srcPath, destPath);
        }
    }
}
function ensureWorkflowTag(fileName) {
    const targetRoot = (0, paths_1.getTargetRoot)();
    const filePath = path_1.default.join(targetRoot, fileName);
    const tagPath = path_1.default.join((0, paths_1.getSourceWorkflowPath)(), "workflow-tag.md");
    if (!fs_1.default.existsSync(tagPath)) {
        return;
    }
    const tagContent = fs_1.default.readFileSync(tagPath, "utf8").trim();
    const startTag = "<ailovecode-workflow>";
    const endTag = "</ailovecode-workflow>";
    let content = "";
    if (fs_1.default.existsSync(filePath)) {
        content = fs_1.default.readFileSync(filePath, "utf8");
    }
    const regex = new RegExp(`${startTag}[\\s\\S]*?${endTag}`, "m");
    if (regex.test(content)) {
        content = content.replace(regex, tagContent);
    }
    else {
        content = content.trimEnd() + (content.trim() ? "\n\n" : "") + tagContent + "\n";
    }
    fs_1.default.writeFileSync(filePath, content, "utf8");
}
function updateInstructionFiles() {
    ensureWorkflowTag("AGENTS.md");
    ensureWorkflowTag("CLAUDE.md");
}
function getTargetWorkflow() {
    return (0, paths_1.getTargetWorkflowPath)((0, paths_1.getTargetRoot)());
}
