import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { format } from 'date-fns';
import { Save, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import Modal from '../components/Modal';

const AdminDashboard = () => {
  const [workers, setWorkers] = useState([]);
  const [attendanceState, setAttendanceState] = useState({}); // { workerId: { status, comment } }
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDaily = async (fetchDate = selectedDate) => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/daily?date=${fetchDate}`);
      setDate(res.data.date);
      setSelectedDate(res.data.date);
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
        setIsEditMode(false);
      } else {
        setIsSubmitted(false);
        setIsEditMode(true);
      }
      
      setUnsavedChanges(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unsavedChanges) {
      if (window.confirm("You have unsaved changes. Discard them?")) {
        fetchDaily(selectedDate);
      } else {
        setSelectedDate(date); // revert date picker
      }
    } else {
      fetchDaily(selectedDate);
    }
  }, [selectedDate]);

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

  const isSunday = new Date(date).getDay() === 0;

  const handleStatusChange = (workerId, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [workerId]: { ...prev[workerId], status, comment: (status === 'PRESENT' || status === 'HALF-DAY') ? '' : prev[workerId].comment }
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

  const handlePreSubmit = () => {
    const activeWorkers = workers.filter(w => w.status !== 'NOT_APPLICABLE');
    const unmarked = activeWorkers.filter(w => attendanceState[w.workerId].status === 'NOT_MARKED');
    
    if (unmarked.length > 0) {
      alert("Please mark attendance for all workers before submitting.");
      return;
    }
    setSubmitError('');
    setShowSubmitModal(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setSubmitError('');
      
      const activeWorkers = workers.filter(w => w.status !== 'NOT_APPLICABLE');
      const records = activeWorkers.map(w => ({
        workerId: w.workerId,
        status: attendanceState[w.workerId].status,
        comment: attendanceState[w.workerId].comment
      }));

      await api.post('/attendance/bulk-mark', { date, records });
      
      setIsSubmitted(true);
      setIsEditMode(false);
      setUnsavedChanges(false);
      setShowSubmitModal(false);
      
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Error submitting attendance');
    } finally {
      setLoading(false);
    }
  };

  // Calculate current display stats based on unsaved state
  let p = 0, h = 0, a = 0, n = 0;
  workers.forEach(w => {
    const s = attendanceState[w.workerId]?.status;
    if (s === 'PRESENT') p++;
    else if (s === 'HALF-DAY') h++;
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

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500 dark:text-slate-400">Manage daily attendance</p>
            {isSubmitted && !isEditMode && (
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                Submitted ✓
              </span>
            )}
            {!isSubmitted && (
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-bold rounded border border-amber-200 dark:border-amber-800">
                Pending
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-500 tracking-tight">
              {format(currentTime, 'hh:mm:ss a')}
            </div>
            <div className="text-slate-600 dark:text-slate-400 font-medium">
              {format(currentTime, 'EEEE, MMMM do, yyyy')}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <CalendarIcon size={18} className="text-slate-500 dark:text-slate-400" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Workers</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{workers.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Present</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-500 mt-1">{p}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Half-Day</p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-500 mt-1">{h}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Absent</p>
          <p className="text-3xl font-bold text-rose-600 dark:text-rose-500 mt-1">{a}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Not Marked</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">{n}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Attendance for {format(new Date(date || new Date()), 'MMMM do, yyyy')}</h3>
          
          <div className="flex items-center gap-3">
            {isSunday && (
              <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-full uppercase tracking-wider">
                Sunday
              </span>
            )}
            {isSubmitted && !isEditMode && (
              <button 
                onClick={() => setIsEditMode(true)}
                className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm transition-colors"
              >
                Edit Attendance
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading attendance data...</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {workers.map((worker) => {
              const state = attendanceState[worker.workerId] || { status: 'NOT_MARKED', comment: '' };
              const isDisabled = isSubmitted && !isEditMode;
              
              return (
                <div key={worker.workerId} className="p-4 md:p-6 flex flex-col xl:flex-row xl:items-start justify-between gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-4 xl:min-w-[200px]">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xl font-bold shrink-0">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-lg">{worker.name}</h4>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{worker.title}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 max-w-2xl space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleStatusChange(worker.workerId, 'PRESENT')}
                        disabled={isDisabled}
                        className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-lg font-bold transition-all ${
                          state.status === 'PRESENT'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-500 disabled:opacity-50'
                        }`}
                      >
                        {state.status === 'PRESENT' && '✓ '} Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(worker.workerId, 'HALF-DAY')}
                        disabled={isDisabled}
                        className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-lg font-bold transition-all ${
                          state.status === 'HALF-DAY'
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-500 dark:hover:border-amber-500 hover:text-amber-500 dark:hover:text-amber-500 disabled:opacity-50'
                        }`}
                      >
                        {state.status === 'HALF-DAY' && '✓ '} Half-Day
                      </button>
                      <button
                        onClick={() => handleStatusChange(worker.workerId, 'ABSENT')}
                        disabled={isDisabled}
                        className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-lg font-bold transition-all ${
                          state.status === 'ABSENT'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-500 dark:hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-500 disabled:opacity-50'
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
                          className="w-full text-sm p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 transition-colors"
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
        {(!isSubmitted || isEditMode) && !loading && (
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={handlePreSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 text-lg"
            >
              <Save size={24} />
              Submit Attendance
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal 
        isOpen={showSubmitModal} 
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Submission"
      >
        <div className="space-y-4">
          <p>Are you sure you want to submit attendance for <strong>{format(new Date(date || new Date()), 'MMMM do, yyyy')}</strong>?</p>
          
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Present</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-500">{p}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Half-Day</p>
              <p className="text-xl font-bold text-amber-500">{h}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Absent</p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-500">{a}</p>
            </div>
          </div>

          {submitError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{submitError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setShowSubmitModal(false)}
              className="px-5 py-2.5 rounded-lg font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Submitting...' : 'Submit Attendance'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
