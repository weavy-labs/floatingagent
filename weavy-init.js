import { Weavy } from './lib/weavy/weavy.js';

// Function to get token from background script
async function getToken() {
  console.log("[weavy-init] Requesting token through background script");
  return new Promise((resolve, reject) => {
    console.log("[weavy-init] Sending GET_WEAVY_TOKEN message");
    chrome.runtime.sendMessage({
      type: 'GET_WEAVY_TOKEN',
      name: "Demo User",
      email: "demo@example.com"
    }, response => {
      console.log("[weavy-init] Received response from background:", response);
      if (response && response.success) {
        console.log("[weavy-init] Token received successfully");
        resolve(response.access_token);
      } else {
        console.error("[weavy-init] Token error from background:", response?.error || 'No response');
        reject(new Error(response?.error || 'Failed to get token'));
      }
    });
  });
}

// Initialize Weavy
async function initWeavy() {
  console.log("[weavy-init] Starting initialization");
  try {
    console.log("[weavy-init] Creating Weavy instance");
    const weavy = new WeavyClient({
      url: "https://77d53be50974490089ac2382a8e9e510.weavy.io",
      tokenFactory: async () => {
        try {
          return await getToken();
        } catch (error) {
          console.error("[weavy-init] Token refresh error:", error);
          throw error;
        }
      }
    });

    console.log("[weavy-init] Weavy instance created");

    // Hide loading indicator when messenger is ready
    const loadingDiv = document.querySelector('.loading');
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }

    // Update status
    const statusText = document.querySelector('.status-text');
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusText && statusIndicator) {
      statusText.textContent = 'Connected';
      statusIndicator.classList.add('connected');
    }

  } catch (error) {
    console.error('[weavy-init] Failed to initialize Weavy:', error);
    const errorDiv = document.querySelector('.error');
    if (errorDiv) {
      errorDiv.textContent = 'Failed to initialize Weavy chat: ' + error.message;
      errorDiv.style.display = 'block';
    }

    // Update status for error
    const statusText = document.querySelector('.status-text');
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusText && statusIndicator) {
      statusText.textContent = 'Connection failed';
      statusIndicator.classList.add('error');
    }
  }
}

// Start initialization
console.log("[weavy-init] Script loaded, starting initialization");
initWeavy();
