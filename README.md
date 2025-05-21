# Floating Agent Chrome Extension

A Chrome Extension for enhanced browsing experience.

## Setup Instructions

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Development

- `manifest.json`: Extension configuration
- `popup.html`: Extension popup interface
- `popup.js`: Popup functionality
- `background.js`: Background service worker
- `styles.css`: Popup styling

## Adding Icons

Place your extension icons in the `icons` directory with the following sizes:
- 16x16 pixels (icon16.png)
- 48x48 pixels (icon48.png)
- 128x128 pixels (icon128.png)

## Testing

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension card
4. Test the changes

## Building

To create a production build:
1. Zip all files (excluding development files)
2. Submit to Chrome Web Store 