// Function to load Weavy script
async function loadWeavy() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('lib/weavy/weavy.js');
    script.type = 'module';
    
    script.onload = () => {
      console.log('Weavy script loaded successfully');
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('Error loading Weavy script:', error);
      reject(error);
    };
    
    document.head.appendChild(script);
  });
}

// Function to initialize Weavy
async function initWeavy() {
  try {
    await loadWeavy();
    
    // Get configuration from background script
    chrome.runtime.sendMessage({
      type: 'INIT_WEAVY',
      config: {
        tokenEndpoint: 'http://localhost:3000/api/weavy-token',
        container: '#weavy-container',
        userData: {
          name: 'Demo User',
          email: 'demo@example.com'
        }
      }
    }, response => {
      if (response && response.success) {
        console.log('Weavy initialized with config:', response.config);
      } else {
        console.error('Failed to initialize Weavy:', response?.error);
      }
    });
  } catch (error) {
    console.error('Failed to load Weavy:', error);
  }
} 