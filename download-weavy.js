const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

async function downloadWeavyAssets() {
  const weavyUrl = "https://77d53be50974490089ac2382a8e9e510.weavy.io";
  const libDir = path.join(__dirname, 'lib', 'weavy');
  
  try {
    // Create lib/weavy directory if it doesn't exist
    await fs.mkdir(libDir, { recursive: true });
    
    // Download weavy.js
    const jsResponse = await fetch(`${weavyUrl}/javascript/weavy.js`);
    const jsContent = await jsResponse.text();
    await fs.writeFile(path.join(libDir, 'weavy.js'), jsContent);
    
    // Download weavy.css
    const cssResponse = await fetch(`${weavyUrl}/css/weavy.css`);
    const cssContent = await cssResponse.text();
    await fs.writeFile(path.join(libDir, 'weavy.css'), cssContent);
    
    console.log('Weavy assets downloaded successfully');
  } catch (error) {
    console.error('Error downloading Weavy assets:', error);
  }
}

// Run the download
downloadWeavyAssets(); 