import React, { useState, useEffect } from 'react';
import {
  Users,
  IdCard,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Briefcase,
  Building,
  UserPlus,
} from 'lucide-react';
import {
  getAvailableWorkers,
  syncWorkersFromSupabase,
  addAvailableWorker,
  deleteAvailableWorker,
  type WorkerItem,
} from '../../lib/dataService';

export const WorkersEditor: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerItem[]>(getAvailableWorkers);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerId, setNewWorkerId] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState('');
  const [newWorkerDept, setNewWorkerDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync with real-time worker updates and fetch from Supabase on mount
  useEffect(() => {
    syncWorkersFromSupabase().then((synced) => {
      if (synced) setWorkers(synced);
    });

    const handleWorkersUpdated = (e: any) => {
      if (e.detail?.workers) {
        setWorkers(e.detail.workers);
      }
    };
    window.addEventListener('production-workers-updated', handleWorkersUpdated);
    return () => window.removeEventListener('production-workers-updated', handleWorkersUpdated);
  }, []);

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = newWorkerName.trim().toUpperCase();
    const id = newWorkerId.trim().toUpperCase();
    const role = newWorkerRole.trim();
    const department = newWorkerDept.trim();

    if (!name) {
      setError('Please enter worker name');
      return;
    }
    if (!id) {
      setError('Please enter worker ID');
      return;
    }

    if (workers.some((w) => w.id === id)) {
      setError(`Worker with ID "${id}" is already registered`);
      return;
    }

    const updated = addAvailableWorker({
      name,
      id,
      role: role || undefined,
      department: department || undefined,
    });

    setWorkers(updated);
    setNewWorkerName('');
    setNewWorkerId('');
    setNewWorkerRole('');
    setNewWorkerDept('');
    setFeedback(`✓ Operator ${name} (${id}) added to staff directory`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDelete = (id: string, name: string) => {
    const updated = deleteAvailableWorker(id);
    setWorkers(updated);
    setFeedback(`Removed operator ${name} (${id})`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const filteredWorkers = workers.filter((w) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      w.name.toLowerCase().includes(q) ||
      w.id.toLowerCase().includes(q) ||
      (w.role && w.role.toLowerCase().includes(q)) ||
      (w.department && w.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <Users className="w-5 h-5 text-cyan-700" />
            <span>Worker &amp; Operator Master Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register and manage shop-floor operators. Registered workers appear immediately across all Critical Operations and Downtime incident logs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-3 py-1 bg-cyan-50 border border-cyan-200 text-cyan-900 rounded-lg text-xs font-black">
            {workers.length} {workers.length === 1 ? 'Operator' : 'Operators'} Registered
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {feedback && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Add New Worker Form Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <h3 className="text-xs font-black text-[#0f3852] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-cyan-700" />
          <span>Add New Factory Operator</span>
        </h3>

        <form onSubmit={handleAddWorker} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Worker Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="e.g. MOHAN RAO"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-900 uppercase focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
            </div>

            {/* Worker ID */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Employee ID *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <IdCard className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  value={newWorkerId}
                  onChange={(e) => setNewWorkerId(e.target.value)}
                  placeholder="e.g. EMP-201"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
            </div>

            {/* Role / Skill */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Role / Skill (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={newWorkerRole}
                  onChange={(e) => setNewWorkerRole(e.target.value)}
                  placeholder="e.g. Sewing Operator"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
            </div>

            {/* Department / Line */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Department (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={newWorkerDept}
                  onChange={(e) => setNewWorkerDept(e.target.value)}
                  placeholder="e.g. Stitching / Assembly"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Operator to Directory</span>
            </button>
          </div>
        </form>
      </div>

      {/* Search & List of Workers */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Registered Operators ({filteredWorkers.length})
            </span>
          </div>

          {/* Search Box */}
          {workers.length > 0 && (
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>
          )}
        </div>

        {workers.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50">
            <div className="w-12 h-12 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-800 flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No factory workers registered yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Use the form above to add your staff and operators. Once added, you can assign them to operations and downtime.
            </p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs font-bold bg-slate-50 rounded-lg border border-slate-200">
            No workers match your search "{searchQuery}"
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-300 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#134665] text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-3 py-2.5 w-12 text-center">#</th>
                  <th className="px-3 py-2.5">Operator Name</th>
                  <th className="px-3 py-2.5">Employee ID</th>
                  <th className="px-3 py-2.5">Role / Skill</th>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredWorkers.map((w, idx) => (
                  <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-black text-slate-900 uppercase tracking-tight">
                      {w.name}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 bg-cyan-50 text-cyan-900 border border-cyan-200 rounded font-mono font-black text-[11px]">
                        {w.id}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium">
                      {w.role || <span className="text-slate-400 italic">General Operator</span>}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 font-medium">
                      {w.department || <span className="text-slate-400 italic">Production Floor</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(w.id, w.name)}
                        title={`Delete ${w.name}`}
                        className="inline-flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
