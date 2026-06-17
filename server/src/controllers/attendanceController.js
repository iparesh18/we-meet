import { asyncHandler } from '../utils/asyncHandler.js';
import * as attendanceService from '../services/attendanceService.js';

export const download = asyncHandler(async (req, res) => {
  res.json(await attendanceService.buildAttendance(req.classSession.classCode));
});
