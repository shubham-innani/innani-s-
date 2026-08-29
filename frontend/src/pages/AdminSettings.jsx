import { useState } from 'react';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { KeyRound, CheckCircle } from 'lucide-react';

const AdminSettings = () => {
  const { logout } = useAuth();
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (passwords.newPassword !== passwords.confirmPassword) {
      return setStatus({ type: 'error', message: 'New passwords do not match.' });
    }
    if (passwords.currentPassword === passwords.newPassword) {
      return setStatus({ type: 'error', message: 'New password cannot be the same as current password.' });
    }
    if (passwords.newPassword.length < 6) {
      return setStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
    }

    if (!window.confirm('Are you sure you want to change your password?')) return;

    try {
      setLoading(true);
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      
      setStatus({ type: 'success', message: 'Password changed successfully. Please log in again.' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => {
        logout();
      }, 3000);
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Error changing password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500 mt-1">Manage application preferences and security</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <KeyRound className="text-emerald-600" />
          <h3 className="text-lg font-bold text-slate-800">Change Password</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {status.message && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              status.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {status.type === 'success' && <CheckCircle size={20} />}
              <p className="font-medium">{status.message}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handleChange}
              required
              className="w-full md:w-2/3 p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handleChange}
              required
              className="w-full md:w-2/3 p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handleChange}
              required
              className="w-full md:w-2/3 p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Application Settings</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Application Name</p>
              <p className="font-bold text-slate-800">Innani's App</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Default Timezone</p>
              <p className="font-bold text-slate-800">Asia/Kolkata (IST)</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Weekly Holidays</p>
              <p className="font-bold text-slate-800">Sunday (Auto-calculated)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
