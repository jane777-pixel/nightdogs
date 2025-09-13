// Newsletter template that auto-populates posts and processes editorial content
import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";

class NewsletterTemplate {
  data() {
    return {
      pagination: {
        data: "collections.newsletters",
        size: 1,
        alias: "newsletter"
      },
      permalink: "/admin/newsletter/{{ newsletter.data.title | slugify }}/",
      eleventyExcludeFromCollections: true
    };
  }

  async render(data) {
    const newsletter = data.newsletter;
    const frontmatter = newsletter.data;

    // Get all blog posts if auto-populate is enabled
    let monthlyPosts = [];
    if (frontmatter.autoPopulate) {
      monthlyPosts = await this.getMonthlyPosts(frontmatter.month, frontmatter.year, frontmatter.excludeAuthors || []);
    }

    // Combine auto-populated and featured posts
    const allPosts = this.combinePosts(monthlyPosts, frontmatter.featuredPosts || []);

    // Generate HTML content
    const htmlContent = this.generateNewsletterHtml({
      title: frontmatter.title,
      subject: frontmatter.subject,
      introduction: frontmatter.introduction,
      posts: allPosts,
      editorialSections: frontmatter.editorialSections || [],
      closingMessage: frontmatter.closingMessage,
      month: frontmatter.month,
      year: frontmatter.year
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Preview: ${frontmatter.title}</title>
  <style>
    .newsletter-controls {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #1a1a2e;
      color: white;
      padding: 15px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
    }
    .newsletter-controls h3 {
      margin: 0 0 10px 0;
      color: #ffd700;
    }
    .newsletter-controls .status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-right: 10px;
    }
    .status.draft { background: #6c757d; }
    .status.ready { background: #28a745; }
    .status.sent { background: #dc3545; }
    .newsletter-controls button {
      background: #ffd700;
      color: #1a1a2e;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      margin-right: 10px;
    }
    .newsletter-controls button:hover {
      background: #ffed4e;
    }
    .newsletter-controls button:disabled {
      background: #ccc;
      color: #666;
      cursor: not-allowed;
    }
    .newsletter-preview {
      margin-top: 80px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .newsletter-meta {
      background: #f8f9fa;
      padding: 20px;
      border-bottom: 2px solid #ffd700;
    }
    .newsletter-meta h4 {
      margin: 0 0 10px 0;
      color: #1a1a2e;
    }
    .newsletter-meta p {
      margin: 5px 0;
      color: #666;
    }
  </style>
</head>
<body>
  <!-- Newsletter Controls -->
  <div class="newsletter-controls">
    <h3>📧 Newsletter Preview: ${frontmatter.title}</h3>
    <span class="status ${frontmatter.status}">${frontmatter.status.toUpperCase()}</span>
    <button onclick="sendTestEmail()" ${frontmatter.status !== 'ready' ? 'disabled' : ''}>
      📧 Send Test Email
    </button>
    <button onclick="sendToAllSubscribers()" ${frontmatter.status !== 'ready' ? 'disabled' : ''}>
      📢 Send to All Subscribers
    </button>
    <button onclick="refreshPreview()">🔄 Refresh</button>
    <button onclick="exportHtml()">💾 Export HTML</button>
  </div>

  <!-- Newsletter Metadata -->
  <div class="newsletter-meta">
    <h4>Newsletter Information</h4>
    <p><strong>Subject:</strong> ${frontmatter.subject}</p>
    <p><strong>Month/Year:</strong> ${frontmatter.month} ${frontmatter.year}</p>
    <p><strong>Posts Included:</strong> ${allPosts.length}</p>
    <p><strong>Status:</strong> ${frontmatter.status}</p>
    ${frontmatter.sendNotes ? `<p><strong>Send Notes:</strong> ${frontmatter.sendNotes}</p>` : ''}
  </div>

  <!-- Newsletter Preview -->
  <div class="newsletter-preview">
    ${htmlContent}
  </div>

  <script>
    const newsletterSlug = '${frontmatter.title}'.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    async function sendTestEmail() {
      const email = prompt('Enter test email address:');
      if (!email) return;

      try {
        const response = await fetch('/.netlify/functions/send-newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newsletter: '${newsletter.fileSlug}',
            testEmail: email
          })
        });

        const result = await response.json();
        alert(response.ok ? 'Test email sent!' : 'Error: ' + result.message);
      } catch (error) {
        alert('Error sending test email: ' + error.message);
      }
    }

    async function sendToAllSubscribers() {
      if (!confirm('Send newsletter to all subscribers? This cannot be undone.')) return;

      try {
        const response = await fetch('/.netlify/functions/send-newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newsletter: '${newsletter.fileSlug}',
            sendToAll: true
          })
        });

        const result = await response.json();
        alert(response.ok ? 'Newsletter sent to all subscribers!' : 'Error: ' + result.message);

        if (response.ok) {
          // Refresh to update status
          window.location.reload();
        }
      } catch (error) {
        alert('Error sending newsletter: ' + error.message);
      }
    }

