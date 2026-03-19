import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter } from "lucide-react";
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
      <div className="blog-content">
        <BlogPost post={selectedPost} onBack={() => setSelectedPost(null)} />
      </div>
    );
  }

  return (
    <div className="blog-content">
      <div className="blog-index">

        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="blog-hero"
        >
          <h1 className="blog-hero-title">Writing</h1>
          <p className="blog-hero-sub">
            Turf management philosophy, agronomy, and observations from Australian greenkeeping.
          </p>
        </motion.div>

        {/* Search + Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="blog-filters"
        >
          <div className="blog-search-wrap">
            <Search size={13} className="blog-search-icon" />
            <input
              type="text"
              placeholder="Search posts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="blog-search-input"
            />
          </div>

          <div className="blog-cats">
            <Filter size={11} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
            {["All", ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`blog-cat-btn${activeCategory === cat ? " active" : ""}`}
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
          transition={{ delay: 0.2 }}
          className="blog-count"
        >
          {filtered.length} {filtered.length === 1 ? "post" : "posts"}
          {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
        </motion.p>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="blog-grid"
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
              className="blog-empty"
            >
              <p>No posts found</p>
              <span>Try a different search term or category.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
