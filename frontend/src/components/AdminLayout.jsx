import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, CalendarDays, Users, History, LogOut, Menu, X, Settings, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import Modal from './Modal';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/worker/dashboard" replace />;

  const navGroups = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
      ]
    },
    {
      title: 'Attendance',
      items: [
        { name: "Today's Attendance", path: '/admin/dashboard', icon: <CalendarDays size={20} />, sub: true },
        { name: 'Monthly Attendance', path: '/admin/monthly', icon: <CalendarDays size={20} /> },
        { name: 'Attendance History', path: '/admin/history', icon: <History size={20} /> },
      ]
    },
    {
      title: 'Management',
      items: [
        { name: 'Workers', path: '/admin/workers', icon: <Users size={20} /> },
        { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors">
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-slate-900/50 text-slate-300 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:w-64 flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800 dark:border-slate-800/50">
          <h1 className="text-2xl font-bold text-white tracking-tight">Innani's App</h1>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setMobileOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="px-4 py-4 flex-1 space-y-6 overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {group.title}
              </p>
              {group.items.map((item) => {
                // Determine active state manually since multiple items might map to dashboard temporarily
                const isActive = location.pathname === item.path && (!item.sub || location.pathname === '/admin/dashboard');
                
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                    } ${item.sub ? 'ml-2' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.icon}
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-800 dark:border-slate-800/50">
          <div className="flex items-center space-x-3 px-4 py-3 mb-2 rounded-lg bg-slate-800 dark:bg-slate-800/50 text-white">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-slate-400">Admin</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile header */}
        <header className="lg:hidden bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between p-4 z-30 transition-colors">
          <button onClick={() => setMobileOpen(true)} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Innani's App</h1>
          <button onClick={toggleTheme} className="text-slate-600 dark:text-slate-300">
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </header>
        
        {/* Desktop Header Theme Toggle */}
        <div className="hidden lg:flex justify-end p-4 absolute top-0 right-0 z-30">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm hover:shadow-md transition-all border border-slate-200 dark:border-slate-700"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-32">
          <Outlet />
        </main>
      </div>

      <Modal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        title="Confirm Logout"
      >
        <p className="mb-6">Are you sure you want to log out?</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={() => setShowLogoutModal(false)}
            className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              setShowLogoutModal(false);
              logout();
            }}
            className="px-4 py-2 rounded-lg font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
          >
            Logout
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminLayout;
