// Store current agent data
let currentAgentData = null;
let isCreating = false;
let currentAvatarBase64 = null;  // Store the current avatar as base64
let editModal = null; // Store modal instance

// Function to update UI for empty state
function updateEmptyState(hasAgents) {
  console.log('[updateEmptyState] Updating UI for empty state:', { hasAgents });
  const emptyState = document.querySelector('.empty-state');
  const copilot = document.getElementById('floatingAgentCopilot');
  const editBtn = document.getElementById('editAgentBtn');
  const select = document.getElementById('agentSelect');

  console.log('[updateEmptyState] Found elements:', {
    emptyState: !!emptyState,
    copilot: !!copilot,
    editBtn: !!editBtn,
    select: !!select
  });

  if (!hasAgents) {
    // Show empty state
    if (emptyState) {
      emptyState.style.display = 'flex';
      console.log('[updateEmptyState] Showing empty state');
    }
    if (copilot) {
      copilot.style.opacity = '0.5';
      copilot.style.pointerEvents = 'none';
    }
    if (editBtn) editBtn.style.display = 'none';
    if (select) select.innerHTML = '<option value="" disabled selected>Create your first agent</option>';

    // Setup empty state create button
    const emptyStateCreateBtn = document.getElementById('emptyStateCreateBtn');
    console.log('[updateEmptyState] Found empty state create button:', !!emptyStateCreateBtn);
    
    if (emptyStateCreateBtn) {
      // Remove any existing listeners
      emptyStateCreateBtn.replaceWith(emptyStateCreateBtn.cloneNode(true));
      const newBtn = document.getElementById('emptyStateCreateBtn');
      
      newBtn.addEventListener('click', () => {
        console.log('[emptyStateCreateBtn] Button clicked');
        isCreating = true;
        const modalTitle = document.getElementById('editAgentModalLabel');
        const filesSection = document.querySelector('.files-section');
        const deleteBtn = document.getElementById('deleteAgentBtn');
        const avatarInput = document.getElementById('agentAvatar');

        if (modalTitle) modalTitle.textContent = 'Create New Agent';
        if (filesSection) filesSection.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';

        // Clear form fields
        const nameInput = document.getElementById('agentName');
        const instructionsInput = document.getElementById('agentInstructions');
        if (nameInput) nameInput.value = '';
        if (instructionsInput) instructionsInput.value = '';
        
        // Reset avatar preview
        currentAvatarBase64 = null;
        const preview = document.getElementById('avatarPreview');
        const previewIcon = document.querySelector('.avatar-preview wy-icon');
        if (preview) {
          preview.style.display = 'none';
          preview.src = '';
        }
        if (previewIcon) previewIcon.style.display = 'block';
        if (avatarInput) avatarInput.value = '';

        // Show modal
        if (editModal) {
          console.log('[emptyStateCreateBtn] Showing modal');
          editModal.show();
        }
      });
    }
  } else {
    // Hide empty state
    if (emptyState) emptyState.style.display = 'none';
    if (copilot) {
      copilot.style.opacity = '';
      copilot.style.pointerEvents = '';
    }
    if (editBtn) editBtn.style.display = '';
  }
}

// Function to initialize modals
function initializeModals() {
  console.log('[initializeModals] Setting up modals');
  const editModalElement = document.getElementById('editAgentModal');
  if (editModalElement) {
    editModal = new bootstrap.Modal(editModalElement, {
      backdrop: 'static',
      keyboard: false
    });
    
    // Setup modal events
    editModalElement.addEventListener('hidden.bs.modal', () => {
      console.log('[modal] Edit modal hidden event triggered');
      cleanupModalBackdrop();
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('padding-right');
    });
  }
}

// Function to clean up modal backdrop
function cleanupModalBackdrop() {
  console.log('[cleanupModalBackdrop] Cleaning up modal backdrop');
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.remove();
  }
  document.body.classList.remove('modal-open');
  document.body.style.removeProperty('padding-right');
}

// Function to force close modal
function forceCloseModal() {
  console.log('[forceCloseModal] Force closing modal');
  if (editModal) {
    editModal.hide();
  }
  const modalElement = document.getElementById('editAgentModal');
  if (modalElement) {
    modalElement.style.display = 'none';
    modalElement.classList.remove('show');
    modalElement.setAttribute('aria-hidden', 'true');
    modalElement.removeAttribute('aria-modal');
    modalElement.removeAttribute('role');
  }
  cleanupModalBackdrop();
}

