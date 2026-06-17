const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || '';

async function request(path, { method = 'GET', body, query } = {}) {
  const url = new URL(API_URL + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    const err = new Error('Cannot reach the Swastik server. Is the backend running on port 5000?');
    err.status = 0;
    err.cause = networkErr;
    throw err;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty / non-JSON body */
  }

  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = data && data.details;
    throw err;
  }
  return data;
}

export const api = {
  createClass: (title) => request('/api/classes/create', { method: 'POST', body: { title } }),
  getPublicClass: (code) => request(`/api/classes/${code}/public`),
  getHostClass: (code, hostKey) => request(`/api/classes/${code}/host`, { query: { hostKey } }),
  lock: (code, hostKey) => request(`/api/classes/${code}/lock`, { method: 'POST', body: { hostKey } }),
  unlock: (code, hostKey) => request(`/api/classes/${code}/unlock`, { method: 'POST', body: { hostKey } }),
  end: (code, hostKey) => request(`/api/classes/${code}/end`, { method: 'POST', body: { hostKey } }),

  joinRequest: (payload) => request('/api/participants/join-request', { method: 'POST', body: payload }),
  admit: (participantId, code, hostKey) =>
    request(`/api/participants/${participantId}/admit`, { method: 'POST', body: { classCode: code, hostKey } }),
  reject: (participantId, code, hostKey) =>
    request(`/api/participants/${participantId}/reject`, { method: 'POST', body: { classCode: code, hostKey } }),
  remove: (participantId, code, hostKey) =>
    request(`/api/participants/${participantId}/remove`, { method: 'POST', body: { classCode: code, hostKey } }),
  participantStatus: (participantId) => request(`/api/participants/status/${participantId}`),
  listParticipants: (code, hostKey) => request(`/api/participants/${code}`, { query: { hostKey } }),

  hostToken: (code, hostKey, name) =>
    request('/api/livekit/host-token', { method: 'POST', body: { classCode: code, hostKey, name } }),
  studentToken: (participantId, name) =>
    request('/api/livekit/student-token', { method: 'POST', body: { participantId, name } }),

  attendance: (code, hostKey) => request(`/api/attendance/${code}`, { query: { hostKey } }),
  health: () => request('/api/health'),
};
