import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";

// Tables are wrapped in a scroll container so wide tables scroll inside the
// page instead of overflowing the viewport on mobile. The table stays a real
// semantic <table>.
const markdownComponents: Components = {
  table({ node: _node, ...props }) {
    return (
      <div className="markdown-table-wrapper">
        <table {...props} />
      </div>
    );
  },
};

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSlug]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
