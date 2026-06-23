import { formatBytes, SupportingMaterial, TaskSummary, WorkflowInfo } from "../workflow/tasks";

export interface RenderedTaskSections {
  Context: string;
  Request: string;
  Reference: string;
}

export interface EditableTaskSections {
  Context: string;
  Request: string;
  Reference: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function encodePathSegments(relativePath: string): string {
  return relativePath.split("/").map(encodeURIComponent).join("/");
}

function pageLayout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} - AILoveCode Workflow</title>
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="min-h-screen bg-slate-100 text-slate-900">
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      <a href="/" class="text-xl font-semibold tracking-tight text-slate-950">AILoveCode Workflow</a>
      <nav class="flex gap-4 text-sm font-medium text-slate-600">
        <a class="hover:text-slate-950" href="/">Dashboard</a>
        <a class="hover:text-slate-950" href="/tasks">Tasks</a>
        <a class="hover:text-slate-950" href="/guidelines">Guidelines</a>
      </nav>
    </div>
  </header>
  <main class="mx-auto max-w-7xl px-6 py-8">
    ${body}
  </main>
</body>
</html>`;
}

function card(content: string, extraClasses = ""): string {
  return `<section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${extraClasses}">${content}</section>`;
}

function emptyState(message: string): string {
  return `<p class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">${escapeHtml(message)}</p>`;
}

function markdownBlock(renderedHtml: string): string {
  if (!renderedHtml.trim()) {
    return emptyState("No content yet.");
  }

  return `<div class="prose-like">${renderedHtml}</div>`;
}

interface TaskListOptions {
  limit?: number;
  compact?: boolean;
  searchable?: boolean;
  emptyMessage?: string;
}

function taskListItems(tasks: TaskSummary[], options: TaskListOptions = {}): string {
  const { limit, compact = false, searchable = false, emptyMessage = "No tasks found." } = options;
  const visibleTasks = typeof limit === "number" ? tasks.slice(0, limit) : tasks;

  if (visibleTasks.length === 0) {
    return emptyState(emptyMessage);
  }

  return `<div class="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200"${searchable ? ' data-task-list-items' : ""}>
    ${visibleTasks.map((task) => renderTaskRow(task, compact, searchable)).join("")}
  </div>`;
}

function renderTaskRow(task: TaskSummary, compact: boolean, searchable: boolean): string {
  const taskUrl = `/tasks/${encodeURIComponent(task.id)}`;
  const searchAttributes = searchable
    ? ` data-task-row data-task-search="${escapeHtml(taskListSearchText(task))}"`
    : "";

  if (compact) {
    return `<a class="block bg-white px-4 py-3 hover:bg-slate-50" href="${taskUrl}"${searchAttributes}>
      <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <div class="truncate font-medium text-slate-950">${escapeHtml(task.name)}</div>
          <div class="mt-1 truncate font-mono text-xs text-slate-500">${escapeHtml(task.id)}</div>
        </div>
        <div class="shrink-0 text-xs text-slate-500">${escapeHtml(task.createdLabel)}</div>
      </div>
    </a>`;
  }

  return `<a class="block bg-white px-4 py-4 hover:bg-slate-50" href="${taskUrl}"${searchAttributes}>
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <div class="text-base font-semibold text-slate-950">${escapeHtml(task.name)}</div>
        <div class="mt-1 break-all font-mono text-xs text-slate-500">${escapeHtml(task.id)}</div>
      </div>
      <div class="shrink-0 text-xs font-medium text-slate-500">${escapeHtml(task.createdLabel)}</div>
    </div>
    ${task.requestPreview ? `<p class="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">${escapeHtml(task.requestPreview)}</p>` : ""}
    <div class="mt-3 flex flex-wrap gap-2">${renderTaskBadges(task)}</div>
  </a>`;
}

function renderTaskBadges(task: TaskSummary): string {
  return [
    task.hasTaskMarkdown ? taskBadge("task.md", "green") : taskBadge("task.md empty", "amber"),
    task.hasImplementationPlan ? taskBadge("plan written", "blue") : taskBadge("plan empty", "slate"),
    task.supportingMaterialCount > 0
      ? taskBadge(`materials: ${task.supportingMaterialCount}`, "purple")
      : taskBadge("materials: 0", "slate"),
  ].join("");
}

function taskBadge(label: string, tone: "amber" | "blue" | "green" | "purple" | "slate"): string {
  const toneClasses = {
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    purple: "bg-purple-100 text-purple-800",
    slate: "bg-slate-100 text-slate-700",
  };

  return `<span class="rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}">${escapeHtml(label)}</span>`;
}

function taskListSearchText(task: TaskSummary): string {
  return [task.name, task.id, task.createdLabel, task.requestPreview].filter(Boolean).join(" ");
}

function taskListEmptyState(): string {
  return `<div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
    <p>No tasks found in <span class="font-mono">workflow/tasks/</span>.</p>
    <p class="mt-2">Create one with <code class="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-slate-900">npx ailovecode-workflow create-task &quot;new-task&quot;</code>.</p>
  </div>`;
}

