const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

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
    throw new Error(`Can't reach the GearTrack backend at ${API_BASE}. Check that the server is running.`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status}).`);
  }
  return data;
}

export function getHealth() {
  return request('/api/health');
}

export function getDashboard() {
  return request('/api/dashboard');
}

export async function getEquipment() {
  const data = await request('/api/equipment');
  if (Array.isArray(data)) return data;
  return Array.isArray(data.equipment) ? data.equipment : [];
}

export function askGearTrackAI(message) {
  return request('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export { API_BASE };

export function addEquipment(item) {
  return request('/api/equipment', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export function deleteEquipment(id) {
  return request(`/api/equipment/${id}`, {
    method: 'DELETE',
  });
}