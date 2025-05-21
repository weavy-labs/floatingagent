document.addEventListener('DOMContentLoaded', function() {
  const API_BASE_URL = 'http://localhost:3000';
  const getDomButton = document.getElementById('getDomButton');
  const domStatus = document.getElementById('domStatus');
  const iframe = document.getElementById('mainContent');

  // Function to send message to iframe
  function sendToIframe(type, data) {
    iframe.contentWindow.postMessage({ type, data }, '*');
  }

  // Function to check if URL is accessible
  function isUrlAccessible(url) {
    if (!url) return false;
    
    // List of URL patterns that can't be accessed
    const restrictedPatterns = [
      'chrome://',
      'chrome-extension://',
      'edge://',
      'about:',
      'file://'
    ];
    
    return !restrictedPatterns.some(pattern => url.startsWith(pattern));
  }

  // Function to get page DOM
  async function getPageDOM() {
    try {
      getDomButton.disabled = true;
      domStatus.textContent = 'Getting page DOM...';
      domStatus.className = 'dom-status';

      // Get the active tab
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

      if (!tabs || tabs.length === 0) {
        throw new Error('No active tab found');
      }

      const tab = tabs[0];

      if (!tab.url) {
        throw new Error('Cannot access this page: No URL available');
      }

      if (!isUrlAccessible(tab.url)) {
        throw new Error(`Cannot access this page (${tab.url}). Please try on a regular website.`);
      }

      // Execute script to get DOM
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            html: document.documentElement.outerHTML,
            url: window.location.href,
            title: document.title
          };
        }
      });

      if (!results || results.length === 0) {
        throw new Error('Failed to get page content');
      }

      const { html, url, title } = results[0].result;

      // Send DOM to backend
      const response = await fetch(`${API_BASE_URL}/api/dom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dom: html,
          url: url,
          title: title
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send DOM to backend');
      }

      const data = await response.json();
      domStatus.textContent = 'DOM successfully sent to backend';
      domStatus.className = 'dom-status success';
    } catch (error) {
      console.error('Error:', error);
      domStatus.textContent = 'Error: ' + error.message;
      domStatus.className = 'dom-status error';
      sendToIframe('showError', error.message);
    } finally {
      getDomButton.disabled = false;
    }
  }

  // Add click handler for DOM button
  getDomButton.addEventListener('click', getPageDOM);

  // Fetch features from backend
  fetch(`${API_BASE_URL}/api/features`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      sendToIframe('updateStatus', {
        type: 'connected',
        message: 'Connected to backend'
      });
      return response.json();
    })
    .then(data => {
      sendToIframe('hideLoading');
      sendToIframe('updateFeatures', data.features);
    })
    .catch(error => {
      console.error('Error:', error);
      sendToIframe('showError', 'Failed to load features. Please check if the backend is running.');
      sendToIframe('updateStatus', {
        type: 'disconnected',
        message: 'Disconnected from backend'
      });
    });
}); 