function taskListSearchControls(taskCount: number): string {
  const taskLabel = taskCount === 1 ? "task" : "tasks";

  return `<div class="mb-4 space-y-3">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <label class="block text-sm font-semibold text-slate-800" for="task-search">Search tasks</label>
      <p class="text-sm text-slate-500" data-task-list-count data-total-tasks="${taskCount}">${taskCount} ${taskLabel} in workflow/tasks/</p>
    </div>
    <input id="task-search" data-task-search-input class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" type="search" placeholder="Search by title, folder name, timestamp, or preview">
    <p class="text-xs text-slate-500">Search is local to this page and does not change workflow files.</p>
  </div>`;
}

function taskListNoResultsState(): string {
  return `<div class="mt-4 hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500" data-task-list-no-results>
    No tasks match <span class="font-medium text-slate-700" data-task-list-query></span>.
  </div>`;
}

function taskListSearchScript(): string {
  return `<script>
(() => {
  const input = document.querySelector('[data-task-search-input]');
  const rows = Array.from(document.querySelectorAll('[data-task-row]'));
  const count = document.querySelector('[data-task-list-count]');
  const noResults = document.querySelector('[data-task-list-no-results]');
  const queryLabel = document.querySelector('[data-task-list-query]');

  if (!input || rows.length === 0) return;

  const total = rows.length;
  const taskWord = total === 1 ? 'task' : 'tasks';

  function updateCount(visibleCount, query) {
    if (!count) return;

    count.textContent = query
      ? visibleCount + ' of ' + total + ' ' + taskWord + ' shown'
      : total + ' ' + taskWord + ' in workflow/tasks/';
  }

  function updateList() {
    const query = input.value.trim().toLowerCase();
    let visibleCount = 0;

    rows.forEach((row) => {
      const searchText = (row.getAttribute('data-task-search') || '').toLowerCase();
      const matches = !query || searchText.includes(query);
      row.classList.toggle('hidden', !matches);

      if (matches) {
        visibleCount += 1;
      }
    });

    updateCount(visibleCount, query);

    if (noResults) {
      noResults.classList.toggle('hidden', !query || visibleCount > 0);
    }

    if (queryLabel) {
      queryLabel.textContent = input.value.trim();
    }
  }

  input.addEventListener('input', updateList);
  updateList();
})();
</script>`;
}

export function renderDashboard(workflowInfo: WorkflowInfo, tasks: TaskSummary[]): string {
  return pageLayout(
    "Dashboard",
    `<div class="space-y-6">
      <div>
        <p class="text-sm font-medium uppercase tracking-wide text-blue-700">Local file-mode WebUI</p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
        <p class="mt-2 text-slate-600">Manage workflow files from your browser while preserving the file-based workflow rules.</p>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        ${card(`<div class="text-sm font-medium text-slate-500">Workflow root</div><div class="mt-2 break-all font-mono text-sm text-slate-950">${escapeHtml(workflowInfo.workflowPath)}</div>`)}
        ${card(`<div class="text-sm font-medium text-slate-500">Tasks</div><div class="mt-2 text-3xl font-bold text-slate-950">${workflowInfo.taskCount}</div>`)}
        ${card(`<div class="text-sm font-medium text-slate-500">Rules</div><div class="mt-2 text-sm text-slate-700">task.md is human-owned. implementation-plan.md is read-only.</div>`)}
      </div>

      <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
        ${card(`<div class="mb-4 flex items-center justify-between"><h2 class="text-lg font-semibold text-slate-950">Recent Tasks</h2><a class="text-sm font-medium text-blue-700 hover:text-blue-900" href="/tasks">View all</a></div>${taskListItems(tasks, { limit: 5, compact: true })}`)}
        ${card(`<h2 class="text-lg font-semibold text-slate-950">Quick Links</h2><div class="mt-4 grid gap-3"><a class="rounded-lg bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-800" href="/tasks">Open Task List</a><a class="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/guidelines">View Guidelines</a></div>`)}
      </div>
    </div>`,
  );
}

export function renderTaskList(tasks: TaskSummary[]): string {
  const taskListContent =
    tasks.length > 0
      ? `${taskListSearchControls(tasks.length)}${taskListItems(tasks, { searchable: true })}${taskListNoResultsState()}`
      : taskListEmptyState();

  return pageLayout(
    "Tasks",
    `<div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-950">Tasks</h1>
        <p class="mt-2 text-slate-600">Tasks are loaded from <span class="font-mono">workflow/tasks/</span>.</p>
      </div>
      ${card(taskListContent)}
      ${tasks.length > 0 ? taskListSearchScript() : ""}
    </div>`,
  );
}

