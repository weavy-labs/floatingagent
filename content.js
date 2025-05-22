// Store DOM data globally
let currentDOMData = null;

// Listen for messages from the parent window
window.addEventListener('message', function(event) {
  // Make sure the message is from our parent window
  if (event.source !== window.parent) {
    return;
  }

  const { type, data } = event.data;

  console.log('Received message:', JSON.stringify(data, null, 2));

  if (type === 'showError') {
    showError(data);
  } else if (type === 'setDOMData') {
    const copilot = document.querySelector('wy-copilot');
    if (copilot) {
      // Set the DOM data as a property on the copilot
      copilot.data = [ JSON.stringify(data, null, 2) ];
      console.log('copilot.data:', JSON.stringify(copilot.data, null, 2));
    }
  } else if (type === 'saveSelection') {
    saveSelectionToBackend(data);
  }
});

// Function to save selection to backend
async function saveSelectionToBackend(selectionData) {
  try {
    const copilot = document.getElementById('floatingAgentCopilot');
    const knowledgeBaseId = copilot ? copilot.dataset.knowledgeBaseId : null;

    if (!knowledgeBaseId) {
      throw new Error('No knowledge base ID found for current agent');
    }

    const response = await fetch('http://localhost:3000/api/save-selection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...selectionData,
        knowledgeBaseId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save selection');
    }

    // Show success message
    showSuccess('Selection saved successfully!');
  } catch (error) {
    console.error('Error saving selection:', error);
    showError('Failed to save selection: ' + error.message);
  }
}

function showToast(message, type = 'success') {
  const toastContainer = document.querySelector('.toast-container');
  
  // Create toast element
  const toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  
  // Create toast header
  const header = document.createElement('div');
  header.className = `toast-header text-white bg-${type}`;
  
  const title = document.createElement('strong');
  title.className = 'me-auto';
  title.textContent = type === 'success' ? 'Success' : 'Error';
  
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'btn-close btn-close-white';
  closeButton.setAttribute('data-bs-dismiss', 'toast');
  closeButton.setAttribute('aria-label', 'Close');
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Create toast body
  const body = document.createElement('div');
  body.className = 'toast-body';
  body.textContent = message;
  
  // Assemble toast
  toastEl.appendChild(header);
  toastEl.appendChild(body);
  toastContainer.appendChild(toastEl);
  
  // Initialize and show the toast
  const toast = new bootstrap.Toast(toastEl, {
    autohide: true,
    delay: 3000
  });
  toast.show();
  
  // Remove the toast element after it's hidden
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

function showSuccess(message) {
  showToast(message, 'success');
}

function showError(message) {
  showToast(message, 'danger');
}

// Add click handler for reset button
document.addEventListener('DOMContentLoaded', () => {
  const resetButton = document.getElementById('resetChatButton');
  const saveSelectionButton = document.getElementById('saveSelectionButton');
  const copilot = document.getElementById('floatingAgentCopilot');
  const closeButton = document.getElementById('closePanel');
  
  if (resetButton && copilot) {
    resetButton.addEventListener('click', () => {
      console.log('Copilot data before reset:', JSON.stringify(copilot.data, null, 2));
      copilot.reset();
      console.log('Copilot data after reset:', JSON.stringify(copilot.data, null, 2));
    });
  }

  if (saveSelectionButton) {
    saveSelectionButton.addEventListener('click', () => {
      // Send message to content-script to get the current selection
      window.parent.postMessage({
        type: 'saveSelection'
      }, '*');
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      // Send message to parent to close the panel
      window.parent.postMessage({
        type: 'closePanel'
      }, '*');
    });
  }
});

// Log that content script is loaded
console.log('[content.js] Content script loaded'); 