---
title: "Newsletter Digest Test"
description: "Test page for manual newsletter digest generation"
permalink: /admin/newsletter-test/
eleventyExcludeFromCollections: true
---

<style>
.test-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.test-section {
  margin: 2rem 0;
  padding: 1.5rem;
  border: 2px solid #1a1a2e;
  border-radius: 8px;
  background: #f8f9fa;
}

.test-section h3 {
  margin-top: 0;
  color: #1a1a2e;
}

.form-group {
  margin: 1rem 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #1a1a2e;
}

.form-group input, .form-group select {
  width: 100%;
  max-width: 400px;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  margin: 0.5rem 0.5rem 0.5rem 0;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #ffd700;
  color: #1a1a2e;
}

.btn-primary:hover {
  background: #ffed4e;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.result {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 8px;
  font-family: monospace;
  white-space: pre-wrap;
  max-height: 500px;
  overflow-y: auto;
}

.result.success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.result.error {
  background: #f8d7da;
  border: 1px solid #f1b0b7;
  color: #721c24;
}

.result.info {
  background: #e3f2fd;
  border: 1px solid #64b5f6;
  color: #1565c0;
}

.loading {
  opacity: 0.7;
  pointer-events: none;
}

.loading::after {
  content: " ...";
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.stat-card {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #ddd;
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #1a1a2e;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

.post-list {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
}

.post-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.post-item:last-child {
  border-bottom: none;
}

.post-title {
  font-weight: 600;
  color: #1a1a2e;
}

.post-meta {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.25rem;
}
</style>

<div class="test-container">
  <h1>🫘 Newsletter Digest Test</h1>
  <p>Test the automated monthly digest system. This replaces the manual admin panels with a fully automated monthly newsletter that generates and sends on the last Sunday of each month.</p>

  <!-- Test Options -->
  <div class="test-section">
    <h3>Test Options</h3>
    
    <div class="form-group">
      <label for="test-email">Test Email (optional)</label>
      <input type="email" id="test-email" placeholder="your@email.com">
      <small>If provided, digest will only be sent to this email address</small>
    </div>

    <div class="form-group">
      <label for="month-option">Month to Generate</label>
      <select id="month-option">
        <option value="current">Current Month</option>
        <option value="previous">Previous Month</option>
      </select>
    </div>

    <div>
      <button class="btn btn-primary" id="preview-btn">👀 Preview Digest</button>
      <button class="btn btn-secondary" id="test-btn">📧 Send Test</button>
      <button class="btn btn-danger" id="send-all-btn">📢 Send to All Subscribers</button>
    </div>

    <p><small><strong>Note:</strong> Preview mode shows what would be sent without actually sending emails.</small></p>
  </div>

  <!-- Results -->
  <div id="results" style="display: none;">
    <div class="test-section">
      <h3>Results</h3>
      <div id="result-content" class="result"></div>
      
      <div id="stats-section" style="display: none;">
        <h4>Statistics</h4>
        <div id="stats-grid" class="stats-grid"></div>
      </div>

      <div id="posts-section" style="display: none;">
        <h4>Posts Included</h4>
        <div id="post-list" class="post-list"></div>
      </div>
    </div>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  console.log('Newsletter digest test page loaded');
  
  let isLoading = false;

  // Button event listeners
  document.getElementById('preview-btn').addEventListener('click', previewDigest);
  document.getElementById('test-btn').addEventListener('click', sendTestDigest);
  document.getElementById('send-all-btn').addEventListener('click', sendToAllSubscribers);

  async function previewDigest() {
    if (isLoading) return;
    
    const monthOption = document.getElementById('month-option').value;
    const includePrevious = monthOption === 'previous';
    
    await callDigestFunction({
      include_previous_month: includePrevious
    }, 'Preview');
  }

  async function sendTestDigest() {
    if (isLoading) return;
    
    const testEmail = document.getElementById('test-email').value;
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }
    
    const monthOption = document.getElementById('month-option').value;
    const includePrevious = monthOption === 'previous';
    
    await callDigestFunction({
      test_email: testEmail,
      include_previous_month: includePrevious
    }, 'Test Send');
  }

  async function sendToAllSubscribers() {
    if (isLoading) return;
    
    if (!confirm('This will send the digest to ALL newsletter subscribers. Are you sure?')) {
      return;
    }
    
    const monthOption = document.getElementById('month-option').value;
    const includePrevious = monthOption === 'previous';
    
    await callDigestFunction({
      force_send: 'true',
      include_previous_month: includePrevious
    }, 'Send to All');
  }

  async function callDigestFunction(params, actionName) {
    isLoading = true;
    
    // Show loading state
    const resultDiv = document.getElementById('result-content');
    const resultsSection = document.getElementById('results');
    
    resultDiv.className = 'result info loading';
    resultDiv.textContent = actionName + ' in progress';
    resultsSection.style.display = 'block';
    
    try {
      // Build query string
      const queryParams = new URLSearchParams(params).toString();
      const url = '/.netlify/functions/trigger-monthly-digest?' + queryParams;
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Show results
      resultDiv.className = response.ok ? 'result success' : 'result error';
      resultDiv.textContent = JSON.stringify(data, null, 2);
      
      // Show statistics if available
      if (data.stats) {
        showStats(data.stats);
      }
      
      // Show posts if available
      if (data.posts && data.posts.length > 0) {
        showPosts(data.posts);
      }
      
    } catch (error) {
      resultDiv.className = 'result error';
      resultDiv.textContent = 'Error: ' + error.message;
    } finally {
      isLoading = false;
      resultDiv.classList.remove('loading');
    }
  }

  function showStats(stats) {
    const statsSection = document.getElementById('stats-section');
    const statsGrid = document.getElementById('stats-grid');
    
    statsGrid.innerHTML = 
      '<div class="stat-card">' +
        '<div class="stat-number">' + (stats.postsIncluded || 0) + '</div>' +
        '<div class="stat-label">Posts Included</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-number">' + (stats.authorsIncluded || 0) + '</div>' +
        '<div class="stat-label">Authors Featured</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-number">' + (stats.subscribersFound || 0) + '</div>' +
        '<div class="stat-label">Subscribers</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-number">' + (stats.emailsSent || 0) + '</div>' +
        '<div class="stat-label">Emails Sent</div>' +
      '</div>';
    
    statsSection.style.display = 'block';
  }

  function showPosts(posts) {
    const postsSection = document.getElementById('posts-section');
    const postList = document.getElementById('post-list');
    
    const postsHtml = posts.map(function(post) {
      return '<div class="post-item">' +
        '<div class="post-title">' + post.title + '</div>' +
        '<div class="post-meta">' +
          'by ' + post.author + ' • ' + post.date + ' • ' +
          '<a href="https://nightdogs.xyz' + post.url + '" target="_blank">View Post</a>' +
        '</div>' +
      '</div>';
    }).join('');
    
    postList.innerHTML = postsHtml;
    postsSection.style.display = 'block';
  }
});
</script>