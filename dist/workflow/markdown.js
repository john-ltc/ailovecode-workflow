"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMarkdown = renderMarkdown;
const markdown_it_1 = __importDefault(require("markdown-it"));
const markdown = new markdown_it_1.default({
    html: false,
    linkify: true,
    typographer: true,
});
function renderMarkdown(content) {
    if (!content.trim()) {
        return "";
    }
    return markdown.render(content);
}
