import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";

export default function BlogCard({ post, onClick, index = 0 }) {
  const formatted = new Date(post.date).toLocaleDateString("en-AU", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className="blog-card"
    >
      <div className="blog-card-accent" style={{ background: post.accentColor }} />
      <div className="blog-card-body">
        <div className="blog-card-meta-top">
          <span className="blog-card-cat" style={{ color: post.accentColor, borderColor: `${post.accentColor}30`, background: `${post.accentColor}10` }}>
            {post.category}
          </span>
          <div className="blog-card-readtime">
            <Clock size={11} />
            {post.readTime}
          </div>
        </div>

        <h2 className="blog-card-title">{post.title}</h2>
        <p className="blog-card-excerpt">{post.excerpt}</p>

        <div className="blog-card-footer">
          <div className="blog-card-date">
            <Calendar size={11} />
            {formatted}
          </div>
          <motion.span
            className="blog-card-read"
            style={{ color: post.accentColor }}
            whileHover={{ x: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            Read <ArrowRight size={12} />
          </motion.span>
        </div>
      </div>
    </motion.article>
  );
}
