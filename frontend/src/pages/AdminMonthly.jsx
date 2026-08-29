import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { format, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

const AdminMonthly = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workersStats, setWorkersStats] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Monthly Reports</h2>
          <p className="text-slate-500 mt-1">Review attendance statistics</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-lg">
          <button 
            onClick={handlePrevMonth}
            className="p-2 bg-white rounded-md shadow-sm hover:text-emerald-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="w-32 text-center font-bold text-slate-700">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button 
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className={`p-2 bg-white rounded-md shadow-sm transition-colors ${
              isCurrentMonth ? 'opacity-50 cursor-not-allowed' : 'hover:text-emerald-600'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Calculating monthly statistics...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 font-semibold text-slate-600">Worker</th>
                  <th className="p-4 font-semibold text-center text-slate-600">Present</th>
                  <th className="p-4 font-semibold text-center text-slate-600">Absent</th>
                  <th className="p-4 font-semibold text-center text-slate-600">Holidays</th>
                  <th className="p-4 font-semibold text-center text-slate-600">Working Days</th>
                  <th className="p-4 font-semibold text-center text-slate-600">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workersStats.map((w) => (
                  <tr key={w.workerId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{w.name}</div>
                    </td>
                    <td className="p-4 text-center font-bold text-emerald-600">{w.stats.present}</td>
                    <td className="p-4 text-center font-bold text-rose-600">{w.stats.absent}</td>
                    <td className="p-4 text-center font-semibold text-slate-500">{w.stats.holidays}</td>
                    <td className="p-4 text-center font-semibold text-slate-700">{w.stats.workingDays}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                        w.stats.percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        w.stats.percentage >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
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
    </div>
  );
};

export default AdminMonthly;
