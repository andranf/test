import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Filter } from "lucide-react";
import { blogPosts, categories } from "../../data/blogPosts";
import BlogCard from "./BlogCard";
import BlogPost from "./BlogPost";

export default function BlogPage() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = blogPosts.filter(post => {
    const matchesSearch =
      search.trim() === "" ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      post.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      activeCategory === "All" || post.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  if (selectedPost) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <BlogPost post={selectedPost} onBack={() => setSelectedPost(null)} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <BookOpen size={16} style={{ color: "rgba(52,211,153,0.7)" }} />
            <p className="text-xs font-bold tracking-[0.22em] uppercase" style={{ color: "rgba(52,211,153,0.65)" }}>
              Greenkeeping Journal
            </p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none ranfurlie-title mb-2">
            From the Shed
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
            Agronomy insights, course updates, and maintenance notes from Ranfurlie's grounds team.
          </p>
        </motion.div>

        {/* Search + Filter */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "rgba(255,255,255,0.3)" }}
            />
            <input
              type="text"
              placeholder="Search posts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "rgba(255,255,255,0.82)",
              }}
              onFocus={e => {
                e.target.style.borderColor = "rgba(52,211,153,0.4)";
                e.target.style.background = "rgba(255,255,255,0.09)";
              }}
              onBlur={e => {
                e.target.style.borderColor = "rgba(255,255,255,0.10)";
                e.target.style.background = "rgba(255,255,255,0.06)";
              }}
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
            {["All", ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200"
                style={
                  activeCategory === cat
                    ? { background: "rgba(52,211,153,0.18)", color: "#6ee7b7", border: "1px solid rgba(52,211,153,0.3)" }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Post count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-xs mb-5"
          style={{ color: "rgba(255,255,255,0.28)" }}
        >
          {filtered.length} {filtered.length === 1 ? "post" : "posts"}{activeCategory !== "All" ? ` in ${activeCategory}` : ""}
        </motion.p>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {filtered.map((post, i) => (
                <BlogCard
                  key={post.id}
                  post={post}
                  index={i}
                  onClick={() => setSelectedPost(post)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-12 text-center"
            >
              <p className="text-lg font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>No posts found</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.28)" }}>
                Try a different search term or category.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
