import { motion } from "framer-motion";
import { Calendar, Clock, Tag, ArrowRight } from "lucide-react";

export default function BlogCard({ post, onClick, index = 0 }) {
  const formatted = new Date(post.date).toLocaleDateString("en-AU", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className="glass-card cursor-pointer overflow-hidden group"
    >
      {/* Accent bar */}
      <div className="card-accent" style={{ background: post.accentColor, opacity: 0.85 }} />

      <div className="p-6">
        {/* Category + read time */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
            style={{
              background: `${post.accentColor}18`,
              color: post.accentColor,
              border: `1px solid ${post.accentColor}30`,
            }}
          >
            {post.category}
          </span>
          <div className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Clock size={12} />
            <span className="text-xs">{post.readTime} read</span>
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-lg font-bold leading-snug mb-2 transition-colors duration-200"
          style={{ color: "rgba(255,255,255,0.92)" }}
        >
          {post.title}
        </h2>

        {/* Excerpt */}
        <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.52)" }}>
          {post.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Calendar size={12} />
            <span className="text-xs">{formatted}</span>
          </div>

          <motion.div
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: post.accentColor }}
            whileHover={{ x: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            Read more <ArrowRight size={13} />
          </motion.div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-white/[0.06]">
          {post.tags.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}
            >
              <Tag size={9} />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
