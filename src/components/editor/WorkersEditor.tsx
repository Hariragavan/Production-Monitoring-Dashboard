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
  Edit3,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import {
  getAvailableWorkers,
  syncWorkersFromSupabase,
  addAvailableWorker,
  updateAvailableWorker,
  deleteAvailableWorker,
  type WorkerItem,
} from '../../lib/dataService';

interface WorkersEditorProps {
  unitName?: string;
}

export const WorkersEditor: React.FC<WorkersEditorProps> = ({ unitName = 'Unit 01' }) => {
  const [workers, setWorkers] = useState<WorkerItem[]>(() => getAvailableWorkers(unitName));
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerId, setNewWorkerId] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState('');
  const [newWorkerDept, setNewWorkerDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state for modifying existing workers
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editId, setEditId] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editDept, setEditDept] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Sync with real-time worker updates and fetch from Supabase when unitName changes
  useEffect(() => {
    // Initial local load for this unit
    setWorkers(getAvailableWorkers(unitName));
    handleCancelEdit();

    // Fetch latest from Supabase for this unit
    syncWorkersFromSupabase(unitName).then((synced) => {
      if (synced) setWorkers(synced);
    });

    const handleWorkersUpdated = (e: any) => {
      if (e.detail?.workers && (!e.detail?.unitName || e.detail?.unitName === unitName)) {
        setWorkers(e.detail.workers);
      }
    };
    window.addEventListener('production-workers-updated', handleWorkersUpdated);
    return () => window.removeEventListener('production-workers-updated', handleWorkersUpdated);
  }, [unitName]);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);

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
      setError(`Worker with ID "${id}" is already registered in ${unitName}`);
      return;
    }

    setIsSubmitting(true);
    const result = await addAvailableWorker(
      {
        name,
        id,
        role: role || undefined,
        department: department || undefined,
        unit_name: unitName,
      },
      unitName
    );
    setIsSubmitting(false);

    setWorkers(result.workers);
    if (!result.success && result.error) {
      setError(`Notice: Saved locally for ${unitName}, but database returned: ${result.error}`);
    } else {
      setFeedback(`✓ Operator ${name} (${id}) saved directly to ${unitName} database!`);
      setTimeout(() => setFeedback(null), 4000);
    }

    setNewWorkerName('');
    setNewWorkerId('');
    setNewWorkerRole('');
    setNewWorkerDept('');
  };

  const handleStartEdit = (w: WorkerItem) => {
    setEditingWorkerId(w.id);
    setEditName(w.name);
    setEditId(w.id);
    setEditRole(w.role || '');
    setEditDept(w.department || '');
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingWorkerId(null);
    setEditName('');
    setEditId('');
    setEditRole('');
    setEditDept('');
  };

  const handleSaveEdit = async (originalId: string) => {
    setError(null);
    setFeedback(null);

    const trimmedName = editName.trim().toUpperCase();
    const trimmedId = editId.trim().toUpperCase();

    if (!trimmedName) {
      setError('Worker name cannot be empty');
      return;
    }
    if (!trimmedId) {
      setError('Worker ID cannot be empty');
      return;
    }

    setIsSavingEdit(true);
    const result = await updateAvailableWorker(
      originalId,
      {
        name: trimmedName,
        id: trimmedId,
        role: editRole.trim(),
        department: editDept.trim(),
        unit_name: unitName,
      },
      unitName
    );
    setIsSavingEdit(false);

    if (result.success) {
      setWorkers(result.workers);
      setEditingWorkerId(null);
      setFeedback(`✓ Operator ${trimmedName} (${trimmedId}) updated successfully in ${unitName}!`);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setError(`Failed to update worker: ${result.error || 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await deleteAvailableWorker(id, unitName);
    setWorkers(result.workers);
    if (editingWorkerId === id) handleCancelEdit();
    setFeedback(`Removed operator ${name} (${id}) from ${unitName}`);
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
            Manage operators assigned exclusively to <strong className="text-slate-800">{unitName}</strong>. Registered operators sync across Critical Operations and Downtime dropdowns for this unit.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2.5 py-1 bg-[#134665] text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
            <Building className="w-3.5 h-3.5 text-cyan-300" />
            <span>{unitName}</span>
          </span>
          <span className="px-3 py-1 bg-cyan-50 border border-cyan-200 text-cyan-900 rounded-lg text-xs font-black">
            {workers.length} {workers.length === 1 ? 'Operator' : 'Operators'}
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

      {/* Error Notification */}
      {error && (
        <div className="px-4 py-2.5 bg-rose-50 text-rose-800 rounded-lg text-xs font-bold border border-rose-300">
          {error}
        </div>
      )}

      {/* Form: Register New Operator */}
      <form
        onSubmit={handleAddWorker}
        className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <UserPlus className="w-4 h-4 text-cyan-700" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Register New Operator for {unitName}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Operator Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Operator Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Users className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
                placeholder="e.g. S. KUMAR"
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500 uppercase"
              />
            </div>
          </div>

          {/* Employee ID */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Employee ID *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <IdCard className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={newWorkerId}
                onChange={(e) => setNewWorkerId(e.target.value)}
                placeholder="e.g. OP-104 or 30739"
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500 uppercase"
              />
            </div>
          </div>

          {/* Grade */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Grade (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={newWorkerRole}
                onChange={(e) => setNewWorkerRole(e.target.value)}
                placeholder="e.g. Grade A / Grade B / Skilled"
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
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
                placeholder="e.g. Sewing / Assembly"
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 active:scale-95 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Register Operator in {unitName}</span>
          </button>
        </div>
      </form>

      {/* Operator List Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Registered Operators for {unitName} ({filteredWorkers.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Click <strong className="text-slate-600">Edit</strong> on any row to modify operator details, name, or employee ID.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, or grade..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {workers.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-600">No operators registered yet for {unitName}</p>
            <p className="text-[11px] text-slate-400">
              Use the form above to add operators for this unit.
            </p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs font-bold bg-slate-50 rounded-lg border border-slate-200">
            No workers match your search "{searchQuery}"
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#134665] text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-3 py-2.5 w-12 text-center">#</th>
                  <th className="px-3 py-2.5">Operator Name</th>
                  <th className="px-3 py-2.5">Employee ID</th>
                  <th className="px-3 py-2.5">Grade</th>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredWorkers.map((w, idx) => {
                  const isEditing = editingWorkerId === w.id;

                  if (isEditing) {
                    return (
                      <tr key={w.id} className="bg-cyan-50/50">
                        <td className="px-3 py-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-cyan-500 rounded text-xs font-black text-slate-900 outline-none uppercase shadow-inner"
                            placeholder="Operator Name"
                            autoFocus
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={editId}
                            onChange={(e) => setEditId(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-cyan-500 rounded text-xs font-mono font-bold text-slate-900 outline-none uppercase shadow-inner"
                            placeholder="Employee ID"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-cyan-500 rounded text-xs font-medium text-slate-900 outline-none shadow-inner"
                            placeholder="Grade"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={editDept}
                            onChange={(e) => setEditDept(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-cyan-500 rounded text-xs font-medium text-slate-900 outline-none shadow-inner"
                            placeholder="Department"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isSavingEdit}
                              onClick={() => handleSaveEdit(w.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                              title="Save Changes"
                            >
                              {isSavingEdit ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              disabled={isSavingEdit}
                              onClick={handleCancelEdit}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold transition cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
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
                        {w.role || <span className="text-slate-400 italic">-</span>}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium">
                        {w.department || <span className="text-slate-400 italic">Production Floor</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(w)}
                            title={`Edit ${w.name}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 rounded transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(w.id, w.name)}
                            title={`Delete ${w.name}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
