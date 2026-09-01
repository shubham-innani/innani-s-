import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminMonthly from './pages/AdminMonthly';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminHistory from './pages/AdminHistory';
import AdminSettings from './pages/AdminSettings';
import AdminWorkers from './pages/AdminWorkers';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/worker/dashboard'} />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="monthly" element={<AdminMonthly />} />
        <Route path="history" element={<AdminHistory />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="workers" element={<AdminWorkers />} />
      </Route>

      <Route path="/worker">
        <Route path="dashboard" element={user && user.role === 'worker' ? <WorkerDashboard /> : <Navigate to="/login" />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
