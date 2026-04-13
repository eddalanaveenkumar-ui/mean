import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import blogPosts from './blogData';
import './StaticPages.css';

const categories = ['All', ...new Set(blogPosts.map(p => p.category))];

const categoryColors = {
  Education: '#34C759',
  Programming: '#0A84FF',
  Product: '#FF9F0A',
  Technology: '#5E5CE6',
  AI: '#BF5AF2',
  Design: '#FF375F',
};

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return blogPosts.filter(post => {
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="sp-page">
      <div className="sp-bg">
        <div className="sp-glow sp-glow-1" />
        <div className="sp-glow sp-glow-2" />
      </div>

      <nav className="sp-nav">
        <Link to="/" className="sp-nav-brand">
          <img src="/logo.png" alt="Mean AI" className="sp-nav-logo" />
          <span>Mean <span className="sp-accent">AI</span></span>
        </Link>
        <div className="sp-nav-links">
          <Link to="/about" className="sp-nav-link">About</Link>
          <Link to="/" className="sp-nav-link sp-nav-cta">← Back to Home</Link>
        </div>
      </nav>

      <main className="sp-content blog-content">
        <div className="sp-hero-badge">Blog</div>
        <h1 className="sp-title">Insights & <span className="sp-accent">Resources</span></h1>
        <p className="sp-subtitle">Tutorials, deep dives, and educational content from the Mean AI team.</p>

        {/* Search & Filters */}
        <div className="blog-controls">
          <div className="blog-search-wrap">
            <i className="fas fa-search blog-search-icon" />
            <input
              type="text"
              className="blog-search"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="blog-categories">
            {categories.map(cat => (
              <button
                key={cat}
                className={`blog-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Grid */}
        <div className="blog-grid">
          {filtered.map((post, i) => (
            <Link to={`/blog/${post.id}`} key={post.id} className="blog-card" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="blog-card-top">
                <span className="blog-card-cat" style={{ background: `${categoryColors[post.category] || '#5E5CE6'}20`, color: categoryColors[post.category] || '#5E5CE6' }}>
                  {post.category}
                </span>
                <span className="blog-card-time">{post.readTime}</span>
              </div>
              <h3 className="blog-card-title">{post.title}</h3>
              <p className="blog-card-excerpt">{post.excerpt}</p>
              <div className="blog-card-footer">
                <span className="blog-card-date">{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="blog-card-read">Read →</span>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="blog-empty">
            <i className="fas fa-search" />
            <p>No articles found matching your search.</p>
          </div>
        )}
      </main>

      <footer className="sp-footer">
        <div className="sp-footer-links">
          <Link to="/about">About</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/blog">Blog</Link>
        </div>
        <p>© {new Date().getFullYear()} Mean AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
