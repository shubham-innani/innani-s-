import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/axios';
import { format, subMonths, addMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, LogOut, Moon, Sun } from 'lucide-react';

const WorkerDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const res = await api.get(`/attendance/monthly?year=${year}&month=${month}&workerId=${user.workerId}`);
      
      if (res.data) {
        setStats(res.data.stats);
        setCalendar(res.data.calendar);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAttendance();
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => {
    const nextMonth = addMonths(currentDate, 1);
    if (nextMonth <= new Date()) {
      setCurrentDate(nextMonth);
    }
  };

  const isCurrentMonth = 
    currentDate.getMonth() === new Date().getMonth() && 
    currentDate.getFullYear() === new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-xl">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-bold tracking-tight text-lg leading-tight">{user.name}</h1>
              <p className="text-emerald-400 text-xs font-semibold">Worker Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-2 text-rose-300 hover:text-rose-400 transition-colors bg-slate-800 hover:bg-slate-800/80 px-3 py-2 rounded-lg"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">My Attendance</h2>
          
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="w-32 text-center font-bold text-slate-700 dark:text-slate-300">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button 
              onClick={handleNextMonth} 
              disabled={isCurrentMonth}
              className={`p-2 rounded-md transition-colors text-slate-600 dark:text-slate-300 ${isCurrentMonth ? 'opacity-30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Loading your stats...
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">Present</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.present} <span className="text-sm font-normal text-slate-400">Days</span></p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                <p className="text-sm font-semibold text-amber-500">Half-Day</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.halfDay || 0} <span className="text-sm font-normal text-slate-400">Days</span></p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-500">Absent</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.absent} <span className="text-sm font-normal text-slate-400">Days</span></p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Equivalent Days</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.totalEquivalent || stats.present} <span className="text-sm font-normal text-slate-400">Days</span></p>
              </div>
              <div className="bg-emerald-600 p-5 rounded-2xl shadow-sm border border-emerald-500 text-white flex flex-col justify-center transition-colors">
                <p className="text-sm font-semibold text-emerald-100">Attendance %</p>
                <p className="text-3xl font-bold mt-1">{stats.percentage}%</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white">Calendar View</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-slate-100 dark:bg-slate-800">
                {calendar.map((day, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-4 flex flex-col gap-2 relative group transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-xl font-bold text-slate-700 dark:text-slate-300">{format(parseISO(day.date), 'd')}</span>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{day.day.substring(0, 3)}</span>
                    </div>
                    
                    <div className="mt-auto">
                      {day.status === 'PRESENT' && <span className="inline-block w-full text-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold text-sm py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">PRESENT</span>}
                      {day.status === 'HALF-DAY' && <span className="inline-block w-full text-center bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold text-sm py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">HALF-DAY</span>}
                      {day.status === 'ABSENT' && <span className="inline-block w-full text-center bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 font-bold text-sm py-1.5 rounded-lg border border-rose-200 dark:border-rose-800">ABSENT</span>}
                      {day.status === 'HOLIDAY' && <span className="inline-block w-full text-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">HOLIDAY</span>}
                      {day.status === 'NOT_MARKED' && <span className="inline-block w-full text-center bg-transparent text-slate-400 font-bold text-sm py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">Pending</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm text-slate-500">
            Could not load attendance data.
          </div>
        )}

      </main>
    </div>
  );
};

export default WorkerDashboard;