    function refreshPreview() {
      window.location.reload();
    }

    function exportHtml() {
      const htmlContent = document.querySelector('.newsletter-preview').innerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '${frontmatter.title.replace(/[^a-z0-9]/gi, '-')}-newsletter.html';
      a.click();
      URL.revokeObjectURL(url);
    }
  </script>
</body>
</html>
    `;
  }

  async getMonthlyPosts(monthName, year, excludeAuthors = []) {
    const posts = [];
    const monthIndex = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ].indexOf(monthName);

    if (monthIndex === -1) return [];

    try {
      const contentDir = path.join(process.cwd(), "content", "blog");
      const authorDirs = await fs.readdir(contentDir, { withFileTypes: true });

      for (const authorDir of authorDirs) {
        if (!authorDir.isDirectory() || excludeAuthors.includes(authorDir.name)) continue;

        const authorPath = path.join(contentDir, authorDir.name);
        const yearDirs = await fs.readdir(authorPath, { withFileTypes: true });

        for (const yearDir of yearDirs) {
          if (!yearDir.isDirectory()) continue;

          const yearPath = path.join(authorPath, yearDir.name);
          const postDirs = await fs.readdir(yearPath, { withFileTypes: true });

          for (const postDir of postDirs) {
            if (!postDir.isDirectory()) continue;

            const postPath = path.join(yearPath, postDir.name);
            const indexFile = path.join(postPath, "index.md");

            try {
              const fileContent = await fs.readFile(indexFile, "utf-8");
              const parsed = matter(fileContent);
              const frontmatter = parsed.data;

              let postDate;
              if (frontmatter.date) {
                postDate = new Date(frontmatter.date);
              } else {
                const dateMatch = postDir.name.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (dateMatch) {
                  postDate = new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3]);
                } else {
                  continue;
                }
              }

              if (postDate.getMonth() === monthIndex && postDate.getFullYear() === year) {
                let contentPreview = "";
                if (parsed.content) {
                  contentPreview = parsed.content
                    .replace(/[#*_`\[\]]/g, "")
                    .replace(/\n\s*\n/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .substring(0, 300);
                  if (contentPreview.length === 300) {
                    contentPreview += "...";
                  }
                }

                posts.push({
                  title: frontmatter.title || "Untitled",
                  author: frontmatter.author || authorDir.name,
                  date: postDate,
                  url: `/blog/${authorDir.name}/${yearDir.name}/${postDir.name}/`,
                  description: frontmatter.description || parsed.excerpt || contentPreview || "Click to read this post.",
                  preview: contentPreview,
                  tags: frontmatter.tags || [],
                  slug: postDir.name,
                });
              }
            } catch (error) {
              console.warn(`Error reading post ${indexFile}:`, error.message);
              continue;
            }
          }
        }
      }

      posts.sort((a, b) => b.date - a.date);
      return posts;
    } catch (error) {
      console.error("Error fetching monthly posts:", error);
      return [];
    }
  }

  combinePosts(monthlyPosts, featuredPosts) {
    const combined = [...monthlyPosts];

    // Add featured posts that aren't already included
    featuredPosts.forEach(featured => {
      const exists = combined.find(post =>
        post.url === featured.url ||
        (post.title === featured.title && post.author === featured.author)
      );

      if (!exists) {
        combined.push({
          title: featured.title,
          author: featured.author,
          url: featured.url,
          description: featured.description || "Featured post",
          featured: true
        });
      }
    });

    return combined;
  }

  generateNewsletterHtml({ title, subject, introduction, posts, editorialSections, closingMessage, month, year }) {
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Group posts by author
    const postsByAuthor = this.groupPostsByAuthor(posts);

    // Author theme colors
    const authorThemes = {
      jane: { background: "#ffd6e0", primary: "#b8002e", color: "#8b0020" },
      orionlw: { background: "#1a1a1a", primary: "#00ff00", color: "#ffffff" },
      adesse: { background: "#2c1810", primary: "#d4af37", color: "#f5f5dc" },
      nic: { background: "#f0f8ff", primary: "#4169e1", color: "#191970" },
      amelia: { background: "#f5f5dc", primary: "#8b4513", color: "#654321" },
      abby: { background: "#e6e6fa", primary: "#9370db", color: "#4b0082" },
      ewan: { background: "#f0fff0", primary: "#228b22", color: "#006400" },
    };

    // Convert markdown to HTML for introduction and closing
    const marked = (text) => {
      if (!text) return '';
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    };

    // Generate editorial sections
    const editorialSectionsHtml = editorialSections.map(section => `
      <div style="background: #f8f9fa; border-left: 4px solid #ffd700; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
        <h3 style="margin-top: 0; color: #1a1a2e; font-size: 1.3em;">${section.title}</h3>
        <div style="color: #333; line-height: 1.6;">
          <p>${marked(section.content)}</p>
        </div>
      </div>
    `).join('');

    // Generate author sections with editorial insertions
    let authorSectionsHtml = '';
    const sectionsByInsertPoint = {};

    editorialSections.forEach(section => {
      if (!sectionsByInsertPoint[section.insertAfter]) {
        sectionsByInsertPoint[section.insertAfter] = [];
      }
      sectionsByInsertPoint[section.insertAfter].push(section);
    });

    // Add beginning sections
    if (sectionsByInsertPoint.beginning) {
      sectionsByInsertPoint.beginning.forEach(section => {
        authorSectionsHtml += `
          <div style="background: #f8f9fa; border-left: 4px solid #ffd700; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <h3 style="margin-top: 0; color: #1a1a2e; font-size: 1.3em;">${section.title}</h3>
            <div style="color: #333; line-height: 1.6;">
              <p>${marked(section.content)}</p>
            </div>
          </div>
        `;
      });
    }

    Object.entries(postsByAuthor).forEach(([authorKey, authorData]) => {
      const theme = authorThemes[authorKey] || authorThemes.jane;
      const postsHtml = authorData.posts
        .map(post => `
          <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 15px; border-left: 4px solid ${theme.primary}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h4 style="margin-top: 0; color: ${theme.color}; font-size: 1.2em;">
              <a href="https://nightdogs.xyz${post.url}" style="color: ${theme.color}; text-decoration: none;">${post.title}</a>
              ${post.featured ? ' <span style="background: #ffd700; color: #1a1a2e; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">FEATURED</span>' : ''}
            </h4>
            ${post.date ? `<p style="color: #666; margin-bottom: 5px; font-size: 12px;">
              ${post.date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </p>` : ''}
            ${post.description ? `<p style="margin-bottom: 15px; line-height: 1.6; color: #333; font-size: 14px;">${post.description}</p>` : ''}
            <a href="https://nightdogs.xyz${post.url}" style="color: ${theme.primary}; font-weight: bold; text-decoration: none; border-bottom: 2px solid ${theme.primary}; padding-bottom: 1px;">
              Read full post →
            </a>
          </div>
        `)
        .join("");

      authorSectionsHtml += `
        <div style="margin-bottom: 40px;">
          <div style="background: linear-gradient(135deg, ${theme.background}, ${theme.primary}); color: ${theme.color}; padding: 20px; border-radius: 12px 12px 0 0; margin-bottom: 0;">
            <h3 style="margin: 0; font-size: 1.4em; color: ${theme.color};">
              ${authorData.name}'s Posts
            </h3>
            <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">
              ${authorData.posts.length} post${authorData.posts.length !== 1 ? "s" : ""} this month
            </p>
          </div>
          <div style="border: 2px solid ${theme.primary}; border-top: none; border-radius: 0 0 12px 12px; padding: 20px; background: #fafafa;">
            ${postsHtml}
          </div>
        </div>
      `;

      // Add editorial sections after this author
      if (sectionsByInsertPoint[authorKey]) {
        sectionsByInsertPoint[authorKey].forEach(section => {
          authorSectionsHtml += `
            <div style="background: #f8f9fa; border-left: 4px solid #ffd700; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
              <h3 style="margin-top: 0; color: #1a1a2e; font-size: 1.3em;">${section.title}</h3>
              <div style="color: #333; line-height: 1.6;">
                <p>${marked(section.content)}</p>
              </div>
            </div>
          `;
        });
      }
    });

    // Add end sections
    if (sectionsByInsertPoint.end) {
      sectionsByInsertPoint.end.forEach(section => {
        authorSectionsHtml += `
          <div style="background: #f8f9fa; border-left: 4px solid #ffd700; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <h3 style="margin-top: 0; color: #1a1a2e; font-size: 1.3em;">${section.title}</h3>
            <div style="color: #333; line-height: 1.6;">
              <p>${marked(section.content)}</p>
            </div>
          </div>
        `;
      });
    }

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #ffd700;">${title}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">${currentDate}</p>
        </div>

        <!-- Main Content -->
        <div style="max-width: 600px; margin: 0 auto; padding: 30px 20px; background: white;">
          <!-- Introduction -->
          ${introduction ? `
            <div style="margin-bottom: 30px;">
              <p>${marked(introduction)}</p>
            </div>
          ` : ''}

          <!-- Author Sections -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1a1a2e; border-bottom: 2px solid #ffd700; padding-bottom: 10px;">This Month's Posts</h2>
            ${authorSectionsHtml}
          </div>

          <!-- Closing Message -->
          ${closingMessage ? `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #1a1a2e;">
              <p style="margin-bottom: 0; font-style: italic;">${marked(closingMessage)}</p>
            </div>
          ` : ''}

          <!-- Call to Action -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="https://nightdogs.xyz" style="background: #ffd700; color: #1a1a2e; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              Visit nightdogs.xyz
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #1a1a2e; color: white; padding: 30px 20px; text-align: center;">
          <div style="margin: 20px 0;">
            <a href="https://nightdogs.xyz" style="color: #ffd700; text-decoration: none; margin: 0 15px;">nightdogs.xyz</a>
            <a href="https://nightdogs.xyz/explore/" style="color: #ffd700; text-decoration: none; margin: 0 15px;">Browse All Posts</a>
            <a href="{{unsubscribe_url}}" style="color: #ccc; text-decoration: none; margin: 0 15px;">Unsubscribe</a>
          </div>
          <p style="font-size: 14px; opacity: 0.7; margin-bottom: 0;">
            Monthly digest from the nightdogs pack 🐕
          </p>
        </div>
      </div>
    `;
  }

  groupPostsByAuthor(posts) {
    const grouped = {};
    const authorNames = {
      jane: "Jane",
      orionlw: "Orion",
      adesse: "Adèsse",
      nic: "Nic",
      amelia: "Amelia",
      abby: "Abby",
      ewan: "Ewan",
    };

    posts.forEach((post) => {
      const authorKey = post.author;
      const authorName = authorNames[authorKey] || authorKey;

      if (!grouped[authorKey]) {
        grouped[authorKey] = {
          name: authorName,
          posts: [],
        };
      }

      grouped[authorKey].posts.push(post);
    });

    return grouped;
  }
}

export default NewsletterTemplate;
