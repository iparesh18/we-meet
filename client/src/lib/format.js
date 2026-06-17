export function timeAgo(date) {
  if (!date) return '';
  const d = new Date(date).getTime();
  if (Number.isNaN(d)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - d) / 1000));
  if (secs < 5) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export function clock(date) {
  if (!date) return '';
  const x = new Date(date);
  if (Number.isNaN(x.getTime())) return '';
  return x.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0].toUpperCase();
}
