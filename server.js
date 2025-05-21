const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: '*', // Be more restrictive in production
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.render('index', { title: 'Floating Agent' });
});

// API routes
app.get('/api/status', (req, res) => {
  res.json({ status: 'active' });
});

// Weavy token endpoint
app.post('/api/weavy-token', async (req, res) => {
  try {
    console.log('Token request received:', req.body);
    const { name, email } = req.body;
    
    if (!email || !name) {
      console.log('Missing required fields:', { email, name });
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Log the request for debugging
    console.log('Requesting Weavy token for:', { name, email });

    const weavyUrl = "https://77d53be50974490089ac2382a8e9e510.weavy.io";
    const apiKey = "wys_3s76r4DGnM0ijHkmRSLWT0S5AI9Ven2rhwim";
    const tokenEndpoint = `${weavyUrl}/api/users/${encodeURIComponent(email)}/tokens`;

    console.log('Making request to Weavy:', {
      url: tokenEndpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: {
        email: email,
        name: name
      }
    });

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        uid: email,
        email: email,
        name: name
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Weavy API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to get Weavy token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Weavy token generated successfully:', {
      tokenLength: data.access_token ? data.access_token.length : 0
    });
    res.json({ access_token: data.access_token });
  } catch (error) {
    console.error('Weavy token error:', error);
    res.status(500).json({ error: error.message || 'Failed to get Weavy token' });
  }
});

// Features endpoint for the extension
app.get('/api/features', (req, res) => {
  res.json({
    features: [
      {
        title: 'Feature 1',
        description: 'This is the first feature of the extension 222'
      },
      {
        title: 'Feature 2',
        description: 'This is the second feature of the extension'
      },
      {
        title: 'Feature 3',
        description: 'This is the third feature of the extension'
      }
    ]
  });
});

// DOM endpoint
app.post('/api/dom', (req, res) => {
  const { dom, url, title } = req.body;
  
  // Here you can process the DOM content
  console.log(`Received DOM from: ${url}`);
  console.log(`Page title: ${title}`);
  console.log(`DOM length: ${dom.length} characters`);
  
  // For now, we'll just acknowledge receipt
  res.json({
    success: true,
    message: 'DOM received successfully',
    url: url,
    title: title,
    domLength: dom.length
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('CORS enabled for all origins');
}); 