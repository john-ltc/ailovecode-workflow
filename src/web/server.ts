import express, { NextFunction, Request, Response } from "express";
import path from "path";
import { ensureWorkflowExists } from "../workflow/paths";
import { renderMarkdown } from "../workflow/markdown";
import {
  listSupportingMaterials,
  listTasks,
  readGuidelines,
  readImplementationPlan,
  readTaskSections,
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
} from "./views";

export interface StartWebServerOptions {
  port: number;
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

  app.get("/tasks/:taskId", (req, res, next) => {
    try {
      const task = getTaskSummary(workflowPath, req.params.taskId);
      const sections = readTaskSections(workflowPath, task.id);
      const implementationPlan = readImplementationPlan(workflowPath, task.id);
      const materials = listSupportingMaterials(workflowPath, task.id);

      res.send(
        renderTaskDetail({
          task,
          sections: {
            Context: renderMarkdown(sections.Context),
            Request: renderMarkdown(sections.Request),
            Reference: renderMarkdown(sections.Reference),
          },
          implementationPlanHtml: renderMarkdown(implementationPlan),
          materials,
          saved: req.query.saved === "1",
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