// Function to handle file input change
function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      currentAvatarBase64 = e.target.result;
      const preview = document.getElementById('avatarPreview');
      preview.src = currentAvatarBase64;
      preview.style.display = 'block';
      document.querySelector('.avatar-preview wy-icon').style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
}

// Function to load and populate agents
async function loadAgents() {
  console.log('[loadAgents] Starting to load agents');
  try {
    // Initialize modals first
    initializeModals();
    
    const response = await fetch('http://localhost:3000/api/agents');
    console.log('[loadAgents] API response status:', response.status);
    
    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }
    
    const data = await response.json();
    console.log('[loadAgents] Received data:', data);
    
    // Ensure we have the agents array from the response
    const agents = data.data || [];
    console.log('[loadAgents] Processed agents:', agents);
    
    const select = document.getElementById('agentSelect');
    if (select) {
      select.innerHTML = ''; // Clear loading option
      console.log('[loadAgents] Cleared select options');
    }
    
    // Update empty state
    updateEmptyState(agents.length > 0);
    
    // Setup modal hidden event listeners
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    
    if (deleteConfirmModal) {
      deleteConfirmModal.addEventListener('hidden.bs.modal', () => {
        console.log('[modal] Delete modal hidden event triggered');
        cleanupModalBackdrop();
      });
    }
    
    if (agents.length > 0) {
      console.log('[loadAgents] Populating select with agents');
      agents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.uid;
        option.textContent = agent.name;
        // Store knowledge_base_id as a data attribute
        if (agent.knowledge_base_id) {
          option.dataset.knowledgeBaseId = agent.knowledge_base_id;
        }
        // Store the full agent data as a data attribute
        option.dataset.agent = JSON.stringify(agent);
        if (select) select.appendChild(option);
      });
    }

    function updateCopilotAgent(agentUid) {
      console.log('Updating copilot agent to:', agentUid);
      const copilot = document.getElementById('floatingAgentCopilot');
      const selectedOption = select.options[select.selectedIndex];
      
      if (copilot && agentUid) {
        // Reset copilot before changing agent
        copilot.reset();
        
        // Set both attribute and property
        copilot.setAttribute('agent', agentUid);
        copilot.agent = agentUid;

        // Store the knowledge base ID in a data attribute on the copilot
        if (selectedOption && selectedOption.dataset.knowledgeBaseId) {
          copilot.dataset.knowledgeBaseId = selectedOption.dataset.knowledgeBaseId;
          console.log('Updated knowledge base ID:', selectedOption.dataset.knowledgeBaseId);
        } else {
          delete copilot.dataset.knowledgeBaseId;
        }

        // Update current agent data
        if (selectedOption && selectedOption.dataset.agent) {
          currentAgentData = JSON.parse(selectedOption.dataset.agent);
        }

        console.log('Updated copilot element:', {
          element: copilot,
          attribute: copilot.getAttribute('agent'),
          property: copilot.agent,
          knowledgeBaseId: copilot.dataset.knowledgeBaseId
        });
      }
    }

    // Update copilot agent when selection changes
    select.addEventListener('change', (e) => {
      updateCopilotAgent(e.target.value);
    });

    // Set initial agent if available
    if (agents.length > 0) {
      select.value = agents[0].uid;
      updateCopilotAgent(agents[0].uid);
    }

    // Setup edit button handler
    const editBtn = document.getElementById('editAgentBtn');
    const createBtn = document.getElementById('createAgentBtn');
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    const modalTitle = document.getElementById('editAgentModalLabel');
    const filesSection = document.querySelector('.files-section');
    const avatarInput = document.getElementById('agentAvatar');
    const deleteBtn = document.getElementById('deleteAgentBtn');
    
    // Setup avatar change handler
    avatarInput.addEventListener('change', handleAvatarChange);
    
    editBtn.addEventListener('click', () => {
      if (currentAgentData) {
        isCreating = false;
        modalTitle.textContent = 'Edit Agent';
        filesSection.style.display = 'block';
        deleteBtn.style.display = 'block';  // Show delete button in edit mode
        
        // Populate form fields
        document.getElementById('agentName').value = currentAgentData.name || '';
        document.getElementById('agentInstructions').value = currentAgentData.instructions || '';
        
        // Reset avatar preview
        currentAvatarBase64 = null;
        const preview = document.getElementById('avatarPreview');
        preview.style.display = 'none';
        document.querySelector('.avatar-preview wy-icon').style.display = 'block';
        avatarInput.value = '';  // Reset file input
        
        // Setup files component
        const filesComponent = document.getElementById('agentFiles');
        if (filesComponent && currentAgentData.knowledge_base_id) {
          filesComponent.setAttribute('uid', currentAgentData.knowledge_base_id);
        }
        
        // Cleanup any existing backdrop before showing modal
        cleanupModalBackdrop();
        // Show modal
        editModal.show();
      }
    });

    // Setup create button handler
    createBtn.addEventListener('click', () => {
      isCreating = true;
      modalTitle.textContent = 'Create New Agent';
      filesSection.style.display = 'none';
      deleteBtn.style.display = 'none';  // Hide delete button in create mode
      
      // Clear form fields
      document.getElementById('agentName').value = '';
      document.getElementById('agentInstructions').value = '';
      
      // Reset avatar preview
      currentAvatarBase64 = null;
      const preview = document.getElementById('avatarPreview');
      preview.style.display = 'none';
      document.querySelector('.avatar-preview wy-icon').style.display = 'block';
      avatarInput.value = '';  // Reset file input
      
      // Cleanup any existing backdrop before showing modal
      cleanupModalBackdrop();
      // Show modal
      editModal.show();
    });

    // Setup delete button handlers
    deleteBtn.addEventListener('click', () => {
      if (currentAgentData) {
        // Update confirmation modal with agent name
        document.getElementById('deleteAgentName').textContent = currentAgentData.name;
        // Hide edit modal and show delete confirmation
        editModal.hide();
        // Small delay to ensure proper modal transition
        setTimeout(() => {
          cleanupModalBackdrop();
          deleteModal.show();
        }, 200);
      }
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
      try {
        if (!currentAgentData || !currentAgentData.uid) {
          throw new Error('No agent selected');
        }

        const response = await fetch(`http://localhost:3000/api/agents/${currentAgentData.uid}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete agent');
        }

        // Hide delete confirmation modal and cleanup
        deleteModal.hide();
        cleanupModalBackdrop();

        // Refresh agents list
        await loadAgents();

        // Show success message
        const event = new CustomEvent('showSuccess', { 
          detail: 'Agent deleted successfully' 
        });
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Error deleting agent:', error);
        const event = new CustomEvent('showError', { detail: error.message });
        window.dispatchEvent(event);
      }
    });

    // Setup save button handler
    document.getElementById('saveAgentBtn').addEventListener('click', async () => {
      try {
        const name = document.getElementById('agentName').value;
        const instructions = document.getElementById('agentInstructions').value;

        if (!name || !instructions) {
          throw new Error('Name and instructions are required');
        }

        let response;
        if (isCreating) {
          // Create new agent
          response = await fetch('http://localhost:3000/api/agents', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name,
              instructions,
              avatar: currentAvatarBase64
            })
          });
        } else {
          // Update existing agent
          if (!currentAgentData || !currentAgentData.uid) {
            throw new Error('No agent selected');
          }

          // First update the agent details
          response = await fetch(`http://localhost:3000/api/agents/${currentAgentData.uid}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name,
              instructions
            })
          });

          if (!response.ok) {
            throw new Error('Failed to update agent details');
          }

          // If there's a new avatar, update it separately
          if (currentAvatarBase64) {
            const avatarResponse = await fetch(`http://localhost:3000/api/agents/${currentAgentData.uid}/avatar`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                image: currentAvatarBase64
              })
            });

            if (!avatarResponse.ok) {
              throw new Error('Failed to update agent avatar');
            }

            response = avatarResponse; // Use the avatar response as the final response
          }
        }

        if (!response.ok) {
          throw new Error(`Failed to ${isCreating ? 'create' : 'update'} agent`);
        }

        // Refresh agents list
        await loadAgents();
        
        // Force close the modal
        forceCloseModal();
        
        // Show success message
        const event = new CustomEvent('showSuccess', { 
          detail: `Agent ${isCreating ? 'created' : 'updated'} successfully` 
        });
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Error saving agent:', error);
        const event = new CustomEvent('showError', { detail: error.message });
        window.dispatchEvent(event);
      }
    });

    // Setup close button handler
    const closeButton = document.querySelector('#editAgentModal .btn-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        console.log('[closeButton] Close button clicked');
        forceCloseModal();
      });
    }

  } catch (error) {
    console.error('Error loading agents:', error);
    const select = document.getElementById('agentSelect');
    if (select) {
      select.innerHTML = '<option value="">Error loading agents</option>';
    }
    // Show empty state with error
    updateEmptyState(false);
    const emptyStateText = document.querySelector('.empty-state p');
    if (emptyStateText) {
      emptyStateText.textContent = 'Error loading agents';
    }
  }
}

// Load agents when the document is ready
document.addEventListener('DOMContentLoaded', loadAgents); 