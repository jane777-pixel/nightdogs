---
title: Newsletter Admin
description: Manage the Midnight Snack Digest newsletter
permalink: /admin/newsletter/
eleventyExcludeFromCollections: true
---

<style>
  .admin-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .admin-header {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    color: white;
    padding: 30px;
    border-radius: 12px;
    margin-bottom: 30px;
    text-align: center;
  }

  .admin-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 20px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    font-weight: bold;
    margin-bottom: 5px;
    color: #1a1a2e;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 10px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
  }

  .form-group textarea {
    min-height: 100px;
    resize: vertical;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #ffd700;
  }

  .article-item {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 15px;
    background: #f9fafb;
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #ffd700;
    color: #1a1a2e;
  }

  .btn-primary:hover {
    background: #ffed4e;
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background: #4b5563;
  }

  .btn-danger {
    background: #ef4444;
    color: white;
  }

  .btn-danger:hover {
    background: #dc2626;
  }

  .alert {
    padding: 15px;
    border-radius: 6px;
    margin-bottom: 20px;
    display: none;
  }

  .alert-success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .alert-error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .stat-card {
    background: #f8fafc;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    border: 1px solid #e2e8f0;
  }

  .stat-number {
    font-size: 32px;
    font-weight: bold;
    color: #1a1a2e;
    display: block;
  }

  .stat-label {
    color: #64748b;
    font-size: 14px;
    margin-top: 5px;
  }

  .auth-section {
    margin-bottom: 30px;
  }

  .hidden {
    display: none;
  }

  .user-info {
    background: #f0f9ff;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    border: 1px solid #0ea5e9;
  }

  .logout-btn {
    background: #6b7280;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .logout-btn:hover {
    background: #4b5563;
  }

  @media (max-width: 640px) {
    .admin-container {
      padding: 10px;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

<div class="admin-container">
  <div class="admin-header">
    <h1>🫘 Newsletter Admin</h1>
    <p>Manage Beans in Your Inbox</p>
  </div>

  <!-- Authentication -->
  <div class="auth-section" id="auth-section">
    <div class="admin-section">
      <h2>Admin Access</h2>
      <p>Please log in to access the newsletter admin panel.</p>
      <div data-netlify-identity-menu></div>
      <div data-netlify-identity-button>Login with Netlify Identity</div>
    </div>
  </div>

  <!-- Main Admin Interface -->
  <div id="admin-interface" class="hidden">
    
    <!-- User Info -->
    <div class="user-info" id="user-info" style="display: none;">
      <span>Logged in as: <strong id="user-email"></strong></span>
      <button class="logout-btn" onclick="logout()">Logout</button>
    </div>

    <!-- Alerts -->
    <div id="alert" class="alert"></div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-number" id="subscriber-count">-</span>
        <div class="stat-label">Subscribers</div>
      </div>
      <div class="stat-card">
        <span class="stat-number" id="last-sent">-</span>
        <div class="stat-label">Last Digest</div>
      </div>
      <div class="stat-card">
        <span class="stat-number" id="total-sent">-</span>
        <div class="stat-label">Total Sent</div>
      </div>
    </div>

    <!-- Newsletter Composer -->
    <div class="admin-section">
      <h2>Compose Digest</h2>
      
      <form id="digest-form">
        <div class="form-group">
          <label for="subject">Subject Line:</label>
          <input type="text" id="subject" placeholder="🫘 Beans - [Date]" required>
        </div>

        <div class="form-group">
          <label for="introduction">Introduction:</label>
          <textarea id="introduction" placeholder="Brief introduction..." required></textarea>
        </div>

        <div class="form-group">
          <label>Links:</label>
          <div id="articles-container">
            <!-- Articles will be added dynamically -->
          </div>
          <button type="button" class="btn btn-secondary" onclick="addArticle()">+ Add Link</button>
        </div>

        <div class="form-group">
          <label>Sound Transmission (Optional):</label>
          <div id="sounds-container">
            <input type="text" id="sounds-title" placeholder="Sound title">
            <textarea id="sounds-description" placeholder="Brief description"></textarea>
            <input type="text" id="sounds-url" placeholder="Link to listen (optional)">
          </div>
        </div>

        <div class="form-group">
          <label for="footer-note">Footer Note (Optional):</label>
          <textarea id="footer-note" placeholder="Additional note..."></textarea>
        </div>

        <div class="form-group">
          <label for="test-email">Test Email (Optional):</label>
          <input type="email" id="test-email" placeholder="Send test to this email instead of all subscribers">
        </div>

        <div style="display: flex; gap: 10px; margin-top: 30px;">
          <button type="submit" class="btn btn-primary">Send Digest</button>
          <button type="button" class="btn btn-secondary" onclick="previewDigest()">Preview</button>
          <button type="button" class="btn btn-secondary" onclick="saveDraft()">Save Draft</button>
        </div>
      </form>
    </div>

    <!-- Preview Modal -->
    <div id="preview-modal" class="hidden" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: none;">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 12px; max-width: 90vw; max-height: 90vh; overflow: auto;">
        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h3>Digest Preview</h3>
          <button class="btn btn-secondary" onclick="closePreview()">Close</button>
        </div>
        <div id="preview-content" style="padding: 20px;"></div>
      </div>
    </div>

  </div>
</div>

<!-- Netlify Identity Widget -->
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>

<script>
let currentUser = null;
let articles = [];

// Initialize Netlify Identity
if (window.netlifyIdentity) {
  window.netlifyIdentity.on("init", user => {
    if (!user) {
      window.netlifyIdentity.on("login", user => {
        handleLogin(user);
      });
    } else {
      handleLogin(user);
    }
  });
  
  window.netlifyIdentity.on("logout", () => {
    handleLogout();
  });
}

// Handle login
function handleLogin(user) {
  currentUser = user;
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('admin-interface').classList.remove('hidden');
  document.getElementById('user-info').style.display = 'flex';
  document.getElementById('user-info').style.justifyContent = 'space-between';
  document.getElementById('user-info').style.alignItems = 'center';
  document.getElementById('user-email').textContent = user.email;
  loadStats();
  loadDraft();
}

// Handle logout
function handleLogout() {
  currentUser = null;
  document.getElementById('auth-section').classList.remove('hidden');
  document.getElementById('admin-interface').classList.add('hidden');
  document.getElementById('user-info').style.display = 'none';
}

// Logout function
function logout() {
  window.netlifyIdentity.logout();
}

// Load subscriber stats
async function loadStats() {
  try {
    // This would need to be implemented as another API endpoint
    // For now, showing placeholder values
    document.getElementById('subscriber-count').textContent = '—';
    document.getElementById('last-sent').textContent = '—';
    document.getElementById('total-sent').textContent = '—';
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Article management
function addArticle() {
  const articleIndex = articles.length;
  const articleHtml = `
    <div class="article-item" data-index="${articleIndex}">
      <div class="form-group">
        <input type="text" placeholder="Title" class="article-title" required>
      </div>
      <div class="form-group">
        <input type="url" placeholder="URL" class="article-url" required>
      </div>
      <div class="form-group">
        <input type="text" placeholder="Source" class="article-source">
      </div>
      <div class="form-group">
        <textarea placeholder="Brief description" class="article-description" required></textarea>
      </div>
      <button type="button" class="btn btn-danger" onclick="removeArticle(${articleIndex})">Remove</button>
    </div>
  `;
  
  document.getElementById('articles-container').insertAdjacentHTML('beforeend', articleHtml);
  articles.push({});
}

function removeArticle(index) {
  const articleElement = document.querySelector(`[data-index="${index}"]`);
  if (articleElement) {
    articleElement.remove();
    articles.splice(index, 1);
    // Update indices
    updateArticleIndices();
  }
}

function updateArticleIndices() {
  const articleElements = document.querySelectorAll('.article-item');
  articleElements.forEach((element, index) => {
    element.setAttribute('data-index', index);
    const removeBtn = element.querySelector('.btn-danger');
    removeBtn.setAttribute('onclick', `removeArticle(${index})`);
  });
}

// Form handling
document.getElementById('digest-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  await sendDigest();
});

async function sendDigest() {
  if (!validateForm()) return;

  const digestData = collectFormData();
  
  try {
    const token = currentUser ? currentUser.token.access_token : null;
    if (!token) {
      showAlert('Not authenticated', 'error');
      return;
    }

    const response = await fetch('/.netlify/functions/send-digest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(digestData)
    });

    const result = await response.json();

    if (response.ok) {
      showAlert(`Digest sent successfully! Delivered to ${result.stats.totalSent} subscribers.`, 'success');
      clearForm();
    } else {
      showAlert(`Error: ${result.error}`, 'error');
    }
  } catch (error) {
    showAlert(`Network error: ${error.message}`, 'error');
  }
}

function collectFormData() {
  const articleElements = document.querySelectorAll('.article-item');
  const articlesData = Array.from(articleElements).map(element => ({
    title: element.querySelector('.article-title').value,
    url: element.querySelector('.article-url').value,
    source: element.querySelector('.article-source').value,
    description: element.querySelector('.article-description').value
  }));

  const sounds = {
    title: document.getElementById('sounds-title').value,
    description: document.getElementById('sounds-description').value,
    url: document.getElementById('sounds-url').value
  };

  return {
    subject: document.getElementById('subject').value,
    introduction: document.getElementById('introduction').value,
    articles: articlesData,
    sounds: sounds.title ? sounds : null,
    footer_note: document.getElementById('footer-note').value,
    test_email: document.getElementById('test-email').value
  };
}

function validateForm() {
  const subject = document.getElementById('subject').value;
  const introduction = document.getElementById('introduction').value;
  const articleElements = document.querySelectorAll('.article-item');

  if (!subject || !introduction) {
    showAlert('Subject and introduction are required', 'error');
    return false;
  }

  if (articleElements.length === 0) {
    showAlert('At least one link is required', 'error');
    return false;
  }

  // Validate articles
  for (let element of articleElements) {
    const title = element.querySelector('.article-title').value;
    const url = element.querySelector('.article-url').value;
    const description = element.querySelector('.article-description').value;

    if (!title || !url || !description) {
      showAlert('All link fields are required', 'error');
      return false;
    }
  }

  return true;
}

function previewDigest() {
  if (!validateForm()) return;
  
  const digestData = collectFormData();
  // This would generate a preview - simplified for now
  document.getElementById('preview-content').innerHTML = `
    <h2>${digestData.subject}</h2>
    <p><strong>Introduction:</strong> ${digestData.introduction}</p>
    <h3>Links (${digestData.articles.length})</h3>
    ${digestData.articles.map(article => `
      <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd;">
        <h4>${article.title}</h4>
        <p><a href="${article.url}">${article.url}</a></p>
        <p>${article.description}</p>
      </div>
    `).join('')}
    ${digestData.sounds ? `<h3>Sound: ${digestData.sounds.title}</h3>` : ''}
    ${digestData.footer_note ? `<p><strong>Footer:</strong> ${digestData.footer_note}</p>` : ''}
  `;
  document.getElementById('preview-modal').style.display = 'block';
}

function closePreview() {
  document.getElementById('preview-modal').style.display = 'none';
}

function saveDraft() {
  const digestData = collectFormData();
  localStorage.setItem('newsletter-draft', JSON.stringify(digestData));
  showAlert('Draft saved locally', 'success');
}

function loadDraft() {
  const draft = localStorage.getItem('newsletter-draft');
  if (draft) {
    try {
      const data = JSON.parse(draft);
      document.getElementById('subject').value = data.subject || '';
      document.getElementById('introduction').value = data.introduction || '';
      document.getElementById('footer-note').value = data.footer_note || '';
      document.getElementById('test-email').value = data.test_email || '';
      
      // Load sounds
      if (data.sounds) {
        document.getElementById('sounds-title').value = data.sounds.title || '';
        document.getElementById('sounds-description').value = data.sounds.description || '';
        document.getElementById('sounds-url').value = data.sounds.url || '';
      }
      
      // Load articles
      if (data.articles) {
        data.articles.forEach((article, index) => {
          addArticle();
          const articleElement = document.querySelector(`[data-index="${index}"]`);
          articleElement.querySelector('.article-title').value = article.title || '';
          articleElement.querySelector('.article-url').value = article.url || '';
          articleElement.querySelector('.article-source').value = article.source || '';
          articleElement.querySelector('.article-description').value = article.description || '';
        });
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  }
}

function clearForm() {
  document.getElementById('digest-form').reset();
  document.getElementById('articles-container').innerHTML = '';
  articles = [];
  localStorage.removeItem('newsletter-draft');
}

function showAlert(message, type) {
  const alert = document.getElementById('alert');
  alert.textContent = message;
  alert.className = `alert alert-${type}`;
  alert.style.display = 'block';
  
  setTimeout(() => {
    alert.style.display = 'none';
  }, 5000);
}

// Initialize with one article
addArticle();
</script>