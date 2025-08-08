export default class AuthorPages {
  data() {
    return {
      layout: "layouts/base.njk",
      pagination: {
        data: "authors",
        size: 1,
        alias: "authorKey"
      },
      permalink: data => `/authors/${data.authorKey}/`,
      eleventyComputed: {
        title: data => `${data.authors[data.authorKey].name} - Author Profile`,
        description: data => `Posts and profile for ${data.authors[data.authorKey].name}`
      }
    };
  }

  render(data) {
    const { authorKey, authors, collections } = data;
    const authorInfo = authors[authorKey];
    const authorPosts = collections.posts.filter(post => post.data.author === authorKey);
    const totalWords = authorPosts.length * 450;
    const totalReadingTime = Math.round(totalWords / 200);

    return `
<style>
.author-profile {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.author-header {
  text-align: center;
  padding: 3rem 1rem;
  background: var(--background-color);
  border: 2px solid var(--primary);
  border-radius: 16px;
  margin-bottom: 3rem;
  position: relative;
  overflow: hidden;
}

.author-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg,
    var(--primary)22 0%,
    transparent 50%,
    var(--primary)11 100%);
  pointer-events: none;
}

.author-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--primary);
  margin: 0 auto 1.5rem;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: var(--background-color);
  font-weight: bold;
  position: relative;
  z-index: 1;
}

.author-name {
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  color: var(--color);
  position: relative;
  z-index: 1;
}

.author-title {
  font-size: 1.2rem;
  color: var(--muted-color);
  margin: 0 0 1rem 0;
  position: relative;
  z-index: 1;
}

.author-bio {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--color);
  max-width: 600px;
  margin: 0 auto 2rem;
  position: relative;
  z-index: 1;
}

.author-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
  position: relative;
  z-index: 1;
}

.author-stat {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--primary);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.stat-number {
  display: block;
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 0.3rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--color);
  margin: 0;
}

.posts-section {
  margin-top: 3rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--primary);
}

.section-title {
  font-size: 2rem;
  margin: 0;
  color: var(--color);
}

.posts-count {
  background: var(--primary);
  color: var(--background-color);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: bold;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.post-card {
  background: var(--background-color);
  border: 1px solid var(--primary);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
  display: block;
}

.post-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  border-color: var(--color);
  text-decoration: none;
}

.post-card:hover * {
  color: inherit;
}

.post-title {
  font-size: 1.3rem;
  font-weight: bold;
  margin: 0 0 1rem 0;
  line-height: 1.3;
  color: var(--color);
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: var(--muted-color);
}

.post-date {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.post-tag {
  background: var(--primary);
  color: var(--background-color);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.post-tag:hover {
  opacity: 0.8;
}

.post-excerpt {
  color: var(--color);
  line-height: 1.5;
  opacity: 0.9;
}

.reading-time {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--muted-color);
  font-size: 0.85rem;
}

.author-navigation {
  margin-top: 3rem;
  text-align: center;
  padding: 2rem;
  background: var(--background-color);
  border: 1px solid var(--primary);
  border-radius: 12px;
}

.nav-title {
  font-size: 1.3rem;
  margin: 0 0 1.5rem 0;
  color: var(--color);
}

.author-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}

.author-link {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: var(--background-color);
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.author-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--muted-color);
}

.empty-state-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .author-profile {
    padding: 1rem;
  }

  .author-header {
    padding: 2rem 1rem;
  }

  .author-name {
    font-size: 2rem;
  }

  .author-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .author-links {
    flex-direction: column;
    align-items: center;
  }
}
</style>

<div class="author-profile">
  <div class="author-header">
    <div class="author-avatar">
      ${authorInfo.name.charAt(0).toUpperCase()}
    </div>
    <h1 class="author-name">${authorInfo.name}</h1>
    ${authorInfo.title ? `<p class="author-title">${authorInfo.title}</p>` : ''}
    ${authorInfo.bio ? `<div class="author-bio">${authorInfo.bio}</div>` : ''}

    <div class="author-stats">
      <div class="author-stat">
        <span class="stat-number">${authorPosts.length}</span>
        <p class="stat-label">Posts</p>
      </div>
      <div class="author-stat">
        <span class="stat-number">${totalWords.toLocaleString()}</span>
        <p class="stat-label">Words</p>
      </div>
      <div class="author-stat">
        <span class="stat-number">${totalReadingTime}</span>
        <p class="stat-label">Min Read</p>
      </div>
      <div class="author-stat">
        <span class="stat-number">${this.getAuthorTags(authorPosts).length}</span>
        <p class="stat-label">Topics</p>
      </div>
    </div>
  </div>

  ${authorPosts.length > 0 ? `
    <div class="posts-section">
      <div class="section-header">
        <h2 class="section-title">
          ${authorPosts.length === 1 ? 'Latest Post' : `Posts by ${authorInfo.name}`}
        </h2>
        <span class="posts-count">${authorPosts.length}</span>
      </div>

      <div class="posts-grid">
        ${authorPosts.map(post => `
          <a href="${post.url}" class="post-card">
            <h3 class="post-title">${post.data.title}</h3>

            <div class="post-meta">
              <span class="post-date">
                <span aria-hidden="true">📅</span>
                <time datetime="${this.formatDateString(post.data.date)}">
                  ${this.formatReadableDate(post.data.date)}
                </time>
              </span>
              <span class="reading-time">
                <span aria-hidden="true">⏱️</span>
                Estimated ${Math.round(450 / 200)} min read
              </span>
            </div>

            ${post.data.tags ? `
              <div class="post-tags">
                ${this.filterTagList(post.data.tags).slice(0, 4).map(tag =>
                  `<span class="post-tag">#${tag}</span>`
                ).join('')}
                ${this.filterTagList(post.data.tags).length > 4 ?
                  `<span class="post-tag">+${this.filterTagList(post.data.tags).length - 4} more</span>` : ''
                }
              </div>
            ` : ''}

            ${post.data.description ? `
              <p class="post-excerpt">${this.truncate(this.stripTags(post.data.description), 120)}</p>
            ` : ''}
          </a>
        `).join('')}
      </div>
    </div>
  ` : `
    <div class="empty-state">
      <div class="empty-state-icon">✍️</div>
      <h2>No posts yet</h2>
      <p>${authorInfo.name} hasn't published any posts yet, but stay tuned!</p>
    </div>
  `}

  <div class="author-navigation">
    <h3 class="nav-title">Explore More Authors</h3>
    <div class="author-links">
      <a href="/authors/" class="author-link">
        👥 All Authors
      </a>
      <a href="/blog/" class="author-link">
        📝 All Posts
      </a>
      <a href="/tags/" class="author-link">
        🏷️ Browse Tags
      </a>
    </div>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  // Add animation to post cards
  const postCards = document.querySelectorAll('.post-card');
  postCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';

    setTimeout(() => {
      card.style.transition = 'all 0.4s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
  });

  // Analytics tracking
  if (window.analytics) {
    window.analytics.track('author_profile_view', {
      author: '${authorKey}',
      post_count: ${authorPosts.length},
      total_words: ${totalWords}
    });
  }
});
</script>
    `;
  }

  // Helper methods
  filterTagList(tags) {
    return (tags || []).filter(tag => !['all', 'posts'].includes(tag));
  }

  getAuthorTags(posts) {
    const allTags = new Set();
    const excludeTags = new Set(['posts', 'blog', 'all']);

    posts.forEach(post => {
      const tags = post.data.tags || [];
      tags.forEach(tag => {
        if (!excludeTags.has(tag)) {
          allTags.add(tag);
        }
      });
    });

    return Array.from(allTags).sort();
  }

  formatDateString(date) {
    return new Date(date).toISOString().split('T')[0];
  }

  formatReadableDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  stripTags(content) {
    if (!content || typeof content !== 'string') return '';
    return content.replace(/<[^>]*>/g, '');
  }

  truncate(text, length = 100) {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  }
}
