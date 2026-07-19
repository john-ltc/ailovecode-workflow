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

export interface TaskCreateFormValues extends EditableTaskSections {
  taskName: string;
}

export type TaskDetailTab = "overview" | "plan" | "materials";

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
    <div class="mt-4">
      <a class="inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" href="/tasks/new">Create New Task</a>
    </div>
    <p class="mt-3 text-xs text-slate-500">CLI option: <code class="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-slate-900">npx ailovecode-workflow create-task &quot;new-task&quot;</code></p>
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
        ${card(`<h2 class="text-lg font-semibold text-slate-950">Quick Links</h2><div class="mt-4 grid gap-3"><a class="rounded-lg bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-800" href="/tasks/new">New Task</a><a class="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/tasks">Open Task List</a><a class="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/guidelines">View Guidelines</a></div>`)}
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
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-slate-950">Tasks</h1>
          <p class="mt-2 text-slate-600">Tasks are loaded from <span class="font-mono">workflow/tasks/</span>.</p>
        </div>
        <a class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" href="/tasks/new">New Task</a>
      </div>
      ${card(taskListContent)}
      ${tasks.length > 0 ? taskListSearchScript() : ""}
    </div>`,
  );
}

function normalizeTaskCreateFormValues(values?: Partial<TaskCreateFormValues>): TaskCreateFormValues {
  return {
    taskName: values?.taskName ?? "",
    Context: values?.Context ?? "",
    Request: values?.Request ?? "",
    Reference: values?.Reference ?? "",
  };
}

function formError(message?: string): string {
  if (!message) return "";

  return `<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">${escapeHtml(message)}</div>`;
}

export function renderTaskNew(options: { values?: Partial<TaskCreateFormValues>; error?: string } = {}): string {
  const values = normalizeTaskCreateFormValues(options.values);

  return pageLayout(
    "New Task",
    `<div class="space-y-6">
      <div>
        <a class="text-sm font-medium text-blue-700 hover:text-blue-900" href="/tasks">← Back to tasks</a>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">New Task</h1>
        <p class="mt-2 text-slate-600">Create a file-based workflow task with the standard task.md sections.</p>
      </div>

      ${formError(options.error)}

      ${card(`<form method="post" action="/tasks/new" class="space-y-6" enctype="multipart/form-data">
        ${taskNameInput(values.taskName)}
        ${sectionTextarea("Context", values.Context)}
        ${sectionTextarea("Request", values.Request)}
        ${taskCreateMaterialsInput()}
        ${sectionTextarea("Reference", values.Reference)}
        <div class="flex gap-3">
          <button class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" type="submit">Create task</button>
          <a class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/tasks">Cancel</a>
        </div>
      </form>`)}
      ${taskCreateMaterialsScript()}
    </div>`,
  );
}

interface TaskDetailRenderOptions {
  task: TaskSummary;
  sections: RenderedTaskSections;
  editableSections: EditableTaskSections;
  implementationPlanHtml: string;
  materials: SupportingMaterial[];
  saved: boolean;
  activeTab: TaskDetailTab;
  editingOverview: boolean;
}

function taskDetailTabHref(task: TaskSummary, tab: TaskDetailTab): string {
  const taskUrl = `/tasks/${encodeURIComponent(task.id)}`;

  return tab === "overview" ? taskUrl : `${taskUrl}?tab=${tab}`;
}

function renderTaskDetailTabs(task: TaskSummary, activeTab: TaskDetailTab): string {
  const tabs: Array<{ id: TaskDetailTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "plan", label: "Implementation Plan" },
    { id: "materials", label: "Supporting Materials" },
  ];

  return `<nav class="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Task detail tabs">
    ${tabs
      .map((tab) => {
        const isActive = tab.id === activeTab;
        const classes = isActive
          ? "bg-blue-700 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950";

        return `<a class="rounded-lg px-4 py-2 text-sm font-semibold ${classes}" href="${taskDetailTabHref(task, tab.id)}">${escapeHtml(tab.label)}</a>`;
      })
      .join("")}
  </nav>`;
}

