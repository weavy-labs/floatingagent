const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const WEAVY_URL = process.env.WEAVY_URL;
const WEAVY_API_KEY = process.env.WEAVY_API_KEY;

// Validate required environment variables
if (!WEAVY_URL || !WEAVY_API_KEY) {
  console.error('Missing required environment variables:');
  if (!WEAVY_URL) console.error('- WEAVY_URL');
  if (!WEAVY_API_KEY) console.error('- WEAVY_API_KEY');
  process.exit(1);
}

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

// Get Weavy agents endpoint
app.get('/api/agents', async (req, res) => {
  try {
    console.log('[/api/agents] Fetching agents from Weavy...');

    // First get the agents
    console.log('[/api/agents] Making request to:', `${WEAVY_URL}/api/agents`);
    const response = await fetch(`${WEAVY_URL}/api/agents`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WEAVY_API_KEY}`
      }
    });

    console.log('[/api/agents] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[/api/agents] Error response body:', errorText);
      throw new Error(`Failed to fetch agents: ${response.status} ${response.statusText}`);
    }

    const agents = await response.json();
    console.log('[/api/agents] Raw agents response:', agents);
    
    // Ensure we have an array to work with
    const agentsList = Array.isArray(agents) ? agents : (agents.data || []);
    
    // Now get knowledge bases and details for each agent
    const agentsWithKnowledge = await Promise.all(agentsList.map(async agent => {
      try {
        // Get agent details including instructions
        const detailsResponse = await fetch(`${WEAVY_URL}/api/agents/${agent.uid}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${WEAVY_API_KEY}`
          }
        });

        if (detailsResponse.ok) {
          const details = await detailsResponse.json();
          agent.instructions = details.instructions;
        }

        // Get knowledge bases
        const knowledgeResponse = await fetch(`${WEAVY_URL}/api/agents/${agent.uid}/knowledge`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${WEAVY_API_KEY}`
          }
        });

        if (knowledgeResponse.ok) {
          const knowledge = await knowledgeResponse.json();
          // Add the knowledge base ID to the agent if it exists
          if (knowledge.data && knowledge.data.length > 0) {
            agent.knowledge_base_id = knowledge.data[0].id;
          }
        }
        return agent;
      } catch (error) {
        console.error(`[/api/agents] Error fetching details for agent ${agent.uid}:`, error);
        return agent;
      }
    }));

    console.log('[/api/agents] Successfully fetched agents with knowledge:', {
      count: agentsWithKnowledge.length,
      agents: agentsWithKnowledge.map(a => ({
        uid: a.uid,
        name: a.name,
        knowledge_base_id: a.knowledge_base_id,
        instructions: a.instructions ? 'present' : 'missing'
      }))
    });
    
    res.json({ data: agentsWithKnowledge });
  } catch (error) {
    console.error('[/api/agents] Error fetching agents:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message || 'Failed to fetch agents' });
  }
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

    const tokenEndpoint = `${WEAVY_URL}/api/users/${encodeURIComponent(email)}/tokens`;

    console.log('Making request to Weavy:', {
      url: tokenEndpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEAVY_API_KEY}`
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
        "Authorization": `Bearer ${WEAVY_API_KEY}`
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

// Save selection endpoint
app.post('/api/save-selection', async (req, res) => {
  try {
    const { html, text, timestamp, knowledgeBaseId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text content provided' });
    }

    if (!knowledgeBaseId) {
      return res.status(400).json({ error: 'No knowledge base ID provided' });
    }

    const weavyUrl = WEAVY_URL;
    const apiKey = WEAVY_API_KEY;

    // Prepare the file content
    const content = text;
    const filename = `selection_${timestamp.replace(/[:.]/g, '-')}.txt`;

    // Create a Buffer from the content
    const buffer = Buffer.from(content);

    // First, create a blob
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: filename,
      contentType: 'text/plain'
    });

    console.log('[/api/save-selection] Creating blob for file:', filename);
    const blobResponse = await fetch(`${weavyUrl}/api/blobs`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!blobResponse.ok) {
      throw new Error(`Failed to create blob: ${blobResponse.status} ${blobResponse.statusText}`);
    }

    const blob = await blobResponse.json();
    console.log('[/api/save-selection] Blob created successfully:', blob.id);

    // Now create the file using the blob ID in the specified knowledge base files app
    console.log(`[/api/save-selection] Creating file in knowledge base ${knowledgeBaseId}`);
    const fileResponse = await fetch(`${weavyUrl}/api/apps/${knowledgeBaseId}/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        name: filename,
        blob_id: blob.id
      })
    });

    if (!fileResponse.ok) {
      throw new Error(`Failed to create file: ${fileResponse.status} ${fileResponse.statusText}`);
    }

    const fileResult = await fileResponse.json();
    console.log('[/api/save-selection] File created successfully:', {
      name: fileResult.name,
      id: fileResult.id,
      knowledgeBaseId
    });

    res.json({
      success: true,
      message: 'Selection uploaded to Weavy successfully',
      file: fileResult
    });

  } catch (error) {
    console.error('[/api/save-selection] Error saving selection:', error);
    res.status(500).json({ error: error.message || 'Failed to save selection' });
  }
});

