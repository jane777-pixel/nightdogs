---
title: "Identity Debug"
description: "Debug page for Netlify Identity authentication"
permalink: /admin/debug/identity/
eleventyExcludeFromCollections: true
---

<style>
.debug-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: monospace;
}

.debug-section {
  margin: 2rem 0;
  padding: 1rem;
  border: 2px solid #333;
  border-radius: 8px;
  background: #f5f5f5;
}

.debug-section h3 {
  margin-top: 0;
  color: #333;
}

.status {
  padding: 0.5rem;
  border-radius: 4px;
  margin: 0.5rem 0;
  font-weight: bold;
}

.status.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f1b0b7;
}

.status.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #fdd835;
}

.user-info {
  background: #e3f2fd;
  border: 1px solid #64b5f6;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.btn {
  padding: 0.5rem 1rem;
  margin: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.log-output {
  background: #000;
  color: #00ff00;
  padding: 1rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  height: 200px;
  overflow-y: auto;
  margin: 1rem 0;
}

#identity-buttons {
  margin: 1rem 0;
}
</style>

<div class="debug-container">
  <h1>🔍 Netlify Identity Debug Page</h1>
  <p>This page helps diagnose Netlify Identity authentication issues.</p>

  <div class="debug-section">
    <h3>Widget Status</h3>
    <div id="widget-status" class="status warning">Checking...</div>
    <div id="identity-buttons">
      <div data-netlify-identity-menu></div>
      <div data-netlify-identity-button>Login with Netlify Identity</div>
    </div>
  </div>

  <div class="debug-section">
    <h3>User Information</h3>
    <div id="user-status" class="status warning">Checking...</div>
    <div id="user-details" class="user-info" style="display: none;"></div>
    
    <button class="btn btn-primary" onclick="checkCurrentUser()">Check Current User</button>
    <button class="btn btn-secondary" onclick="clearLog()">Clear Log</button>
  </div>

  <div class="debug-section">
    <h3>API Test</h3>
    <p>Test if authenticated API calls work:</p>
    <button class="btn btn-primary" onclick="testAPI()">Test API Call</button>
    <div id="api-result"></div>
  </div>

  <div class="debug-section">
    <h3>Console Log</h3>
    <div id="log-output" class="log-output"></div>
  </div>
</div>

<!-- Load Netlify Identity Widget -->
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>

<script>
let logOutput = [];

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
  logOutput.push(logEntry);
  console.log(logEntry);
  
  // Update log display
  const logDiv = document.getElementById('log-output');
  if (logDiv) {
    logDiv.innerHTML = logOutput.slice(-20).join('<br>'); // Show last 20 entries
    logDiv.scrollTop = logDiv.scrollHeight;
  }
}

function clearLog() {
  logOutput = [];
  document.getElementById('log-output').innerHTML = '';
}

function updateStatus(elementId, message, type) {
  const element = document.getElementById(elementId);
  if (element) {
    element.className = `status ${type}`;
    element.textContent = message;
  }
}

function displayUserInfo(user) {
  const userDetails = document.getElementById('user-details');
  if (user && userDetails) {
    userDetails.style.display = 'block';
    userDetails.innerHTML = `
      <h4>Current User:</h4>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>ID:</strong> ${user.id}</p>
      <p><strong>Role:</strong> ${user.role || 'No role assigned'}</p>
      <p><strong>Confirmed:</strong> ${user.email_confirmed_at ? 'Yes' : 'No'}</p>
      <p><strong>Last Sign In:</strong> ${user.last_sign_in_at || 'Unknown'}</p>
      <p><strong>App Metadata:</strong> ${JSON.stringify(user.app_metadata, null, 2)}</p>
      <p><strong>User Metadata:</strong> ${JSON.stringify(user.user_metadata, null, 2)}</p>
      <p><strong>Token:</strong> ${user.token ? 'Present' : 'Missing'}</p>
    `;
    updateStatus('user-status', `Logged in as ${user.email}`, 'success');
  } else {
    userDetails.style.display = 'none';
    updateStatus('user-status', 'No user logged in', 'error');
  }
}

function checkCurrentUser() {
  log('Checking current user...');
  if (window.netlifyIdentity) {
    const user = window.netlifyIdentity.currentUser();
    log(`Current user: ${user ? user.email : 'null'}`);
    displayUserInfo(user);
    return user;
  } else {
    log('Netlify Identity widget not available', 'error');
    updateStatus('user-status', 'Identity widget not loaded', 'error');
    return null;
  }
}

async function testAPI() {
  log('Testing API call...');
  const user = checkCurrentUser();
  
  if (!user) {
    log('No user logged in for API test', 'error');
    document.getElementById('api-result').innerHTML = '<div class="status error">Not logged in</div>';
    return;
  }

  try {
    const token = user.token?.access_token;
    if (!token) {
      log('No access token available', 'error');
      document.getElementById('api-result').innerHTML = '<div class="status error">No access token</div>';
      return;
    }

    log('Making API call with token...');
    const response = await fetch('/api/send-digest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: 'Test',
        introduction: 'Test',
        articles: [{ title: 'Test', url: '#', description: 'Test' }],
        test_email: user.email
      })
    });

    const result = await response.json();
    log(`API response: ${response.status} - ${JSON.stringify(result)}`);
    
    document.getElementById('api-result').innerHTML = `
      <div class="status ${response.ok ? 'success' : 'error'}">
        <p><strong>Status:</strong> ${response.status}</p>
        <p><strong>Response:</strong> ${JSON.stringify(result, null, 2)}</p>
      </div>
    `;

  } catch (error) {
    log(`API error: ${error.message}`, 'error');
    document.getElementById('api-result').innerHTML = `
      <div class="status error">
        <p><strong>Error:</strong> ${error.message}</p>
      </div>
    `;
  }
}

function initializeDebug() {
  log('Starting debug initialization...');
  
  if (!window.netlifyIdentity) {
    log('Netlify Identity widget not found', 'error');
    updateStatus('widget-status', 'Widget not loaded', 'error');
    return;
  }

  log('Netlify Identity widget found');
  updateStatus('widget-status', 'Widget loaded successfully', 'success');

  // Set up event listeners
  window.netlifyIdentity.on("init", user => {
    log(`Identity init event: ${user ? user.email : 'no user'}`);
    displayUserInfo(user);
  });

  window.netlifyIdentity.on("login", user => {
    log(`Login event: ${user.email}`);
    displayUserInfo(user);
  });

  window.netlifyIdentity.on("logout", () => {
    log('Logout event fired');
    displayUserInfo(null);
  });

  // Check current user immediately
  checkCurrentUser();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDebug);
} else {
  initializeDebug();
}

// Also try on window load as fallback
window.addEventListener('load', function() {
  log('Window load event - rechecking user');
  checkCurrentUser();
});

log('Debug script loaded');
</script>