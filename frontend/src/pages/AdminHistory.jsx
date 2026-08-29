import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { format, parseISO } from 'date-fns';

const AdminHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [filters, setFilters] = useState({ workerId: '', status: '', month: '', year: new Date().getFullYear() });

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await api.get('/workers');
        setWorkers(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchWorkers();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.workerId) queryParams.append('workerId', filters.workerId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.month) queryParams.append('month', filters.month);
      if (filters.year) queryParams.append('year', filters.year);

      const res = await api.get(`/attendance/history?${queryParams.toString()}`);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Attendance History</h2>
          <p className="text-slate-500 mt-1">View past attendance records</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Worker</label>
          <select 
            name="workerId" 
            value={filters.workerId} 
            onChange={handleFilterChange}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Workers</option>
            {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
          <select 
            name="status" 
            value={filters.status} 
            onChange={handleFilterChange}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Month</label>
          <select 
            name="month" 
            value={filters.month} 
            onChange={handleFilterChange}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Months</option>
            {[...Array(12)].map((_, i) => (
              <option key={i+1} value={i+1}>{format(new Date(2000, i, 1), 'MMMM')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Year</label>
          <input 
            type="number" 
            name="year" 
            value={filters.year} 
            onChange={handleFilterChange}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Loading history...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 font-semibold text-slate-600">Date</th>
                  <th className="p-4 font-semibold text-slate-600">Worker</th>
                  <th className="p-4 font-semibold text-slate-600">Status</th>
                  <th className="p-4 font-semibold text-slate-600">Marked At</th>
                  <th className="p-4 font-semibold text-slate-600">Marked By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">
                      {format(parseISO(record.date), 'MMM do, yyyy')}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-800">{record.workerId?.name}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase ${
                        record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {record.status}
                      </span>
                      {record.status === 'ABSENT' && record.comment && (
                        <p className="text-xs text-slate-500 mt-1 italic">Reason: {record.comment}</p>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {format(new Date(record.markedAt), 'MMM do, hh:mm a')}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {record.markedBy?.name}
                    </td>
                  </tr>
                ))}
                
                {history.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      No attendance records found for the selected filters.
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

export default AdminHistory;