function renderTaskDetailTabContent(options: TaskDetailRenderOptions): string {
  const { task, sections, editableSections, implementationPlanHtml, materials, activeTab, editingOverview } = options;

  if (activeTab === "plan") {
    return card(`<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-xl font-semibold text-slate-950">Implementation Plan</h2><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Read only · AI-owned</span></div><div class="mt-4">${markdownBlock(implementationPlanHtml)}</div>`);
  }

  if (activeTab === "materials") {
    return renderMaterialsCard(task, materials);
  }

  if (editingOverview) {
    return card(`<div class="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><div><h2 class="text-xl font-semibold text-slate-950">Edit Overview</h2><p class="mt-1 text-sm text-slate-500">Updates Context, Request, and Reference in task.md.</p></div></div><form method="post" action="/tasks/${encodeURIComponent(task.id)}/edit" class="space-y-6">
      ${sectionTextarea("Context", editableSections.Context)}
      ${sectionTextarea("Request", editableSections.Request)}
      ${sectionTextarea("Reference", editableSections.Reference)}
      <div class="flex gap-3">
        <button class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" type="submit">Save overview</button>
        <a class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/tasks/${encodeURIComponent(task.id)}">Cancel</a>
      </div>
    </form>`);
  }

  return `<div class="space-y-6">
    ${card(`<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 class="text-xl font-semibold text-slate-950">Overview</h2><p class="mt-1 text-sm text-slate-500">Context, Request, and Reference from task.md.</p></div><a class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" href="/tasks/${encodeURIComponent(task.id)}?edit=1">Edit Overview</a></div>`)}
    ${card(`<h2 class="text-xl font-semibold text-slate-950">Context</h2><div class="mt-4">${markdownBlock(sections.Context)}</div>`)}
    ${card(`<h2 class="text-xl font-semibold text-slate-950">Request</h2><div class="mt-4">${markdownBlock(sections.Request)}</div>`)}
    ${card(`<h2 class="text-xl font-semibold text-slate-950">Reference</h2><div class="mt-4">${markdownBlock(sections.Reference)}</div>`)}
  </div>`;
}

export function renderTaskDetail(options: TaskDetailRenderOptions): string {
  const { task, saved, activeTab, editingOverview } = options;

  return pageLayout(
    task.name,
    `<div class="space-y-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <a class="text-sm font-medium text-blue-700 hover:text-blue-900" href="/tasks">← Back to tasks</a>
          <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">${escapeHtml(task.name)}</h1>
          <p class="mt-1 font-mono text-sm text-slate-500">${escapeHtml(task.id)}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span class="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">task.md editable</span>
            <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">implementation-plan.md read only</span>
            <span class="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800">materials: ${task.supportingMaterialCount}</span>
          </div>
        </div>
      </div>

      ${saved ? `<div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">task.md sections saved.</div>` : ""}
      ${editingOverview ? `<div class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">Editing Overview inline. Save or cancel to return to the read-only view.</div>` : ""}

      ${renderTaskDetailTabs(task, activeTab)}
      ${renderTaskDetailTabContent(options)}
    </div>`,
  );
}

function renderMaterialsCard(task: TaskSummary, materials: SupportingMaterial[]): string {
  const materialsList =
    materials.length === 0
      ? `<div class="mt-3">${emptyState("No supporting materials found.")}</div>`
      : `<ul class="mt-3 space-y-3 text-sm">
          ${materials.map((material) => renderMaterialListItem(task, material)).join("")}
        </ul>`;

  return card(`<div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-xl font-semibold text-slate-950">Supporting Materials</h2>
        <p class="mt-1 text-sm text-slate-500">Files are stored in this task's supporting-materials folder.</p>
      </div>
    </div>
    ${materialsList}
    ${renderMaterialsUploadForm(task)}`);
}

function renderMaterialsUploadForm(task: TaskSummary): string {
  return `<form class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4" method="post" action="/tasks/${encodeURIComponent(task.id)}/materials" enctype="multipart/form-data">
    <label class="block">
      <span class="text-sm font-semibold text-slate-800">Add supporting materials</span>
      <input class="mt-2 block w-full text-sm text-slate-700" name="materials" type="file" multiple>
      <span class="mt-2 block text-xs text-slate-500">Use uploaded file paths in Reference when needed.</span>
    </label>
    <button class="mt-3 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800" type="submit">Upload</button>
  </form>`;
}

function renderMaterialListItem(task: TaskSummary, material: SupportingMaterial): string {
  const materialUrl = `/tasks/${encodeURIComponent(task.id)}/materials/${encodePathSegments(material.relativePath)}`;

  return `<li class="rounded-lg border border-slate-200 p-4">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0">
        <div class="break-all font-medium text-slate-900">${escapeHtml(material.name)}</div>
        <div class="mt-1 text-xs text-slate-500">${formatBytes(material.size)}</div>
        <div class="mt-3 break-all rounded bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">supporting-materials/${escapeHtml(material.relativePath)}</div>
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-3 text-xs font-semibold">
        <a class="text-blue-700 hover:text-blue-900" href="${materialUrl}" target="_blank" rel="noreferrer">Open</a>
        <a class="text-blue-700 hover:text-blue-900" href="${materialUrl}?download=1">Download</a>
        <form method="post" action="/tasks/${encodeURIComponent(task.id)}/materials/delete">
          <input name="relativePath" type="hidden" value="${escapeHtml(material.relativePath)}">
          <button class="font-semibold text-red-700 hover:text-red-900" type="submit">Remove</button>
        </form>
      </div>
    </div>
  </li>`;
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

function taskCreateMaterialsInput(): string {
  return `<div class="block rounded-lg border border-slate-200 bg-slate-50 p-3">
    <label class="block">
      <span class="text-sm font-semibold text-slate-800">Supporting materials</span>
      <input class="mt-2 block w-full text-sm text-slate-700" data-task-create-materials-input name="materials" type="file" multiple>
      <span class="mt-2 block text-xs text-slate-500">Optional. Select files before writing Reference so you can copy their generated paths.</span>
    </label>
    <div class="mt-3 hidden rounded-lg border border-slate-200 bg-white p-3" data-task-create-materials-preview>
      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference paths</div>
      <ul class="mt-2 space-y-1 text-xs text-slate-700" data-task-create-materials-list></ul>
      <p class="mt-2 text-xs text-slate-500">Copy these paths into Reference as needed.</p>
    </div>
  </div>`;
}

function taskCreateMaterialsScript(): string {
  return String.raw`<script>
(() => {
  const input = document.querySelector('[data-task-create-materials-input]');
  const preview = document.querySelector('[data-task-create-materials-preview]');
  const list = document.querySelector('[data-task-create-materials-list]');

  if (!input || !preview || !list) return;

  function sanitizeFileName(fileName) {
    const baseName = String(fileName || '').split(/[\\/]/).pop() || '';
    const sanitizedName = baseName
      .replace(/[\x00-\x1f\x80-\x9f]/g, '')
      .replace(/[<>:"\/\\|?*]+/g, '-')
      .replace(/\s+/g, ' ')
      .replace(/^-+|-+$/g, '')
      .replace(/^\.+/, '')
      .trim();

    return sanitizedName || 'material';
  }

  function extensionOf(fileName) {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.slice(lastDot) : '';
  }

  function uniqueFileName(fileName, usedNames) {
    const extension = extensionOf(fileName);
    const name = fileName.slice(0, fileName.length - extension.length) || 'material';
    let candidateName = fileName;
    let index = 1;

    while (usedNames.has(candidateName.toLowerCase())) {
      candidateName = name + '-' + index + extension;
      index += 1;
    }

    usedNames.add(candidateName.toLowerCase());
    return candidateName;
  }

  input.addEventListener('change', () => {
    const files = Array.from(input.files || []);
    const usedNames = new Set();

    list.innerHTML = '';
    preview.classList.toggle('hidden', files.length === 0);

    files.forEach((file) => {
      const materialPath = 'supporting-materials/' + uniqueFileName(sanitizeFileName(file.name), usedNames);
      const item = document.createElement('li');
      const code = document.createElement('code');

      code.className = 'rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-900';
      code.textContent = materialPath;
      item.appendChild(code);
      list.appendChild(item);
    });
  });
})();
</script>`;
}

function taskNameInput(value: string): string {
  return `<label class="block">
    <span class="text-sm font-semibold text-slate-800">Task name</span>
    <input class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" name="taskName" type="text" value="${escapeHtml(value)}" placeholder="add login page" required autofocus>
    <span class="mt-2 block text-xs text-slate-500">Used to generate the task folder name.</span>
  </label>`;
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
