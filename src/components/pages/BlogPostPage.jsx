import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import blogPosts from './blogData';
import './StaticPages.css';

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = blogPosts.find(p => p.id === slug);

  if (!post) return <Navigate to="/blog" replace />;

  // Find next and previous posts
  const idx = blogPosts.findIndex(p => p.id === slug);
  const prevPost = idx < blogPosts.length - 1 ? blogPosts[idx + 1] : null;
  const nextPost = idx > 0 ? blogPosts[idx - 1] : null;

  // Simple markdown-like renderer for content
  const renderContent = (text) => {
    return text.split('\n\n').map((block, i) => {
      if (block.startsWith('## ')) {
        return <h2 key={i} className="bp-h2">{block.replace('## ', '')}</h2>;
      }
      if (block.startsWith('### ')) {
        return <h3 key={i} className="bp-h3">{block.replace('### ', '')}</h3>;
      }
      if (block.startsWith('```')) {
        const lines = block.split('\n');
        const lang = lines[0].replace('```', '');
        const code = lines.slice(1, -1).join('\n');
        return (
          <pre key={i} className="bp-code-block">
            <div className="bp-code-lang">{lang}</div>
            <code>{code}</code>
          </pre>
        );
      }
      if (block.startsWith('- ') || block.startsWith('1. ')) {
        const items = block.split('\n').filter(l => l.trim());
        return (
          <ul key={i} className="bp-list">
            {items.map((item, j) => (
              <li key={j}>{item.replace(/^[-\d.]+\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code>$1</code>')}</li>
            ))}
          </ul>
        );
      }
      if (block.startsWith('|')) {
        const rows = block.split('\n').filter(r => !r.startsWith('|--'));
        return (
          <div key={i} className="bp-table-wrap">
            <table className="bp-table">
              <thead>
                <tr>{rows[0].split('|').filter(Boolean).map((cell, c) => <th key={c}>{cell.trim()}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, r) => (
                  <tr key={r}>{row.split('|').filter(Boolean).map((cell, c) => <td key={c}>{cell.trim()}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      // Inline code + bold
      const html = block
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bp-inline-code">$1</code>')
        .replace(/\n/g, '<br/>');
      return <p key={i} className="bp-paragraph" dangerouslySetInnerHTML={{ __html: html }} />;
    });
  };

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
          <Link to="/blog" className="sp-nav-link">← All Articles</Link>
        </div>
      </nav>

      <main className="sp-content blog-post-content">
        <article className="bp-article">
          <div className="bp-meta">
            <span className="bp-category">{post.category}</span>
            <span className="bp-date">{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span className="bp-read-time">{post.readTime} read</span>
          </div>

          <h1 className="bp-title">{post.title}</h1>
          <p className="bp-excerpt">{post.excerpt}</p>

          <div className="bp-divider" />

          <div className="bp-body">
            {renderContent(post.content)}
          </div>
        </article>

        {/* Navigation */}
        <div className="bp-nav-row">
          {prevPost ? (
            <Link to={`/blog/${prevPost.id}`} className="bp-nav-card bp-prev">
              <span className="bp-nav-label">← Previous</span>
              <span className="bp-nav-title">{prevPost.title}</span>
            </Link>
          ) : <div />}
          {nextPost ? (
            <Link to={`/blog/${nextPost.id}`} className="bp-nav-card bp-next">
              <span className="bp-nav-label">Next →</span>
              <span className="bp-nav-title">{nextPost.title}</span>
            </Link>
          ) : <div />}
        </div>
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
