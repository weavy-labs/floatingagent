// Main JavaScript file
document.addEventListener('DOMContentLoaded', () => {
  console.log('Application loaded');
  
  // Check API status
  fetch('/api/status')
    .then(response => response.json())
    .then(data => {
      console.log('API Status:', data.status);
    })
    .catch(error => {
      console.error('Error checking API status:', error);
    });
}); 