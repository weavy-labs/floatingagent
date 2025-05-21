const https = require('https');
const fs = require('fs');
const path = require('path');

const WEAVY_URL = 'https://77d53be50974490089ac2382a8e9e510.weavy.io';
const FILES_TO_DOWNLOAD = [
  '/uikit-web/weavy.js',
  '/uikit-web/weavy.css'
];

// Create lib directory if it doesn't exist
const libDir = path.join(__dirname, 'lib');
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir);
}

// Download each file
FILES_TO_DOWNLOAD.forEach(filePath => {
  const url = WEAVY_URL + filePath;
  const fileName = path.basename(filePath);
  const fileDest = path.join(libDir, fileName);

  https.get(url, (response) => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download ${fileName}: ${response.statusCode}`);
      return;
    }

    const fileStream = fs.createWriteStream(fileDest);
    response.pipe(fileStream);

    fileStream.on('finish', () => {
      console.log(`Downloaded ${fileName}`);
      fileStream.close();
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${fileName}:`, err.message);
  });
}); 