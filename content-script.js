// Content script for managing the floating panel
let panel = null;
let iframe = null;
let isVisible = false;

// Function to create the floating panel
function createPanel() {
  // Create the panel container
  panel = document.createElement('div');
  panel.id = 'floatingAgentPanel';
  panel.style.cssText = `
    position: fixed;
    top: 20px;
    right: -600px;
    width: 500px;
    height: 95vh;
    background: transparent;
    z-index: 10000;
    display: block;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: right 0.3s ease-in-out;
  `;

  // Create the iframe
  iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('content.html');
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 8px;
    background: white;
  `;

  panel.appendChild(iframe);
  document.body.appendChild(panel);
}

// Function to toggle panel visibility
function togglePanel() {
  if (!panel) {
    createPanel();
    // Add a small delay to allow the initial CSS to be applied
    setTimeout(() => {
      isVisible = true;
      panel.style.right = '20px';
      // Send DOM data after panel is visible
      sendDOMData();
    }, 50);
    return;
  }
  
  isVisible = !isVisible;
  panel.style.right = isVisible ? '20px' : '-600px';

  // Send DOM data when panel becomes visible
  if (isVisible) {
    sendDOMData();
  }
}

// Function to send DOM data to iframe
function sendDOMData() {
  const domData = {
    url: window.location.href,
    title: document.title,
    content: document.body.innerText
  };
  
  // Wait for iframe to load before sending message
  if (!iframe.contentDocument || iframe.contentDocument.readyState !== 'complete') {
    iframe.onload = () => {
      iframe.contentWindow.postMessage({
        type: 'setDOMData',
        data: domData
      }, '*');
      console.log('Sent DOM data after iframe load');
    };
  } else {
    // If iframe is already loaded, send message immediately
    iframe.contentWindow.postMessage({
      type: 'setDOMData',
      data: domData
    }, '*');
    console.log('Sent DOM data immediately');
  }
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'togglePanel') {
    togglePanel();
  }
});

// Listen for messages from the iframe
window.addEventListener('message', (event) => {
  // Verify the origin
  if (event.source !== iframe?.contentWindow) {
    return;
  }

  const { type } = event.data;

  if (type === 'closePanel') {
    if (panel) {
      isVisible = false;
      panel.style.right = '-600px';
    }
  } else if (type === 'saveSelection') {
    // Get the current selection
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const fragment = range.cloneContents();
    
    // Create temporary elements to get both HTML and text content
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(fragment.cloneNode(true));
    
    const data = {
      html: tempDiv.innerHTML,
      text: tempDiv.textContent,
      timestamp: new Date().toISOString()
    };
    
    // Send the selection data back to the iframe
    iframe.contentWindow.postMessage({
      type: 'saveSelection',
      data: data
    }, '*');
  }
}); 