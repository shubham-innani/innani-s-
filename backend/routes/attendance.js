const express = require('express');
const router = express.Router();
const { format, getDay, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } = require('date-fns');
const { formatInTimeZone, toDate } = require('date-fns-tz');
const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');
const { protect, adminOnly } = require('../middleware/auth');

const TIMEZONE = 'Asia/Kolkata';
const getTodayString = () => formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');

// @route GET /api/attendance/daily?date=YYYY-MM-DD
router.get('/daily', protect, async (req, res) => {
  try {
    const date = req.query.date || getTodayString();
    
    // Fetch active workers OR workers who have attendance marked on this specific date
    const attendancesForDate = await Attendance.find({ date });
    const markedWorkerIds = attendancesForDate.map(a => a.workerId.toString());
    
    const workers = await Worker.find({ 
      $or: [
        { active: true },
        { _id: { $in: markedWorkerIds } }
      ]
    }).sort({ createdAt: 1 });
    
    const attendanceMap = {};
    attendancesForDate.forEach(a => attendanceMap[a.workerId.toString()] = a);

    const result = workers.map(w => {
      const record = attendanceMap[w._id.toString()];
      return {
        workerId: w._id,
        name: w.name,
        title: w.title,
        status: record ? record.status : 'NOT_MARKED',
        comment: record ? record.comment : '',
        attendanceId: record ? record._id : null
      };
    });

    res.json({ date, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/attendance/bulk-mark
// @desc Save multiple attendance records at once
router.post('/bulk-mark', protect, adminOnly, async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{ workerId, status, comment }]
    
    const today = getTodayString();
    if (date > today) return res.status(400).json({ message: 'Cannot mark future dates' });

    const localNoon = toDate(date + 'T12:00:00+05:30'); 
    if (getDay(localNoon) === 0) {
      return res.status(400).json({ message: 'Cannot mark attendance on a Sunday' });
    }

    const bulkOps = records.map(r => ({
      updateOne: {
        filter: { workerId: r.workerId, date },
        update: {
          $set: {
            status: r.status,
            comment: r.status === 'ABSENT' ? r.comment : '',
            markedAt: new Date(),
            markedBy: req.user.id
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(bulkOps);

    res.json({ message: 'Attendance submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/attendance/monthly
router.get('/monthly', protect, async (req, res) => {
  try {
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month); 
    const { workerId } = req.query;

    if (req.user.role === 'worker' && workerId !== req.user.workerId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const monthStart = toDate(`${year}-${String(month).padStart(2, '0')}-01T00:00:00+05:30`);
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    let query = {
      date: {
        $gte: format(monthStart, 'yyyy-MM-dd'),
        $lte: format(monthEnd, 'yyyy-MM-dd')
      }
    };
    if (workerId) query.workerId = workerId;

    const records = await Attendance.find(query);
    const dataByWorker = {};
    records.forEach(r => {
      const wid = r.workerId.toString();
      if (!dataByWorker[wid]) dataByWorker[wid] = {};
      dataByWorker[wid][r.date] = r;
    });

    const workers = workerId ? await Worker.find({ _id: workerId }) : await Worker.find({ 
      $or: [
        { active: true },
        { _id: { $in: Object.keys(dataByWorker) } } // Include archived if they have records this month
      ] 
    });
    
    const response = workers.map(w => {
      const wid = w._id.toString();
      let present = 0, absent = 0, holidays = 0, workingDays = 0;
      let calendar = [];

      days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const isSunday = getDay(day) === 0;
        let status = 'NOT_MARKED';
        let comment = '';
        
        // Skip dates before worker joined
        const joined = toDate(w.joiningDate || '2026-08-01');
        const isBeforeJoining = day < joined && format(day, 'yyyy-MM-dd') !== format(joined, 'yyyy-MM-dd');

        if (isBeforeJoining) {
          status = 'NOT_APPLICABLE';
        } else if (isSunday) {
          status = 'HOLIDAY';
          holidays++;
        } else {
          workingDays++;
          if (dataByWorker[wid] && dataByWorker[wid][dateStr]) {
            status = dataByWorker[wid][dateStr].status;
            comment = dataByWorker[wid][dateStr].comment;
            if (status === 'PRESENT') present++;
            if (status === 'ABSENT') absent++;
          }
        }

        calendar.push({ date: dateStr, day: format(day, 'eeee'), status, comment });
      });

      const attendancePercentage = workingDays > 0 ? ((present / workingDays) * 100).toFixed(2) : '0.00';

      return {
        workerId: w._id,
        name: w.name,
        stats: {
          calendarDays: days.length,
          holidays,
          workingDays,
          present,
          absent,
          percentage: parseFloat(attendancePercentage)
        },
        calendar
      };
    });

    res.json(workerId ? response[0] : response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/attendance/history
router.get('/history', protect, adminOnly, async (req, res) => {
  try {
    const { workerId, month, year, status } = req.query;
    let query = {};
    
    if (workerId) query.workerId = workerId;
    if (status) query.status = status;
    if (month && year) {
      const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
      const monthEnd = `${year}-${String(month).padStart(2, '0')}-31`; 
      query.date = { $gte: monthStart, $lte: monthEnd };
    }

    const records = await Attendance.find(query)
      .populate('workerId', 'name title')
      .populate('markedBy', 'name')
      .sort({ date: -1 });
      
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
