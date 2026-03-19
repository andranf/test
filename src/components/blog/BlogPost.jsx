import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Tag, User } from "lucide-react";

function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-xl font-bold mt-8 mb-3" style={{ color: "rgba(255,255,255,0.9)" }}>
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={key++} className="font-semibold mt-4 mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>
          {line.slice(2, -2)}
        </p>
      );
    } else if (line.startsWith("- ")) {
      // Collect consecutive list items
      const items = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      i--; // step back since loop will increment
      elements.push(
        <ul key={key++} className="ml-4 mt-2 mb-4 space-y-1.5">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.62)" }}>
              <span style={{ color: "rgba(52,211,153,0.7)", marginTop: "0.35em" }}>▸</span>
              <span dangerouslySetInnerHTML={{ __html: inlineBold(item) }} />
            </li>
          ))}
        </ul>
      );
    } else if (line.trim() === "") {
      // skip blank lines between block elements
    } else {
      elements.push(
        <p key={key++} className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.62)" }}
          dangerouslySetInnerHTML={{ __html: inlineBold(line) }}
        />
      );
    }
  }

  return elements;
}

function inlineBold(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong style="color:rgba(255,255,255,0.88);font-weight:600">$1</strong>');
}

export default function BlogPost({ post, onBack }) {
  const formatted = new Date(post.date).toLocaleDateString("en-AU", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="max-w-3xl mx-auto"
    >
      {/* Back button */}
      <motion.button
        onClick={onBack}
        className="flex items-center gap-2 mb-8 text-sm font-medium transition-colors duration-200"
        style={{ color: "rgba(255,255,255,0.45)" }}
        whileHover={{ x: -3 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <ArrowLeft size={16} />
        Back to Blog
      </motion.button>

      {/* Post card */}
      <article className="glass-card overflow-hidden">
        {/* Accent bar */}
        <div className="card-accent" style={{ background: post.accentColor, opacity: 0.85 }} />

        <div className="p-8 md:p-10">
          {/* Category */}
          <span
            className="inline-block text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full mb-5"
            style={{
              background: `${post.accentColor}18`,
              color: post.accentColor,
              border: `1px solid ${post.accentColor}30`,
            }}
          >
            {post.category}
          </span>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-black leading-tight mb-5"
            style={{ color: "rgba(255,255,255,0.93)" }}>
            {post.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-white/[0.07]">
            <div className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              <User size={13} />
              <span className="text-xs">{post.author}</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              <Calendar size={13} />
              <span className="text-xs">{formatted}</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              <Clock size={13} />
              <span className="text-xs">{post.readTime} read</span>
            </div>
          </div>

          {/* Body */}
          <div className="prose-blog">
            {renderMarkdown(post.content)}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-white/[0.07]">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </motion.div>
  );
}
