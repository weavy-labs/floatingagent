// Listen for messages from the parent window
window.addEventListener('message', function(event) {
  // Make sure the message is from our parent window
  if (event.source !== window.parent) {
    return;
  }

  const { type, data } = event.data;

  switch (type) {
    case 'updateStatus':
      updateStatus(data);
      break;
    case 'updateFeatures':
      updateFeatures(data);
      break;
    case 'showError':
      showError(data);
      break;
    case 'hideLoading':
      hideLoading();
      break;
  }
});

function updateStatus(status) {
  const statusText = document.querySelector('.status-text');
  const statusIndicator = document.querySelector('.status-indicator');
  
  if (statusText && statusIndicator) {
    statusText.textContent = status.message;
    statusIndicator.className = `status-indicator ${status.type}`;
  }
}

function updateFeatures(features) {
  const container = document.querySelector('.features-container');
  const list = document.querySelector('.feature-list');
  
  if (container && list) {
    list.innerHTML = features.map(feature => 
      `<div class="feature-item">${feature}</div>`
    ).join('');
    container.style.display = 'block';
  }
}

function showError(message) {
  const error = document.querySelector('.error');
  if (error) {
    error.textContent = message;
    error.style.display = 'block';
  }
}

function hideLoading() {
  const loading = document.querySelector('.loading');
  if (loading) {
    loading.style.display = 'none';
  }
}

// Log that content script is loaded
console.log('[content.js] Content script loaded'); 