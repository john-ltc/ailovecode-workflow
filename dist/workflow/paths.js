"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowNotFoundError = void 0;
exports.getPackageRoot = getPackageRoot;
exports.getTargetRoot = getTargetRoot;
exports.getSourceWorkflowPath = getSourceWorkflowPath;
exports.getTargetWorkflowPath = getTargetWorkflowPath;
exports.ensureWorkflowExists = ensureWorkflowExists;
exports.pathIsWithin = pathIsWithin;
exports.safeResolveWithin = safeResolveWithin;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getPackageRoot() {
    return path_1.default.resolve(__dirname, "../..");
}
function getTargetRoot() {
    return process.cwd();
}
function getSourceWorkflowPath() {
    return path_1.default.join(getPackageRoot(), "workflow");
}
function getTargetWorkflowPath(targetRoot = getTargetRoot()) {
    return path_1.default.join(targetRoot, "workflow");
}
function ensureWorkflowExists(targetRoot = getTargetRoot()) {
    const workflowPath = getTargetWorkflowPath(targetRoot);
    if (!fs_1.default.existsSync(workflowPath)) {
        throw new WorkflowNotFoundError();
    }
    return workflowPath;
}
class WorkflowNotFoundError extends Error {
    constructor() {
        super("workflow folder not found.\nRun this first: npx ailovecode-workflow init");
        this.name = "WorkflowNotFoundError";
    }
}
exports.WorkflowNotFoundError = WorkflowNotFoundError;
function pathIsWithin(parentPath, childPath) {
    const relative = path_1.default.relative(parentPath, childPath);
    return relative === "" || (!relative.startsWith("..") && !path_1.default.isAbsolute(relative));
}
function safeResolveWithin(parentPath, relativePath) {
    if (!relativePath || path_1.default.isAbsolute(relativePath) || relativePath.includes("\0")) {
        throw new Error("Invalid path.");
    }
    const resolvedPath = path_1.default.resolve(parentPath, relativePath);
    if (!pathIsWithin(parentPath, resolvedPath)) {
        throw new Error("Invalid path.");
    }
    return resolvedPath;
}
