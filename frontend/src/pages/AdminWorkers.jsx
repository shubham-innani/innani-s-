import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { Plus, Edit2, Trash2, RotateCcw, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const AdminWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [formData, setFormData] = useState({
    name: '', title: '', username: '', password: '', phone: '', joiningDate: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workers');
      setWorkers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleOpenAdd = () => {
    setEditingWorker(null);
    setFormData({ name: '', title: '', username: '', password: '', phone: '', joiningDate: format(new Date(), 'yyyy-MM-dd') });
    setShowModal(true);
  };

  const handleOpenEdit = (w) => {
    setEditingWorker(w);
    setFormData({
      name: w.name,
      title: w.title,
      username: '', // cannot edit username easily right now
      password: '', // cannot edit here
      phone: w.phone || '',
      joiningDate: format(new Date(w.joiningDate || '2026-08-01'), 'yyyy-MM-dd')
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWorker) {
        await api.put(`/workers/${editingWorker._id}`, formData);
      } else {
        await api.post('/workers', formData);
      }
      setShowModal(false);
      fetchWorkers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving worker');
    }
  };

  const handleRemove = async (id) => {
    if (window.confirm("Are you sure you want to remove this worker?\n\nRemoving this worker will make them inactive and they will no longer appear in daily attendance. Their previous attendance records will be preserved.")) {
      try {
        await api.delete(`/workers/${id}`);
        fetchWorkers();
      } catch (err) {
        alert('Error removing worker');
      }
    }
  };

  const handleRestore = async (id) => {
    if (window.confirm("Restore this worker to active status?")) {
      try {
        await api.post(`/workers/${id}/restore`);
        fetchWorkers();
      } catch (err) {
        alert('Error restoring worker');
      }
    }
  }

  const activeWorkers = workers.filter(w => w.active);
  const archivedWorkers = workers.filter(w => !w.active);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Workers</h2>
          <p className="text-slate-500 mt-1">Manage active and archived workers</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus size={20} /> Add Worker
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Active Workers ({activeWorkers.length})</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading workers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 font-semibold text-slate-600">Name</th>
                  <th className="p-4 font-semibold text-slate-600">Role</th>
                  <th className="p-4 font-semibold text-slate-600">Joining Date</th>
                  <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeWorkers.map((w) => (
                  <tr key={w._id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{w.name}</td>
                    <td className="p-4 text-slate-600">{w.title}</td>
                    <td className="p-4 text-slate-600">
                      {w.joiningDate ? format(new Date(w.joiningDate), 'MMM do, yyyy') : 'N/A'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(w)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleRemove(w._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activeWorkers.length === 0 && (
                  <tr><td colSpan="4" className="p-8 text-center text-slate-500">No active workers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {archivedWorkers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden opacity-75">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800">Archived Workers ({archivedWorkers.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-slate-100">
                {archivedWorkers.map((w) => (
                  <tr key={w._id} className="bg-slate-50/50">
                    <td className="p-4 font-medium text-slate-600">{w.name}</td>
                    <td className="p-4 text-slate-500 text-sm">Removed</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleRestore(w._id)} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-md transition-colors flex items-center gap-1.5 ml-auto">
                        <RotateCcw size={16} /> Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {editingWorker ? 'Edit Worker' : 'Add New Worker'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Worker Role/Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Watchman, Maid" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Joining Date</label>
                <input required type="date" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              {!editingWorker && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Login Username</label>
                    <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Login Password</label>
                    <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">Save Worker</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminWorkers;