export function renderTaskDetail(options: {
  task: TaskSummary;
  sections: RenderedTaskSections;
  implementationPlanHtml: string;
  materials: SupportingMaterial[];
  saved: boolean;
}): string {
  const { task, sections, implementationPlanHtml, materials, saved } = options;

  return pageLayout(
    task.name,
    `<div class="space-y-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <a class="text-sm font-medium text-blue-700 hover:text-blue-900" href="/tasks">← Back to tasks</a>
          <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">${escapeHtml(task.name)}</h1>
          <p class="mt-1 font-mono text-sm text-slate-500">${escapeHtml(task.id)}</p>
        </div>
        <a class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" href="/tasks/${encodeURIComponent(task.id)}/edit">Edit task.md sections</a>
      </div>

      ${saved ? `<div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">task.md sections saved.</div>` : ""}

      <div class="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside class="space-y-3">
          ${card(`<h2 class="text-base font-semibold text-slate-950">Task Files</h2><ul class="mt-3 space-y-2 text-sm text-slate-700"><li>task.md <span class="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">Editable</span></li><li>implementation-plan.md <span class="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">Read only</span></li></ul>`)}
          ${renderMaterialsCard(task, materials)}
        </aside>

        <div class="space-y-6">
          ${card(`<h2 class="text-xl font-semibold text-slate-950">Context</h2><div class="mt-4">${markdownBlock(sections.Context)}</div>`)}
          ${card(`<h2 class="text-xl font-semibold text-slate-950">Request</h2><div class="mt-4">${markdownBlock(sections.Request)}</div>`)}
          ${card(`<h2 class="text-xl font-semibold text-slate-950">Reference</h2><div class="mt-4">${markdownBlock(sections.Reference)}</div>`)}
          ${card(`<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-xl font-semibold text-slate-950">Implementation Plan</h2><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Read only · AI-owned</span></div><div class="mt-4">${markdownBlock(implementationPlanHtml)}</div>`)}
        </div>
      </div>
    </div>`,
  );
}

function renderMaterialsCard(task: TaskSummary, materials: SupportingMaterial[]): string {
  if (materials.length === 0) {
    return card(`<h2 class="text-base font-semibold text-slate-950">Supporting Materials</h2><div class="mt-3">${emptyState("No supporting materials found.")}</div>`);
  }

  return card(`<h2 class="text-base font-semibold text-slate-950">Supporting Materials</h2><ul class="mt-3 space-y-3 text-sm">
    ${materials
      .map((material) => {
        const materialUrl = `/tasks/${encodeURIComponent(task.id)}/materials/${encodePathSegments(material.relativePath)}`;
        return `<li class="rounded-lg border border-slate-200 p-3">
          <div class="break-all font-medium text-slate-900">${escapeHtml(material.relativePath)}</div>
          <div class="mt-1 text-xs text-slate-500">${formatBytes(material.size)}</div>
          <div class="mt-2 flex gap-3 text-xs font-semibold">
            <a class="text-blue-700 hover:text-blue-900" href="${materialUrl}" target="_blank" rel="noreferrer">Open</a>
            <a class="text-blue-700 hover:text-blue-900" href="${materialUrl}?download=1">Download</a>
          </div>
        </li>`;
      })
      .join("")}
  </ul>`);
}

export function renderTaskEdit(options: { task: TaskSummary; sections: EditableTaskSections }): string {
  const { task, sections } = options;

  return pageLayout(
    `Edit ${task.name}`,
    `<div class="space-y-6">
      <div>
        <a class="text-sm font-medium text-blue-700 hover:text-blue-900" href="/tasks/${encodeURIComponent(task.id)}">← Back to task</a>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">Edit task.md Sections</h1>
        <p class="mt-2 text-slate-600">Only Context, Request, and Reference are editable in Phase 1. implementation-plan.md remains read-only.</p>
      </div>

      ${card(`<form method="post" action="/tasks/${encodeURIComponent(task.id)}/edit" class="space-y-6">
        ${sectionTextarea("Context", sections.Context)}
        ${sectionTextarea("Request", sections.Request)}
        ${sectionTextarea("Reference", sections.Reference)}
        <div class="flex gap-3">
          <button class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" type="submit">Save sections</button>
          <a class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/tasks/${encodeURIComponent(task.id)}">Cancel</a>
        </div>
      </form>`)}
    </div>`,
  );
}

function sectionTextarea(sectionName: keyof EditableTaskSections, value: string): string {
  return `<label class="block">
    <span class="text-sm font-semibold text-slate-800">${escapeHtml(sectionName)}</span>
    <textarea class="mt-2 min-h-40 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" name="${escapeHtml(sectionName)}">${escapeHtml(value)}</textarea>
  </label>`;
}

export function renderGuidelines(guidelinesHtml: string): string {
  return pageLayout(
    "Guidelines",
    `<div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-950">Guidelines</h1>
        <p class="mt-2 text-slate-600">Rendered from <span class="font-mono">workflow/guidelines.md</span>.</p>
      </div>
      ${card(markdownBlock(guidelinesHtml))}
    </div>`,
  );
}

export function renderErrorPage(status: number, message: string): string {
  return pageLayout(
    `Error ${status}`,
    `<div class="mx-auto max-w-2xl">${card(`<p class="text-sm font-medium uppercase tracking-wide text-red-700">Error ${status}</p><h1 class="mt-2 text-2xl font-bold text-slate-950">${escapeHtml(message)}</h1><p class="mt-4"><a class="text-sm font-semibold text-blue-700 hover:text-blue-900" href="/">Go to dashboard</a></p>`)}</div>`,
  );
}
