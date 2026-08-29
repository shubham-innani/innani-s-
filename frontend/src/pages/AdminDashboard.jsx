import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { format } from 'date-fns';
import { Save, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [workers, setWorkers] = useState([]);
  const [attendanceState, setAttendanceState] = useState({}); // { workerId: { status, comment } }
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDaily = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/daily');
      setDate(res.data.date);
      setWorkers(res.data.data);
      
      const initialState = {};
      let allMarked = res.data.data.length > 0;
      
      res.data.data.forEach(w => {
        if (w.status === 'NOT_MARKED') {
          allMarked = false;
        }
        initialState[w.workerId] = {
          status: w.status,
          comment: w.comment || ''
        };
      });
      
      setAttendanceState(initialState);
      
      if (allMarked) {
        setIsSubmitted(true);
      }
      
      setUnsavedChanges(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaily();
  }, []);

  // Prevent leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  const isSunday = new Date().getDay() === 0;

  const handleStatusChange = (workerId, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [workerId]: { ...prev[workerId], status, comment: status === 'PRESENT' ? '' : prev[workerId].comment }
    }));
    setUnsavedChanges(true);
  };

  const handleCommentChange = (workerId, comment) => {
    setAttendanceState(prev => ({
      ...prev,
      [workerId]: { ...prev[workerId], comment }
    }));
    setUnsavedChanges(true);
  };

  const handleSubmit = async () => {
    // Validation
    const activeWorkers = workers.filter(w => w.status !== 'NOT_APPLICABLE');
    const unmarked = activeWorkers.filter(w => attendanceState[w.workerId].status === 'NOT_MARKED');
    
    if (unmarked.length > 0) {
      alert("Please mark attendance for all workers before submitting.");
      return;
    }

    if (!window.confirm("Submit Today's Attendance?\n\nAre you sure you want to submit today's attendance?")) {
      return;
    }

    try {
      setLoading(true);
      
      const records = activeWorkers.map(w => ({
        workerId: w.workerId,
        status: attendanceState[w.workerId].status,
        comment: attendanceState[w.workerId].comment
      }));

      await api.post('/attendance/bulk-mark', { date, records });
      
      setIsSubmitted(true);
      setIsEditMode(false);
      setUnsavedChanges(false);
      alert("Today's attendance has been submitted successfully.");
      
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting attendance');
    } finally {
      setLoading(false);
    }
  };

  // Calculate current display stats based on unsaved state
  let p = 0, a = 0, n = 0;
  workers.forEach(w => {
    const s = attendanceState[w.workerId]?.status;
    if (s === 'PRESENT') p++;
    else if (s === 'ABSENT') a++;
    else if (s === 'NOT_MARKED') n++;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {unsavedChanges && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex items-center justify-between sticky top-4 z-20">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-amber-500" />
            <p className="text-amber-800 font-medium">You have unsaved attendance changes.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500">Manage today's attendance</p>
            {isSubmitted && !isEditMode && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded flex items-center gap-1">
                Submitted ✓
              </span>
            )}
            {!isSubmitted && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded">
                Pending
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-emerald-600 tracking-tight">
            {format(currentTime, 'hh:mm:ss a')}
          </div>
          <div className="text-slate-600 font-medium">
            {format(currentTime, 'EEEE, MMMM do, yyyy')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500">Total Workers</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{workers.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500">Present</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{p}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500">Absent</p>
          <p className="text-3xl font-bold text-rose-600 mt-1">{a}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500">Not Marked</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">{n}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Today's Attendance</h3>
          
          <div className="flex items-center gap-3">
            {isSunday && (
              <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full uppercase tracking-wider">
                Sunday Holiday
              </span>
            )}
            {isSubmitted && !isEditMode && !isSunday && (
              <button 
                onClick={() => setIsEditMode(true)}
                className="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-white px-4 py-1.5 rounded-lg border border-emerald-200 shadow-sm"
              >
                Edit Attendance
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading attendance data...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {workers.map((worker) => {
              const state = attendanceState[worker.workerId] || { status: 'NOT_MARKED', comment: '' };
              const isDisabled = isSunday || (isSubmitted && !isEditMode);
              
              return (
                <div key={worker.workerId} className="p-4 md:p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xl font-bold shrink-0">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{worker.name}</h4>
                      <p className="text-sm font-medium text-slate-500">{worker.title}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 max-w-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleStatusChange(worker.workerId, 'PRESENT')}
                        disabled={isDisabled}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-bold transition-all ${
                          state.status === 'PRESENT'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white border border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:text-slate-600'
                        }`}
                      >
                        {state.status === 'PRESENT' && '✓ '} Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(worker.workerId, 'ABSENT')}
                        disabled={isDisabled}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-bold transition-all ${
                          state.status === 'ABSENT'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-white border border-slate-300 text-slate-600 hover:border-rose-500 hover:text-rose-600 disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:text-slate-600'
                        }`}
                      >
                        {state.status === 'ABSENT' && '✓ '} Absent
                      </button>
                    </div>
                    
                    {state.status === 'ABSENT' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <input
                          type="text"
                          disabled={isDisabled}
                          placeholder="Reason for absence (optional)..."
                          value={state.comment}
                          onChange={(e) => handleCommentChange(worker.workerId, e.target.value)}
                          className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submit Footer */}
        {(!isSubmitted || isEditMode) && !isSunday && !loading && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 text-lg"
            >
              <Save size={24} />
              Submit Attendance
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
