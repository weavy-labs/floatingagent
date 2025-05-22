// Function to handle form submission
async function handleSubmit(event) {
  event.preventDefault();
  
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const submitButton = document.getElementById('submitButton');
  const errorMessage = document.getElementById('errorMessage');
  
  // Disable submit button and clear error
  submitButton.disabled = true;
  errorMessage.textContent = '';
  
  try {
    const response = await fetch('http://localhost:3000/api/weavy-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: nameInput.value,
        email: emailInput.value
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store the token
    chrome.storage.local.set({
      weavyToken: data.access_token,
      userData: {
        name: nameInput.value,
        email: emailInput.value
      }
    }, () => {
      // Close the popup
      window.close();
    });
    
  } catch (error) {
    console.error('Error:', error);
    errorMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
}

// Function to load saved user data
function loadUserData() {
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  
  chrome.storage.local.get(['userData'], (result) => {
    if (result.userData) {
      nameInput.value = result.userData.name || '';
      emailInput.value = result.userData.email || '';
    }
  });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  // Load saved user data
  loadUserData();
  
  // Setup form submission
  const form = document.getElementById('tokenForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }
  
  // Setup reset button
  const resetButton = document.getElementById('resetButton');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      chrome.storage.local.remove(['weavyToken', 'userData'], () => {
        // Reload the popup
        window.location.reload();
      });
    });
  }
}); 