import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

export function renderMarkdown(content: string): string {
  if (!content.trim()) {
    return "";
  }

  return markdown.render(content);
}