// Create agent endpoint
app.post('/api/agents', async (req, res) => {
  try {
    const { name, instructions, avatar } = req.body;

    if (!name || !instructions) {
      console.log('[/api/agents] Missing required fields:', { name, instructions });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate a UID based on the name
    const uid = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove special characters
      .substring(0, 20); // Limit length

    console.log('[/api/agents] Creating new agent:', {
      uid,
      name,
      instructions: instructions ? 'present' : 'missing',
      hasAvatar: !!avatar
    });

    let blobId = null;
    
    // If avatar is provided, create a blob for it first
    if (avatar) {
      const imageBuffer = Buffer.from(avatar.split(',')[1], 'base64');
      const formData = new FormData();
      formData.append('file', imageBuffer, {
        filename: `${uid}-avatar.png`,
        contentType: 'image/png'
      });

      console.log('[/api/agents] Creating blob for avatar');
      const blobResponse = await fetch(`${WEAVY_URL}/api/blobs`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WEAVY_API_KEY}`
        },
        body: formData
      });

      if (!blobResponse.ok) {
        const errorText = await blobResponse.text();
        console.error('[/api/agents] Error creating avatar blob:', {
          status: blobResponse.status,
          statusText: blobResponse.statusText,
          error: errorText
        });
        throw new Error(`Failed to create avatar blob: ${blobResponse.status} ${blobResponse.statusText}`);
      }

      const blob = await blobResponse.json();
      blobId = blob.id;
      console.log('[/api/agents] Avatar blob created successfully:', blobId);
    }

    // First create a files app for the agent
    const filesAppUid = `${uid}-files`;
    const filesAppResponse = await fetch(`${WEAVY_URL}/api/apps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WEAVY_API_KEY}`
      },
      body: JSON.stringify({
        uid: filesAppUid,
        name: `${name}'s Files`,
        type: "files",
        access: "write"
      })
    });

    if (!filesAppResponse.ok) {
      const errorText = await filesAppResponse.text();
      console.error('[/api/agents] Error creating files app:', {
        status: filesAppResponse.status,
        statusText: filesAppResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to create files app: ${filesAppResponse.status} ${filesAppResponse.statusText}`);
    }

    const filesApp = await filesAppResponse.json();
    console.log('[/api/agents] Files app created:', filesApp);

    // Now create the agent with the files app
    const createAgentResponse = await fetch(`${WEAVY_URL}/api/agents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WEAVY_API_KEY}`
      },
      body: JSON.stringify({
        uid,
        name,
        instructions,
        type: "copilot",
        model: "weavy",
        provider: "weavy",
        knowledge_base_id: filesApp.id,
        ...(blobId && { picture: blobId })  // Add picture if avatar was provided
      })
    });

    if (!createAgentResponse.ok) {
      const errorText = await createAgentResponse.text();
      console.error('[/api/agents] Error creating agent:', {
        status: createAgentResponse.status,
        statusText: createAgentResponse.statusText,
        error: errorText,
        requestBody: {
          uid,
          name,
          instructions: instructions ? 'present' : 'missing',
          hasAvatar: !!avatar
        }
      });
      throw new Error(`Failed to create agent: ${createAgentResponse.status} ${createAgentResponse.statusText}`);
    }

    const createdAgent = await createAgentResponse.json();
    console.log('[/api/agents] Agent created successfully:', createdAgent);

    // Return the created agent with the files app ID
    res.json({
      ...createdAgent,
      knowledge_base_id: filesApp.id
    });
  } catch (error) {
    console.error('[/api/agents] Error creating agent:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: error.message || 'Failed to create agent',
      details: error.stack
    });
  }
});

// Update agent endpoint
app.put('/api/agents/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, instructions } = req.body;

    if (!uid || !name || !instructions) {
      console.log('[/api/agents/:uid] Missing required fields:', { uid, name, instructions });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('[/api/agents/:uid] Updating agent:', {
      uid,
      name,
      instructions: instructions ? 'present' : 'missing'
    });

    // First get the current agent to ensure it exists and get all properties
    const getResponse = await fetch(`${WEAVY_URL}/api/agents/${uid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WEAVY_API_KEY}`
      }
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('[/api/agents/:uid] Error getting agent:', {
        status: getResponse.status,
        statusText: getResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to get agent: ${getResponse.status} ${getResponse.statusText}`);
    }

    const currentAgent = await getResponse.json();
    console.log('[/api/agents/:uid] Current agent:', currentAgent);

    // Now update with new values while preserving other properties
    const updateResponse = await fetch(`${WEAVY_URL}/api/agents/${uid}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WEAVY_API_KEY}`
      },
      body: JSON.stringify({
        name,
        instructions
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('[/api/agents/:uid] Error updating agent:', {
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        error: errorText,
        requestBody: {
          name,
          instructions: instructions ? 'present' : 'missing'
        }
      });
      throw new Error(`Failed to update agent: ${updateResponse.status} ${updateResponse.statusText}`);
    }

    const updatedAgent = await updateResponse.json();
    console.log('[/api/agents/:uid] Agent updated successfully:', updatedAgent);

    res.json(updatedAgent);
  } catch (error) {
    console.error('[/api/agents/:uid] Error updating agent:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: error.message || 'Failed to update agent',
      details: error.stack
    });
  }
});

