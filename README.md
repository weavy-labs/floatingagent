# Floating Agent Chrome Extension

A Chrome extension that provides a floating panel interface integrated with Weavy for agent management.

## Features

- Floating panel interface that can be toggled on any webpage
- Integration with Weavy for agent communication
- Text selection and content sharing capabilities
- Secure authentication system
- DOM interaction capabilities

## Prerequisites

- Node.js (v14 or higher)
- Chrome browser
- A Weavy account and API credentials

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd floatingagent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   WEAVY_URL=your-weavy-instance-url
   WEAVY_API_KEY=your-weavy-api-key
   PORT=3000
   ```

4. Download Weavy assets:
   ```bash
   node download-weavy.js
   ```

5. Start the local server:
   ```bash
   node server.js
   ```

## Installing the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extension directory
4. The extension icon should appear in your Chrome toolbar

## Usage

1. Click the extension icon in the Chrome toolbar to open the authentication popup
2. Enter your name and email to get started
3. Use the floating panel by clicking the extension icon again on any webpage
4. Select text on the webpage and use the panel interface to interact with the agent

## File Structure

- `manifest.json` - Extension configuration
- `content-script.js` - Manages floating panel and iframe communication
- `popup.js` - Handles user authentication
- `weavy-loader.js` - Manages Weavy asset loading
- `download-weavy.js` - Downloads required Weavy assets
- `server.js` - Local server for token management

## Development

To make changes to the extension:

1. Make your code changes
2. Reload the extension from `chrome://extensions/`
3. If you modify server code, restart the local server

## Security Notes

- Store sensitive credentials in the `.env` file
- Never commit the `.env` file to version control
- Keep your Weavy API key secure
- Use secure HTTPS endpoints in production

## Troubleshooting

- If the panel doesn't appear, check the console for errors
- Ensure the local server is running on port 3000
- Verify your Weavy credentials in the `.env` file
- Check that all required permissions are enabled in Chrome

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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