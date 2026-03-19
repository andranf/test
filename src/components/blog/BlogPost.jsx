import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";

function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="post-h2">{line.slice(3)}</h2>
      );
    } else if (line.startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      i--;
      elements.push(
        <ul key={key++} className="post-list">
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: inlineBold(item) }} />
          ))}
        </ul>
      );
    } else if (line.trim() === "") {
      // skip blanks
    } else {
      elements.push(
        <p key={key++} className="post-p"
          dangerouslySetInnerHTML={{ __html: inlineBold(line) }}
        />
      );
    }
  }

  return elements;
}

function inlineBold(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export default function BlogPost({ post, onBack }) {
  const formatted = new Date(post.date).toLocaleDateString("en-AU", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="post-wrap"
    >
      <button onClick={onBack} className="post-back">
        <ArrowLeft size={14} /> All posts
      </button>

      <article className="post-article">
        {/* Category accent line */}
        <div className="post-accent-line" style={{ background: post.accentColor }} />

        <span className="post-cat" style={{ color: post.accentColor, borderColor: `${post.accentColor}30`, background: `${post.accentColor}0f` }}>
          {post.category}
        </span>

        <h1 className="post-title">{post.title}</h1>

        <div className="post-byline">
          <span><Calendar size={12} /> {formatted}</span>
          <span><Clock size={12} /> {post.readTime} read</span>
        </div>

        <div className="post-body">
          {renderMarkdown(post.content)}
        </div>

        <div className="post-tags">
          {post.tags.map(tag => (
            <span key={tag} className="post-tag">
              <Tag size={10} /> {tag}
            </span>
          ))}
        </div>
      </article>
    </motion.div>
  );
}
