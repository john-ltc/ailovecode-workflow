"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeHtml = escapeHtml;
exports.renderDashboard = renderDashboard;
exports.renderTaskList = renderTaskList;
exports.renderTaskDetail = renderTaskDetail;
exports.renderTaskEdit = renderTaskEdit;
exports.renderGuidelines = renderGuidelines;
exports.renderErrorPage = renderErrorPage;
const tasks_1 = require("../workflow/tasks");
function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
function encodePathSegments(relativePath) {
    return relativePath.split("/").map(encodeURIComponent).join("/");
}
function pageLayout(title, body) {
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
function card(content, extraClasses = "") {
    return `<section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${extraClasses}">${content}</section>`;
}
function emptyState(message) {
    return `<p class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">${escapeHtml(message)}</p>`;
}
function markdownBlock(renderedHtml) {
    if (!renderedHtml.trim()) {
        return emptyState("No content yet.");
    }
    return `<div class="prose-like">${renderedHtml}</div>`;
}
function taskListItems(tasks, limit) {
    const visibleTasks = typeof limit === "number" ? tasks.slice(0, limit) : tasks;
    if (visibleTasks.length === 0) {
        return emptyState("No tasks found.");
    }
    return `<div class="divide-y divide-slate-200 rounded-lg border border-slate-200">
    ${visibleTasks
        .map((task) => `<a class="block bg-white px-4 py-3 hover:bg-slate-50" href="/tasks/${encodeURIComponent(task.id)}">
          <div class="font-medium text-slate-950">${escapeHtml(task.name)}</div>
          <div class="mt-1 text-xs text-slate-500">${escapeHtml(task.id)} · ${escapeHtml(task.createdLabel)}</div>
        </a>`)
        .join("")}
  </div>`;
}
function renderDashboard(workflowInfo, tasks) {
    return pageLayout("Dashboard", `<div class="space-y-6">
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
        ${card(`<div class="mb-4 flex items-center justify-between"><h2 class="text-lg font-semibold text-slate-950">Recent Tasks</h2><a class="text-sm font-medium text-blue-700 hover:text-blue-900" href="/tasks">View all</a></div>${taskListItems(tasks, 5)}`)}
        ${card(`<h2 class="text-lg font-semibold text-slate-950">Quick Links</h2><div class="mt-4 grid gap-3"><a class="rounded-lg bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-800" href="/tasks">Open Task List</a><a class="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/guidelines">View Guidelines</a></div>`)}
      </div>
    </div>`);
}
function renderTaskList(tasks) {
    return pageLayout("Tasks", `<div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-950">Tasks</h1>
        <p class="mt-2 text-slate-600">Tasks are loaded from <span class="font-mono">workflow/tasks/</span>.</p>
      </div>
      ${card(taskListItems(tasks))}
    </div>`);
}
function renderTaskDetail(options) {
    const { task, sections, implementationPlanHtml, materials, saved } = options;
    return pageLayout(task.name, `<div class="space-y-6">
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
    </div>`);
}
function renderMaterialsCard(task, materials) {
    if (materials.length === 0) {
        return card(`<h2 class="text-base font-semibold text-slate-950">Supporting Materials</h2><div class="mt-3">${emptyState("No supporting materials found.")}</div>`);
    }
    return card(`<h2 class="text-base font-semibold text-slate-950">Supporting Materials</h2><ul class="mt-3 space-y-3 text-sm">
    ${materials
        .map((material) => {
        const materialUrl = `/tasks/${encodeURIComponent(task.id)}/materials/${encodePathSegments(material.relativePath)}`;
        return `<li class="rounded-lg border border-slate-200 p-3">
          <div class="break-all font-medium text-slate-900">${escapeHtml(material.relativePath)}</div>
          <div class="mt-1 text-xs text-slate-500">${(0, tasks_1.formatBytes)(material.size)}</div>
          <div class="mt-2 flex gap-3 text-xs font-semibold">
            <a class="text-blue-700 hover:text-blue-900" href="${materialUrl}" target="_blank" rel="noreferrer">Open</a>
            <a class="text-blue-700 hover:text-blue-900" href="${materialUrl}?download=1">Download</a>
          </div>
        </li>`;
    })
        .join("")}
  </ul>`);
}
function renderTaskEdit(options) {
    const { task, sections } = options;
    return pageLayout(`Edit ${task.name}`, `<div class="space-y-6">
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
    </div>`);
}
function sectionTextarea(sectionName, value) {
    return `<label class="block">
    <span class="text-sm font-semibold text-slate-800">${escapeHtml(sectionName)}</span>
    <textarea class="mt-2 min-h-40 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" name="${escapeHtml(sectionName)}">${escapeHtml(value)}</textarea>
  </label>`;
}
function renderGuidelines(guidelinesHtml) {
    return pageLayout("Guidelines", `<div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-950">Guidelines</h1>
        <p class="mt-2 text-slate-600">Rendered from <span class="font-mono">workflow/guidelines.md</span>.</p>
      </div>
      ${card(markdownBlock(guidelinesHtml))}
    </div>`);
}
function renderErrorPage(status, message) {
    return pageLayout(`Error ${status}`, `<div class="mx-auto max-w-2xl">${card(`<p class="text-sm font-medium uppercase tracking-wide text-red-700">Error ${status}</p><h1 class="mt-2 text-2xl font-bold text-slate-950">${escapeHtml(message)}</h1><p class="mt-4"><a class="text-sm font-semibold text-blue-700 hover:text-blue-900" href="/">Go to dashboard</a></p>`)}</div>`);
}
