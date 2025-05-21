// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_WEAVY_TOKEN') {
    console.log('Token request received in background:', request);
    
    // Make the token request from the background script
    fetch("http://localhost:3000/api/weavy-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: request.name || "Demo User",
        email: request.email || "demo@example.com"
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Token received:', { tokenLength: data.access_token?.length });
      sendResponse({ success: true, access_token: data.access_token });
    })
    .catch(error => {
      console.error('Token error in background:', error);
      sendResponse({ success: false, error: error.message });
    });

    // Return true to indicate we'll send the response asynchronously
    return true;
  }

  if (request.type === 'INIT_WEAVY') {
    // Return the configuration to be used by weavy-init.js
    sendResponse({
      success: true,
      config: {
        url: chrome.runtime.getURL('lib/weavy'),
        tokenEndpoint: request.config.tokenEndpoint,
        container: request.config.container,
        userData: request.config.userData
      }
    });
    return true;
  }
});

// Function that will be injected into the content script context
function initWeavy(config) {
  // Load Weavy script
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('lib/weavy/weavy.js');
  
  script.onload = () => {
    // Create Weavy instance after script is loaded
    const weavy = new Weavy({
      url: config.url,
      tokenFactory: async () => {
        try {
          const response = await fetch(config.tokenEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(config.userData)
          });

          if (!response.ok) {
            throw new Error("Failed to get token");
          }

          const data = await response.json();
          return data.access_token;
        } catch (error) {
          console.error("Token error:", error);
          throw error;
        }
      }
    });

    // Create messenger
    weavy.createMessenger({
      container: config.container
    });
  };

  script.onerror = () => {
    throw new Error('Failed to load Weavy script');
  };

  document.head.appendChild(script);
} 