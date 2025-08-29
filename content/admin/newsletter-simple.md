---
title: "Newsletter Admin (Simple)"
description: "Simplified newsletter admin with reliable authentication"
permalink: /admin/newsletter-simple/
eleventyExcludeFromCollections: true
---

<style>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.admin-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  color: white;
  border-radius: 12px;
}

.admin-section {
  background: white;
  border: 2px solid #1a1a2e;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #1a1a2e;
}

.form-group input, .form-group textarea, .form-group select {
  width: 100%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.form-group input:focus, .form-group textarea:focus {
  outline: none;
  border-color: #ffd700;
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
}

.article-item {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 10px;
  background: #f9f9f9;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #ffd700;
  color: #1a1a2e;
}

.btn-primary:hover {
  background: #ffed4e;
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

.alert {
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 6px;
  font-weight: 600;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f1b0b7;
}

.hidden {
  display: none !important;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #e3f2fd;
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.logout-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.logout-btn:hover {
  background: #c82333;
}

.auth-section {
  text-align: center;
  padding: 40px 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

@media (max-width: 640px) {
  .admin-container {
    padding: 15px;
  }
}
</style>

<div class="admin-container">
  <div class="admin-header">
    <h1>🫘 Newsletter Admin (Simple)</h1>
    <p>Manage Beans in Your Inbox</p>
  </div>

  <!-- Authentication Section -->
  <div class="auth-section" id="auth-section">
    <h2>Admin Access</h2>
    <p>Please log in to access the newsletter admin panel.</p>
    <div id="user-status" style="margin: 20px 0;">
      <p><strong>Logged in as:</strong> <span id="current-user-email">orionlw@pm.me</span></p>
      <button onclick="logout()" class="btn btn-secondary">Log out</button>
    </div>
    <div data-netlify-identity-menu></div>
    <div data-netlify-identity-button>Login with Netlify Identity</div>
  </div>

  <!-- Main Admin Interface -->
  <div id="admin-interface" class="hidden">
    
    <!-- User Info -->
    <div class="user-info" id="user-info">
      <span>Logged in as: <strong id="user-email"></strong></span>
      <button class="logout-btn" onclick="logout()">Logout</button>
    </div>

    <!-- Alert Messages -->
    <div id="alert-container"></div>

    <!-- Send Digest Form -->
    <div class="admin-section">
      <h2>📧 Send Newsletter Digest</h2>
      
      <form id="digest-form">
        <div class="form-group">
          <label for="subject">Email Subject</label>
          <input type="text" id="subject" name="subject" placeholder="e.g., Weekly Beans Digest #42" required>
        </div>

        <div class="form-group">
          <label for="introduction">Introduction Text</label>
          <textarea id="introduction" name="introduction" placeholder="Welcome to this week's digest..." required></textarea>
        </div>

        <!-- Articles Section -->
        <div class="form-group">
          <label>Articles</label>
          <div id="articles-container"></div>
          <button type="button" class="btn btn-secondary" onclick="addArticle()">+ Add Article</button>
        </div>

        <!-- Sounds Section (Optional) -->
        <div class="form-group">
          <label for="sounds-title">Sound Transmission (Optional)</label>
          <input type="text" id="sounds-title" name="sounds-title" placeholder="Track title">
          <textarea id="sounds-description" name="sounds-description" placeholder="Description of the sound..." style="margin-top: 10px;"></textarea>
          <input type="url" id="sounds-url" name="sounds-url" placeholder="https://link-to-sound.com" style="margin-top: 10px;">
        </div>

        <div class="form-group">
          <label for="footer-note">Footer Note (Optional)</label>
          <textarea id="footer-note" name="footer-note" placeholder="Additional note for the bottom of the email..."></textarea>
        </div>

        <div class="form-group">
          <label for="test-email">Test Email (Optional)</label>
          <input type="email" id="test-email" name="test-email" placeholder="Send to this email only for testing">
          <small>If provided, digest will only be sent to this email address</small>
        </div>

        <div style="margin-top: 20px;">
          <button type="submit" class="btn btn-primary">📧 Send Digest</button>
          <button type="button" class="btn btn-secondary" onclick="previewDigest()">👁️ Preview</button>
          <button type="button" class="btn btn-secondary" onclick="saveDraft()">💾 Save Draft</button>
          <button type="button" class="btn btn-secondary" onclick="clearForm()">🗑️ Clear</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Preview Modal -->
<div id="preview-modal" class="hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;">
  <div style="background: white; border-radius: 8px; max-width: 600px; max-height: 80vh; overflow-y: auto; position: relative;">
    <div style="padding: 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
      <h3>Email Preview</h3>
      <button onclick="closePreview()" class="btn btn-secondary">Close</button>
    </div>
    <div id="preview-content" style="padding: 20px;"></div>
  </div>
</div>

<!-- Netlify Identity Widget -->
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>

<script>
let currentUser = null;
let articles = [];

// Simple initialization following DecapCMS pattern
if (window.netlifyIdentity) {
  console.log('🔍 [Simple Admin] Setting up Netlify Identity event listeners...');
  
  window.netlifyIdentity.on("init", (user) => {
    console.log('🎯 [Simple Admin] Identity init event fired, user:', user ? user.email : 'null');
    if (user) {
      console.log('👤 [Simple Admin] User found on init:', user.email);
      console.log('🔐 [Simple Admin] Token present:', !!user.token);
      handleLogin(user);
    } else {
      console.log('🚫 [Simple Admin] No user found on init - auth form should be visible');
      ensureAuthSectionVisible();
    }
  });
  
  window.netlifyIdentity.on("login", (user) => {
    console.log('🚪 [Simple Admin] Login event fired:', user.email);
    handleLogin(user);
  });
  
  window.netlifyIdentity.on("logout", () => {
    console.log('👋 [Simple Admin] Logout event fired');
    handleLogout();
  });

  console.log('📝 [Simple Admin] Event listeners registered, waiting for init event...');
} else {
  console.log('❌ [Simple Admin] Netlify Identity widget not available');
}

function ensureAuthSectionVisible() {
  const authSection = document.getElementById('auth-section');
  const adminInterface = document.getElementById('admin-interface');
  
  if (authSection) {
    authSection.classList.remove('hidden');
    console.log('👁️ [Simple Admin] Auth section made visible');
  }
  if (adminInterface) {
    adminInterface.classList.add('hidden');
    console.log('🙈 [Simple Admin] Admin interface hidden');
  }
}

function handleLogin(user) {
  console.log('🎉 [Simple Admin] Handling login for:', user.email);
  console.log('🔑 [Simple Admin] User token:', user.token ? 'Present' : 'Missing');
  currentUser = user;
  
  // Hide auth section, show admin interface
  const authSection = document.getElementById('auth-section');
  const adminInterface = document.getElementById('admin-interface');
  const userEmail = document.getElementById('user-email');
  
  console.log('🎯 [Simple Admin] Updating UI elements...');
  
  if (authSection) {
    authSection.classList.add('hidden');
    console.log('🙈 [Simple Admin] Auth section hidden');
  } else {
    console.log('❌ [Simple Admin] Auth section not found');
  }
  
  if (adminInterface) {
    adminInterface.classList.remove('hidden');
    console.log('👁️ [Simple Admin] Admin interface made visible');
  } else {
    console.log('❌ [Simple Admin] Admin interface not found');
  }
  
  if (userEmail) {
    userEmail.textContent = user.email;
    console.log('📧 [Simple Admin] User email set');
  }
  
  // Load saved draft if exists
  loadDraft();
  
  // Initialize with one article
  if (articles.length === 0) {
    addArticle();
  }
}

function handleLogout() {
  console.log('🔓 [Simple Admin] Handling logout');
  currentUser = null;
  
  // Show auth section, hide admin interface
  const authSection = document.getElementById('auth-section');
  const adminInterface = document.getElementById('admin-interface');
  
  if (authSection) {
    authSection.classList.remove('hidden');
    console.log('👁️ [Simple Admin] Auth section made visible');
  }
  
  if (adminInterface) {
    adminInterface.classList.add('hidden');
    console.log('🙈 [Simple Admin] Admin interface hidden');
  }
  
  // Clear form
  clearForm();
}

function logout() {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.logout();
  }
}

function addArticle() {
  const container = document.getElementById('articles-container');
  const index = articles.length;
  
  const articleDiv = document.createElement('div');
  articleDiv.className = 'article-item';
  articleDiv.innerHTML = `
    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
      <h4>Article ${index + 1}</h4>
      <button type="button" class="btn btn-danger" onclick="removeArticle(${index})" style="margin-left: auto;">Remove</button>
    </div>
    <div class="form-group">
      <input type="text" name="article-title-${index}" placeholder="Article title" required>
    </div>
    <div class="form-group">
      <input type="url" name="article-url-${index}" placeholder="https://article-url.com" required>
    </div>
    <div class="form-group">
      <input type="text" name="article-source-${index}" placeholder="Source (optional)">
    </div>
    <div class="form-group">
      <textarea name="article-description-${index}" placeholder="Brief description of the article..." required></textarea>
    </div>
  `;
  
  container.appendChild(articleDiv);
  articles.push({ index });
  updateArticleIndices();
}

function removeArticle(index) {
  const container = document.getElementById('articles-container');
  const articleDivs = container.children;
  
  if (articleDivs[index]) {
    container.removeChild(articleDivs[index]);
    articles.splice(index, 1);
    updateArticleIndices();
  }
}

function updateArticleIndices() {
  const container = document.getElementById('articles-container');
  const articleDivs = Array.from(container.children);
  
  articleDivs.forEach((div, index) => {
    const title = div.querySelector('h4');
    if (title) title.textContent = `Article ${index + 1}`;
    
    const inputs = div.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      const namePrefix = input.name.split('-').slice(0, -1).join('-');
      input.name = `${namePrefix}-${index}`;
    });
  });
  
  articles = articles.map((_, index) => ({ index }));
}

async function sendDigest() {
  if (!currentUser) {
    showAlert('Please log in first', 'error');
    return;
  }

  const formData = collectFormData();
  if (!validateForm(formData)) return;

  try {
    showAlert('Sending digest...', 'success');
    
    const token = currentUser.token?.access_token;
    if (!token) {
      showAlert('Authentication token not found', 'error');
      return;
    }

    const response = await fetch('/.netlify/functions/send-digest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    
    if (response.ok) {
      showAlert(`✅ Digest sent successfully! ${result.stats?.totalSent || 0} recipients`, 'success');
      clearForm();
    } else {
      showAlert(`❌ Error: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Send digest error:', error);
    showAlert(`❌ Network error: ${error.message}`, 'error');
  }
}

function collectFormData() {
  const data = {
    subject: document.getElementById('subject').value,
    introduction: document.getElementById('introduction').value,
    articles: [],
    footer_note: document.getElementById('footer-note').value,
    test_email: document.getElementById('test-email').value
  };

  // Collect articles
  for (let i = 0; i < articles.length; i++) {
    const title = document.querySelector(`input[name="article-title-${i}"]`)?.value;
    const url = document.querySelector(`input[name="article-url-${i}"]`)?.value;
    const source = document.querySelector(`input[name="article-source-${i}"]`)?.value;
    const description = document.querySelector(`textarea[name="article-description-${i}"]`)?.value;
    
    if (title && url && description) {
      data.articles.push({ title, url, source, description });
    }
  }

  // Collect sounds if provided
  const soundsTitle = document.getElementById('sounds-title').value;
  const soundsDescription = document.getElementById('sounds-description').value;
  const soundsUrl = document.getElementById('sounds-url').value;
  
  if (soundsTitle || soundsDescription || soundsUrl) {
    data.sounds = {
      title: soundsTitle,
      description: soundsDescription,
      url: soundsUrl
    };
  }

  return data;
}

function validateForm(data) {
  if (!data.subject) {
    showAlert('Subject is required', 'error');
    return false;
  }
  
  if (!data.introduction) {
    showAlert('Introduction is required', 'error');
    return false;
  }
  
  if (data.articles.length === 0) {
    showAlert('At least one article is required', 'error');
    return false;
  }

  return true;
}

function previewDigest() {
  const formData = collectFormData();
  if (!validateForm(formData)) return;

  const previewHtml = generatePreviewHtml(formData);
  document.getElementById('preview-content').innerHTML = previewHtml;
  document.getElementById('preview-modal').classList.remove('hidden');
}

function generatePreviewHtml(data) {
  const articlesHtml = data.articles.map(article => `
    <div style="border-left: 4px solid #ffd700; padding-left: 15px; margin: 15px 0;">
      <h3>${article.title}</h3>
      ${article.source ? `<p><em>${article.source}</em></p>` : ''}
      <p>${article.description}</p>
      <a href="${article.url}" target="_blank">Read more →</a>
    </div>
  `).join('');

  const soundsHtml = data.sounds ? `
    <div style="background: #ffd700; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>🎵 ${data.sounds.title}</h3>
      <p>${data.sounds.description}</p>
      ${data.sounds.url ? `<a href="${data.sounds.url}" target="_blank">Listen →</a>` : ''}
    </div>
  ` : '';

  return `
    <h1>${data.subject}</h1>
    <p><strong>Introduction:</strong></p>
    <p>${data.introduction}</p>
    
    <h2>Articles:</h2>
    ${articlesHtml}
    
    ${soundsHtml}
    
    ${data.footer_note ? `<div style="margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 6px;"><p><em>${data.footer_note}</em></p></div>` : ''}
    
    ${data.test_email ? `<p><strong>Test Mode:</strong> Will only send to ${data.test_email}</p>` : ''}
  `;
}

function closePreview() {
  document.getElementById('preview-modal').classList.add('hidden');
}

function saveDraft() {
  const formData = collectFormData();
  try {
    localStorage.setItem('newsletter-draft', JSON.stringify(formData));
    showAlert('Draft saved!', 'success');
  } catch (e) {
    showAlert('Could not save draft', 'error');
  }
}

function loadDraft() {
  try {
    const draft = localStorage.getItem('newsletter-draft');
    if (draft) {
      const data = JSON.parse(draft);
      
      // Fill form fields
      document.getElementById('subject').value = data.subject || '';
      document.getElementById('introduction').value = data.introduction || '';
      document.getElementById('footer-note').value = data.footer_note || '';
      document.getElementById('test-email').value = data.test_email || '';
      
      if (data.sounds) {
        document.getElementById('sounds-title').value = data.sounds.title || '';
        document.getElementById('sounds-description').value = data.sounds.description || '';
        document.getElementById('sounds-url').value = data.sounds.url || '';
      }
      
      // Clear existing articles and load from draft
      articles = [];
      document.getElementById('articles-container').innerHTML = '';
      
      if (data.articles && data.articles.length > 0) {
        data.articles.forEach((article, index) => {
          addArticle();
          setTimeout(() => {
            document.querySelector(`input[name="article-title-${index}"]`).value = article.title || '';
            document.querySelector(`input[name="article-url-${index}"]`).value = article.url || '';
            document.querySelector(`input[name="article-source-${index}"]`).value = article.source || '';
            document.querySelector(`textarea[name="article-description-${index}"]`).value = article.description || '';
          }, 10);
        });
      }
    }
  } catch (e) {
    console.warn('Could not load draft:', e);
  }
}

function clearForm() {
  document.getElementById('digest-form').reset();
  articles = [];
  document.getElementById('articles-container').innerHTML = '';
  addArticle(); // Start with one article
  
  try {
    localStorage.removeItem('newsletter-draft');
  } catch (e) {}
}

function showAlert(message, type) {
  const alertContainer = document.getElementById('alert-container');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  
  alertContainer.innerHTML = '';
  alertContainer.appendChild(alert);
  
  setTimeout(() => {
    alertContainer.innerHTML = '';
  }, 5000);
}

// Handle form submission
document.getElementById('digest-form').addEventListener('submit', function(e) {
  e.preventDefault();
  sendDigest();
});

console.log('🚀 [Simple Admin] Newsletter admin (simple) loaded');

// Add window load fallback
window.addEventListener('load', function() {
  console.log('🌐 [Simple Admin] Window fully loaded, checking identity...');
  
  setTimeout(() => {
    if (!currentUser && window.netlifyIdentity) {
      console.log('⏰ [Simple Admin] Fallback: No user found yet, checking currentUser()...');
      const user = window.netlifyIdentity.currentUser();
      if (user) {
        console.log('🎯 [Simple Admin] Fallback: Found user via currentUser():', user.email);
        handleLogin(user);
      } else {
        console.log('🚫 [Simple Admin] Fallback: No user found, ensuring auth form is visible');
        ensureAuthSectionVisible();
      }
    } else if (currentUser) {
      console.log('✅ [Simple Admin] User already logged in:', currentUser.email);
    }
  }, 1000);
});
</script>