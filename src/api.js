
const API_BASE = (
  import.meta.env.VITE_API_URL || 'https://edp-backend-qmhp.onrender.com'
).replace(/\/+$/, '');

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `Cannot reach the GearTrack backend at ${API_BASE}. Check your backend URL and server status.`
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Request failed (${response.status}).`
    );
  }

  return data;
}

// Check backend health
export function getHealth() {
  return request('/api/health');
}

// Get dashboard totals
export function getDashboard() {
  return request('/api/dashboard');
}

// Get all equipment
export async function getEquipment() {
  const data = await request('/api/equipment');

  if (Array.isArray(data)) return data;

  return Array.isArray(data.equipment) ? data.equipment : [];
}

// Send a message to GearTrack AI
export function askGearTrackAI(message) {
  return request('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

// Add equipment
export function addEquipment(item) {
  return request('/api/equipment', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

// Update equipment by ID
export function updateEquipment(id, item) {
  return request(`/api/equipment/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
}

// Delete equipment by ID
export function deleteEquipment(id) {
  return request(`/api/equipment/${id}`, {
    method: 'DELETE',
  });
}

export { API_BASE };
