import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { format, subMonths, addMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Modal from '../components/Modal';

const AdminMonthly = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workersStats, setWorkersStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, title: '', dates: [] });

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // JS months are 0-indexed
      
      const res = await api.get(`/attendance/monthly?year=${year}&month=${month}`);
      setWorkersStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  const handleNextMonth = () => {
    const nextMonth = addMonths(currentDate, 1);
    if (nextMonth <= new Date()) { // Prevent going past current month
      setCurrentDate(nextMonth);
    }
  };

  const isCurrentMonth = 
    currentDate.getMonth() === new Date().getMonth() && 
    currentDate.getFullYear() === new Date().getFullYear();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Monthly Reports</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review attendance statistics</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button 
            onClick={handlePrevMonth}
            className="p-2 bg-white dark:bg-slate-900 rounded-md shadow-sm hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="w-32 text-center font-bold text-slate-700 dark:text-slate-300">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button 
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className={`p-2 bg-white dark:bg-slate-900 rounded-md shadow-sm transition-colors text-slate-700 dark:text-slate-300 ${
              isCurrentMonth ? 'opacity-50 cursor-not-allowed' : 'hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Calculating monthly statistics...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Worker</th>
                  <th className="p-4 font-semibold text-center text-slate-600 dark:text-slate-300">Present</th>
                  <th className="p-4 font-semibold text-center text-slate-600 dark:text-slate-300">Half-Day</th>
                  <th className="p-4 font-semibold text-center text-slate-600 dark:text-slate-300">Absent</th>
                  <th className="p-4 font-semibold text-center text-slate-600 dark:text-slate-300">Working Days</th>
                  <th className="p-4 font-semibold text-center text-slate-600 dark:text-slate-300">Equivalent Days</th>
                  <th className="p-4 font-semibold text-center text-slate-600 dark:text-slate-300">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {workersStats.map((w) => (
                  <tr key={w.workerId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-white">{w.name}</div>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setDetailsModal({ isOpen: true, title: `${w.name} - Present Dates`, dates: w.stats.presentDates || [] })}
                        className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors"
                      >
                        {w.stats.present}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setDetailsModal({ isOpen: true, title: `${w.name} - Half-Day Dates`, dates: w.stats.halfDayDates || [] })}
                        className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
                      >
                        {w.stats.halfDay || 0}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setDetailsModal({ isOpen: true, title: `${w.name} - Absent Dates`, dates: w.stats.absentDates || [] })}
                        className="px-3 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 font-bold rounded-lg hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors"
                      >
                        {w.stats.absent}
                      </button>
                    </td>
                    <td className="p-4 text-center font-semibold text-slate-700 dark:text-slate-300">{w.stats.workingDays}</td>
                    <td className="p-4 text-center font-semibold text-slate-700 dark:text-slate-300">{w.stats.totalEquivalent || w.stats.present}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                        w.stats.percentage >= 80 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                        w.stats.percentage >= 50 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                        'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {w.stats.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
                
                {workersStats.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">
                      No data found for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, title: '', dates: [] })}
        title={detailsModal.title}
      >
        <div className="max-h-64 overflow-y-auto pr-2">
          {detailsModal.dates.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">No dates recorded for this status.</p>
          ) : (
            <ul className="space-y-2">
              {detailsModal.dates.map(dateStr => (
                <li key={dateStr} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-300">
                  {format(parseISO(dateStr), 'EEEE, MMMM do yyyy')}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminMonthly;
