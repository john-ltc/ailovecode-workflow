"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTaskSections = parseTaskSections;
exports.buildTaskMarkdown = buildTaskMarkdown;
exports.updateTaskSections = updateTaskSections;
const sectionNames = ["Context", "Request", "Reference"];
function normalizeSectionTitle(title) {
    return title.trim().toLowerCase();
}
function toTaskSectionName(title) {
    const normalized = normalizeSectionTitle(title);
    return sectionNames.find((sectionName) => sectionName.toLowerCase() === normalized);
}
function findH2Sections(content) {
    const matches = [];
    const h2Regex = /^##\s+(.+?)\s*$/gm;
    let match;
    while ((match = h2Regex.exec(content)) !== null) {
        matches.push({
            title: match[1],
            headingStart: match.index,
            headingEnd: h2Regex.lastIndex,
        });
    }
    return matches;
}
function normalizeSectionBody(body) {
    return body.replace(/^\r?\n/, "").trim();
}
function formatSectionBody(value) {
    const trimmedValue = value.trimEnd();
    return trimmedValue ? `\n\n${trimmedValue}\n` : "\n\n";
}
function parseTaskSections(content) {
    const sections = {
        Context: "",
        Request: "",
        Reference: "",
    };
    const matches = findH2Sections(content);
    for (let index = 0; index < matches.length; index += 1) {
        const match = matches[index];
        const sectionName = toTaskSectionName(match.title);
        if (!sectionName)
            continue;
        const nextMatch = matches[index + 1];
        const bodyEnd = nextMatch ? nextMatch.headingStart : content.length;
        const body = content.slice(match.headingEnd, bodyEnd);
        sections[sectionName] = normalizeSectionBody(body);
    }
    return sections;
}
function buildTaskMarkdown(sections) {
    return sectionNames
        .map((sectionName) => `## ${sectionName}${formatSectionBody(sections[sectionName])}`)
        .join("\n");
}
function updateTaskSections(content, sections) {
    const matches = findH2Sections(content);
    if (matches.length === 0) {
        return buildTaskMarkdown(sections);
    }
    const existingSections = new Set();
    let updatedContent = content.slice(0, matches[0].headingStart);
    for (let index = 0; index < matches.length; index += 1) {
        const match = matches[index];
        const nextMatch = matches[index + 1];
        const bodyEnd = nextMatch ? nextMatch.headingStart : content.length;
        const sectionName = toTaskSectionName(match.title);
        updatedContent += content.slice(match.headingStart, match.headingEnd);
        if (sectionName) {
            updatedContent += formatSectionBody(sections[sectionName]);
            existingSections.add(sectionName);
        }
        else {
            updatedContent += content.slice(match.headingEnd, bodyEnd);
        }
    }
    const missingSections = sectionNames.filter((sectionName) => !existingSections.has(sectionName));
    if (missingSections.length > 0) {
        updatedContent = updatedContent.trimEnd() + "\n\n";
        updatedContent += missingSections
            .map((sectionName) => `## ${sectionName}${formatSectionBody(sections[sectionName])}`)
            .join("\n");
    }
    if (!updatedContent.endsWith("\n")) {
        updatedContent += "\n";
    }
    return updatedContent;
}
