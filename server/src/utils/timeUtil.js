const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function pad(n) {
  return String(n).padStart(2, '0');
}

export function formatDate(d) {
  if (!d) return '-';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '-';
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export function formatDay(d) {
  if (!d) return '-';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '-';
  return DAYS[x.getDay()];
}

export function formatTime(d) {
  if (!d) return '-';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '-';
  return `${pad(x.getHours())}:${pad(x.getMinutes())}:${pad(x.getSeconds())}`;
}

export function formatDateTime(d) {
  if (!d) return '-';
  const date = formatDate(d);
  if (date === '-') return '-';
  return `${date} ${formatTime(d)}`;
}
