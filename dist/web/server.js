"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWebServer = startWebServer;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const paths_1 = require("../workflow/paths");
const markdown_1 = require("../workflow/markdown");
const tasks_1 = require("../workflow/tasks");
const views_1 = require("./views");
function parseTaskDetailTab(value) {
    return value === "plan" || value === "materials" ? value : "overview";
}
function getTaskSummary(workflowPath, taskId) {
    const task = (0, tasks_1.listTasks)(workflowPath).find((candidate) => candidate.id === taskId);
    if (!task) {
        throw new Error("Task not found.");
    }
    return task;
}
function createApp(workflowPath) {
    const app = (0, express_1.default)();
    const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
    app.use(express_1.default.urlencoded({ extended: false }));
    app.use("/assets", express_1.default.static(path_1.default.join(__dirname, "public")));
    app.get("/", (_req, res) => {
        const tasks = (0, tasks_1.listTasks)(workflowPath);
        res.send((0, views_1.renderDashboard)({
            workflowPath,
            tasksPath: path_1.default.join(workflowPath, "tasks"),
            taskCount: tasks.length,
        }, tasks));
    });
    app.get("/tasks", (_req, res) => {
        res.send((0, views_1.renderTaskList)((0, tasks_1.listTasks)(workflowPath)));
    });
    app.get("/tasks/new", (_req, res) => {
        res.send((0, views_1.renderTaskNew)());
    });
    app.post("/tasks/new", upload.array("materials"), (req, res) => {
        const values = {
            taskName: typeof req.body.taskName === "string" ? req.body.taskName : "",
            Context: typeof req.body.Context === "string" ? req.body.Context : "",
            Request: typeof req.body.Request === "string" ? req.body.Request : "",
            Reference: typeof req.body.Reference === "string" ? req.body.Reference : "",
        };
        try {
            const createdTask = (0, tasks_1.createWorkflowTask)(workflowPath, {
                taskName: values.taskName,
                sections: {
                    Context: values.Context,
                    Request: values.Request,
                    Reference: values.Reference,
                },
            });
            const files = Array.isArray(req.files) ? req.files : [];
            for (const file of files) {
                (0, tasks_1.addSupportingMaterialFile)(workflowPath, createdTask.id, file.originalname, file.buffer);
            }
            res.redirect(`/tasks/${encodeURIComponent(createdTask.id)}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unable to create task.";
            res.status(400).send((0, views_1.renderTaskNew)({ values, error: message }));
        }
    });
    app.get("/tasks/:taskId", (req, res, next) => {
        try {
            const task = getTaskSummary(workflowPath, req.params.taskId);
            const sections = (0, tasks_1.readTaskSections)(workflowPath, task.id);
            const implementationPlan = (0, tasks_1.readImplementationPlan)(workflowPath, task.id);
            const materials = (0, tasks_1.listSupportingMaterials)(workflowPath, task.id);
            const activeTab = parseTaskDetailTab(req.query.tab);
            res.send((0, views_1.renderTaskDetail)({
                task,
                sections: {
                    Context: (0, markdown_1.renderMarkdown)(sections.Context),
                    Request: (0, markdown_1.renderMarkdown)(sections.Request),
                    Reference: (0, markdown_1.renderMarkdown)(sections.Reference),
                },
                editableSections: sections,
                implementationPlanHtml: (0, markdown_1.renderMarkdown)(implementationPlan),
                materials,
                saved: req.query.saved === "1",
                activeTab,
                editingOverview: activeTab === "overview" && req.query.edit === "1",
            }));
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/tasks/:taskId/edit", (req, res, next) => {
        try {
            const task = getTaskSummary(workflowPath, req.params.taskId);
            const sections = (0, tasks_1.readTaskSections)(workflowPath, task.id);
            res.send((0, views_1.renderTaskEdit)({ task, sections }));
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/tasks/:taskId/edit", (req, res, next) => {
        try {
            const task = getTaskSummary(workflowPath, req.params.taskId);
            (0, tasks_1.saveTaskSections)(workflowPath, task.id, {
                Context: typeof req.body.Context === "string" ? req.body.Context : "",
                Request: typeof req.body.Request === "string" ? req.body.Request : "",
                Reference: typeof req.body.Reference === "string" ? req.body.Reference : "",
            });
            res.redirect(`/tasks/${encodeURIComponent(task.id)}?saved=1`);
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/tasks/:taskId/materials", upload.array("materials"), (req, res, next) => {
        try {
            const task = getTaskSummary(workflowPath, req.params.taskId);
            const files = Array.isArray(req.files) ? req.files : [];
            for (const file of files) {
                (0, tasks_1.addSupportingMaterialFile)(workflowPath, task.id, file.originalname, file.buffer);
            }
            res.redirect(`/tasks/${encodeURIComponent(task.id)}?tab=materials`);
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/tasks/:taskId/materials/delete", (req, res, next) => {
        try {
            const task = getTaskSummary(workflowPath, req.params.taskId);
            const relativePath = typeof req.body.relativePath === "string" ? req.body.relativePath : "";
            (0, tasks_1.removeSupportingMaterial)(workflowPath, task.id, relativePath);
            res.redirect(`/tasks/${encodeURIComponent(task.id)}?tab=materials`);
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/tasks/:taskId/materials/*", (req, res, next) => {
        try {
            const task = getTaskSummary(workflowPath, req.params.taskId);
            const materialRelativePath = req.params[0];
            const materialPath = (0, tasks_1.resolveSupportingMaterialPath)(workflowPath, task.id, materialRelativePath);
            if (req.query.download === "1") {
                res.download(materialPath, path_1.default.basename(materialPath));
            }
            else {
                res.sendFile(materialPath);
            }
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/guidelines", (_req, res) => {
        res.send((0, views_1.renderGuidelines)((0, markdown_1.renderMarkdown)((0, tasks_1.readGuidelines)(workflowPath))));
    });
    app.use((_req, res) => {
        res.status(404).send((0, views_1.renderErrorPage)(404, "Page not found."));
    });
    app.use((error, _req, res, _next) => {
        const message = error.message || "Unexpected error.";
        const status = message.includes("not found") ? 404 : 400;
        res.status(status).send((0, views_1.renderErrorPage)(status, message));
    });
    return app;
}
async function startWebServer(options) {
    const workflowPath = (0, paths_1.ensureWorkflowExists)();
    const app = createApp(workflowPath);
    await new Promise((resolve, reject) => {
        const server = app.listen(options.port, "localhost", () => {
            console.log("AILoveCode Workflow WebUI running at:");
            console.log(`http://localhost:${options.port}`);
            resolve();
        });
        server.on("error", reject);
    });
}