// Update agent avatar endpoint
app.post('/api/agents/:uid/avatar', async (req, res) => {
  try {
    const { uid } = req.params;
    const { image } = req.body;  // Base64 encoded image

    if (!uid || !image) {
      console.log('[/api/agents/:uid/avatar] Missing required fields:', { uid, hasImage: !!image });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(image.split(',')[1], 'base64');
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: `${uid}-avatar.png`,
      contentType: 'image/png'
    });

    // First create a blob for the image
    console.log('[/api/agents/:uid/avatar] Creating blob for avatar');
    const blobResponse = await fetch(`${WEAVY_URL}/api/blobs`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WEAVY_API_KEY}`
      },
      body: formData
    });

    if (!blobResponse.ok) {
      const errorText = await blobResponse.text();
      console.error('[/api/agents/:uid/avatar] Error creating blob:', {
        status: blobResponse.status,
        statusText: blobResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to create blob: ${blobResponse.status} ${blobResponse.statusText}`);
    }

    const blob = await blobResponse.json();
    console.log('[/api/agents/:uid/avatar] Blob created successfully:', blob.id);

    // Now update the agent with the new avatar
    const updateResponse = await fetch(`${WEAVY_URL}/api/agents/${uid}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WEAVY_API_KEY}`
      },
      body: JSON.stringify({
        picture: blob.id
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('[/api/agents/:uid/avatar] Error updating agent avatar:', {
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to update agent avatar: ${updateResponse.status} ${updateResponse.statusText}`);
    }

    const updatedAgent = await updateResponse.json();
    console.log('[/api/agents/:uid/avatar] Agent avatar updated successfully:', updatedAgent);

    res.json(updatedAgent);
  } catch (error) {
    console.error('[/api/agents/:uid/avatar] Error updating agent avatar:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: error.message || 'Failed to update agent avatar',
      details: error.stack
    });
  }
});

// Delete agent endpoint
app.delete('/api/agents/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      console.log('[/api/agents/:uid DELETE] Missing required fields:', { uid });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('[/api/agents/:uid DELETE] Deleting agent:', { uid });

    // First get the agent to ensure it exists and get the knowledge base ID
    const getResponse = await fetch(`${WEAVY_URL}/api/agents/${uid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WEAVY_API_KEY}`
      }
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('[/api/agents/:uid DELETE] Error getting agent:', {
        status: getResponse.status,
        statusText: getResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to get agent: ${getResponse.status} ${getResponse.statusText}`);
    }

    const agent = await getResponse.json();
    console.log('[/api/agents/:uid DELETE] Found agent:', agent);

    // Delete the agent
    const deleteResponse = await fetch(`${WEAVY_URL}/api/agents/${uid}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${WEAVY_API_KEY}`
      }
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.error('[/api/agents/:uid DELETE] Error deleting agent:', {
        status: deleteResponse.status,
        statusText: deleteResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to delete agent: ${deleteResponse.status} ${deleteResponse.statusText}`);
    }

    // Try to delete the associated files app if it exists
    const filesAppUid = `${uid}-files`;
    const filesAppResponse = await fetch(`${WEAVY_URL}/api/apps/${filesAppUid}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${WEAVY_API_KEY}`
      }
    });

    // Log but don't fail if files app deletion fails
    if (!filesAppResponse.ok) {
      console.warn('[/api/agents/:uid DELETE] Warning: Failed to delete files app:', {
        status: filesAppResponse.status,
        statusText: filesAppResponse.statusText
      });
    } else {
      console.log('[/api/agents/:uid DELETE] Files app deleted successfully');
    }

    console.log('[/api/agents/:uid DELETE] Agent deleted successfully');
    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('[/api/agents/:uid DELETE] Error deleting agent:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: error.message || 'Failed to delete agent',
      details: error.stack
    });
  }
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