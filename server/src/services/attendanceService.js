import * as store from '../store/index.js';
import { ApiError } from '../utils/ApiError.js';
import { formatDate, formatDay, formatTime, formatDateTime } from '../utils/timeUtil.js';

const COLUMNS = [
  'Date',
  'Day',
  'Time',
  'Class Code',
  'Student Name',
  'Join Request Time',
  'Allowed Time',
  'Status',
  'Removed Time',
  'Left Time',
];

function summarize(participants) {
  const summary = { total: participants.length, admitted: 0, waiting: 0, rejected: 0, removed: 0, left: 0 };
  for (const p of participants) {
    if (summary[p.status] !== undefined) summary[p.status] += 1;
  }
  return summary;
}

export async function buildAttendance(classCode) {
  const cls = await store.getClassByCode(classCode);
  if (!cls) throw new ApiError(404, 'Class not found');

  const participants = await store.getParticipantsByClass(classCode);
  const baseDate = cls.startedAt || cls.createdAt || new Date();

  const rows = participants.map((p) => ({
    Date: formatDate(baseDate),
    Day: formatDay(baseDate),
    Time: formatTime(baseDate),
    'Class Code': classCode,
    'Student Name': p.name,
    'Join Request Time': formatDateTime(p.requestedAt),
    'Allowed Time': formatDateTime(p.admittedAt),
    Status: p.status,
    'Removed Time': formatDateTime(p.removedAt),
    'Left Time': formatDateTime(p.leftAt),
  }));

  const filename = `Swastik_Attendance_${classCode}_${formatDate(baseDate)}.xlsx`;

  return {
    filename,
    columns: COLUMNS,
    rows,
    summary: summarize(participants),
    classTitle: cls.title,
  };
}
