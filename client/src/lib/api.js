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

// Control endpoints (admit/reject/remove/lock/unlock/end/attendance/roster) are
// authorized for BOTH the host and a captain. `auth` may be a hostKey string
// (back-compat with the host pages) or an object `{ hostKey }` / `{ captainId }`.
function authParams(auth) {
  if (typeof auth === 'string') return { hostKey: auth };
  if (auth && auth.captainId) return { captainId: auth.captainId };
  if (auth && auth.hostKey) return { hostKey: auth.hostKey };
  return {};
}

export const api = {
  createClass: (title) => request('/api/classes/create', { method: 'POST', body: { title } }),
  getPublicClass: (code) => request(`/api/classes/${code}/public`),
  getHostClass: (code, auth) => request(`/api/classes/${code}/host`, { query: authParams(auth) }),
  lock: (code, auth) => request(`/api/classes/${code}/lock`, { method: 'POST', body: authParams(auth) }),
  unlock: (code, auth) => request(`/api/classes/${code}/unlock`, { method: 'POST', body: authParams(auth) }),
  end: (code, auth) => request(`/api/classes/${code}/end`, { method: 'POST', body: authParams(auth) }),

  joinRequest: (payload) => request('/api/participants/join-request', { method: 'POST', body: payload }),
  admit: (participantId, code, auth) =>
    request(`/api/participants/${participantId}/admit`, { method: 'POST', body: { classCode: code, ...authParams(auth) } }),
  reject: (participantId, code, auth) =>
    request(`/api/participants/${participantId}/reject`, { method: 'POST', body: { classCode: code, ...authParams(auth) } }),
  remove: (participantId, code, auth) =>
    request(`/api/participants/${participantId}/remove`, { method: 'POST', body: { classCode: code, ...authParams(auth) } }),
  participantStatus: (participantId) => request(`/api/participants/status/${participantId}`),
  listParticipants: (code, auth) => request(`/api/participants/${code}`, { query: authParams(auth) }),

  hostToken: (code, hostKey, name) =>
    request('/api/livekit/host-token', { method: 'POST', body: { classCode: code, hostKey, name } }),
  studentToken: (participantId, name) =>
    request('/api/livekit/student-token', { method: 'POST', body: { participantId, name } }),
  // A promoted student swaps their student token for a captain (co-host) token.
  captainToken: (code, captainId, name) =>
    request('/api/livekit/captain-token', { method: 'POST', body: { classCode: code, captainId, name } }),

  attendance: (code, auth) => request(`/api/attendance/${code}`, { query: authParams(auth) }),
  health: () => request('/api/health'),
};
