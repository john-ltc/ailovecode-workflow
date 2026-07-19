import express, { NextFunction, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { ensureWorkflowExists } from "../workflow/paths";
import { renderMarkdown } from "../workflow/markdown";
import {
  addSupportingMaterialFile,
  createWorkflowTask,
  listSupportingMaterials,
  listTasks,
  readGuidelines,
  readImplementationPlan,
  readTaskSections,
  removeSupportingMaterial,
  resolveSupportingMaterialPath,
  saveTaskSections,
  TaskSummary,
} from "../workflow/tasks";
import {
  renderDashboard,
  renderErrorPage,
  renderGuidelines,
  renderTaskDetail,
  renderTaskEdit,
  renderTaskList,
  renderTaskNew,
  TaskDetailTab,
} from "./views";

export interface StartWebServerOptions {
  port: number;
}

function parseTaskDetailTab(value: unknown): TaskDetailTab {
  return value === "plan" || value === "materials" ? value : "overview";
}

function getTaskSummary(workflowPath: string, taskId: string): TaskSummary {
  const task = listTasks(workflowPath).find((candidate) => candidate.id === taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  return task;
}

function createApp(workflowPath: string): express.Express {
  const app = express();
  const upload = multer({ storage: multer.memoryStorage() });

  app.use(express.urlencoded({ extended: false }));
  app.use("/assets", express.static(path.join(__dirname, "public")));

  app.get("/", (_req, res) => {
    const tasks = listTasks(workflowPath);

    res.send(
      renderDashboard(
        {
          workflowPath,
          tasksPath: path.join(workflowPath, "tasks"),
          taskCount: tasks.length,
        },
        tasks,
      ),
    );
  });

  app.get("/tasks", (_req, res) => {
    res.send(renderTaskList(listTasks(workflowPath)));
  });

  app.get("/tasks/new", (_req, res) => {
    res.send(renderTaskNew());
  });

  app.post("/tasks/new", upload.array("materials"), (req, res) => {
    const values = {
      taskName: typeof req.body.taskName === "string" ? req.body.taskName : "",
      Context: typeof req.body.Context === "string" ? req.body.Context : "",
      Request: typeof req.body.Request === "string" ? req.body.Request : "",
      Reference: typeof req.body.Reference === "string" ? req.body.Reference : "",
    };

    try {
      const createdTask = createWorkflowTask(workflowPath, {
        taskName: values.taskName,
        sections: {
          Context: values.Context,
          Request: values.Request,
          Reference: values.Reference,
        },
      });
      const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];

      for (const file of files) {
        addSupportingMaterialFile(workflowPath, createdTask.id, file.originalname, file.buffer);
      }

      res.redirect(`/tasks/${encodeURIComponent(createdTask.id)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create task.";
      res.status(400).send(renderTaskNew({ values, error: message }));
    }
  });

  app.get("/tasks/:taskId", (req, res, next) => {
    try {
      const task = getTaskSummary(workflowPath, req.params.taskId);
      const sections = readTaskSections(workflowPath, task.id);
      const implementationPlan = readImplementationPlan(workflowPath, task.id);
      const materials = listSupportingMaterials(workflowPath, task.id);
      const activeTab = parseTaskDetailTab(req.query.tab);

      res.send(
        renderTaskDetail({
          task,
          sections: {
            Context: renderMarkdown(sections.Context),
            Request: renderMarkdown(sections.Request),
            Reference: renderMarkdown(sections.Reference),
          },
          editableSections: sections,
          implementationPlanHtml: renderMarkdown(implementationPlan),
          materials,
          saved: req.query.saved === "1",
          activeTab,
          editingOverview: activeTab === "overview" && req.query.edit === "1",
        }),
      );
    } catch (error) {
      next(error);
    }
  });

  app.get("/tasks/:taskId/edit", (req, res, next) => {
    try {
      const task = getTaskSummary(workflowPath, req.params.taskId);
      const sections = readTaskSections(workflowPath, task.id);

      res.send(renderTaskEdit({ task, sections }));
    } catch (error) {
      next(error);
    }
  });

  app.post("/tasks/:taskId/edit", (req, res, next) => {
    try {
      const task = getTaskSummary(workflowPath, req.params.taskId);

      saveTaskSections(workflowPath, task.id, {
        Context: typeof req.body.Context === "string" ? req.body.Context : "",
        Request: typeof req.body.Request === "string" ? req.body.Request : "",
        Reference: typeof req.body.Reference === "string" ? req.body.Reference : "",
      });

      res.redirect(`/tasks/${encodeURIComponent(task.id)}?saved=1`);
    } catch (error) {
      next(error);
    }
  });

  app.post("/tasks/:taskId/materials", upload.array("materials"), (req, res, next) => {
    try {
      const task = getTaskSummary(workflowPath, req.params.taskId);
      const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];

      for (const file of files) {
        addSupportingMaterialFile(workflowPath, task.id, file.originalname, file.buffer);
      }

      res.redirect(`/tasks/${encodeURIComponent(task.id)}?tab=materials`);
    } catch (error) {
      next(error);
    }
  });

  app.post("/tasks/:taskId/materials/delete", (req, res, next) => {
    try {
      const task = getTaskSummary(workflowPath, req.params.taskId);
      const relativePath = typeof req.body.relativePath === "string" ? req.body.relativePath : "";

      removeSupportingMaterial(workflowPath, task.id, relativePath);

      res.redirect(`/tasks/${encodeURIComponent(task.id)}?tab=materials`);
    } catch (error) {
      next(error);
    }
  });

  app.get("/tasks/:taskId/materials/*", (req, res, next) => {
    try {
      const task = getTaskSummary(workflowPath, req.params.taskId);
      const materialRelativePath = (req.params as Record<string, string>)[0];
      const materialPath = resolveSupportingMaterialPath(workflowPath, task.id, materialRelativePath);

      if (req.query.download === "1") {
        res.download(materialPath, path.basename(materialPath));
      } else {
        res.sendFile(materialPath);
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/guidelines", (_req, res) => {
    res.send(renderGuidelines(renderMarkdown(readGuidelines(workflowPath))));
  });

  app.use((_req, res) => {
    res.status(404).send(renderErrorPage(404, "Page not found."));
  });

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    const message = error.message || "Unexpected error.";
    const status = message.includes("not found") ? 404 : 400;

    res.status(status).send(renderErrorPage(status, message));
  });

  return app;
}

export async function startWebServer(options: StartWebServerOptions): Promise<void> {
  const workflowPath = ensureWorkflowExists();
  const app = createApp(workflowPath);

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(options.port, "localhost", () => {
      console.log("AILoveCode Workflow WebUI running at:");
      console.log(`http://localhost:${options.port}`);
      resolve();
    });

    server.on("error", reject);
  });
}
