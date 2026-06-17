const SS_PREFIX = 'swastik:';

// sessionStorage holds per-tab class/participant context.
export const session = {
  get(key) {
    try {
      const raw = sessionStorage.getItem(SS_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(SS_PREFIX + key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
  remove(key) {
    try {
      sessionStorage.removeItem(SS_PREFIX + key);
    } catch {
      /* ignore */
    }
  },
};

/** Per-class participant context for the student tab. */
export function saveParticipant(classCode, data) {
  session.set(`participant:${classCode}`, data);
}
export function loadParticipant(classCode) {
  return session.get(`participant:${classCode}`);
}
export function clearParticipant(classCode) {
  session.remove(`participant:${classCode}`);
}

/** A stable per-browser device id (used to block removed/rejected rejoins). */
export function getDeviceId() {
  try {
    let id = localStorage.getItem('swastik:deviceId');
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('swastik:deviceId', id);
    }
    return id;
  } catch {
    return 'anonymous-device';
  }
}

/** Persist the host key as a fallback (the URL query string is the source of truth). */
export function saveHostKey(classCode, hostKey) {
  try {
    localStorage.setItem(`swastik:host:${classCode}`, hostKey);
  } catch {
    /* ignore */
  }
}
export function loadHostKey(classCode) {
  try {
    return localStorage.getItem(`swastik:host:${classCode}`);
  } catch {
    return null;
  }
}
