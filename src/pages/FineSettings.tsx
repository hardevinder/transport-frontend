import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { API } from '../config/api';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import DashboardLayout from '../components/DashboardLayout';

interface FineSetting {
  id: string;
  amount: number;
  duration: 'fixed' | 'per_day';
  applyFrom: number;
  createdAt: string;
}

const FineSettings: React.FC = () => {
  const [fineSettings, setFineSettings] = useState<FineSetting[]>([]);
  const [form, setForm] = useState<Partial<FineSetting>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await axios.get<FineSetting[]>(API.FINE_SETTINGS);
      setFineSettings(res.data);
    } catch (error) {
      toast.error('Failed to fetch fine settings');
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await axios.put(`${API.FINE_SETTINGS}/${editingId}`, form);
        toast.success('Fine setting updated!');
      } else {
        await axios.post(API.FINE_SETTINGS, form);
        toast.success('Fine setting created!');
      }
      setForm({});
      setEditingId(null);
      setShowModal(false);
      fetchSettings();
    } catch {
      toast.error('Failed to save fine setting.');
    }
  };

  const handleEdit = (s: FineSetting) => {
    setForm({
      amount: s.amount,
      duration: s.duration,
      applyFrom: s.applyFrom,
    });
    setEditingId(s.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this fine setting?')) {
      try {
        await axios.delete(`${API.FINE_SETTINGS}/${id}`);
        toast.success('Deleted');
        fetchSettings();
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Fine Settings</h2>
          <button
            onClick={() => {
              setForm({});
              setEditingId(null);
              setShowModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FaPlus /> Add New
          </button>
        </div>

        <table className="w-full table-auto border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">Duration</th>
              <th className="p-2 text-left">Apply After (Days)</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fineSettings.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-500 py-4">
                  No fine settings found.
                </td>
              </tr>
            ) : (
              fineSettings.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-2">₹{s.amount}</td>
                  <td className="p-2 capitalize">{s.duration.replace('_', ' ')}</td>
                  <td className="p-2">{s.applyFrom}</td>
                  <td className="p-2 space-x-3">
                    <button
                      onClick={() => handleEdit(s)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg relative">
              <h3 className="text-lg font-semibold mb-4">
                {editingId ? 'Edit Fine Setting' : 'Add Fine Setting'}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="number"
                  placeholder="Fine Amount"
                  className="border p-2 rounded"
                  value={form.amount ?? ''}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
                <select
                  className="border p-2 rounded"
                  value={form.duration ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value as 'fixed' | 'per_day' })
                  }
                >
                  <option value="">Select Duration</option>
                  <option value="fixed">Fixed</option>
                  <option value="per_day">Per Day</option>
                </select>
                <input
                  type="number"
                  placeholder="Apply Fine After Day"
                  className="border p-2 rounded"
                  value={form.applyFrom ?? ''}
                  onChange={(e) => setForm({ ...form, applyFrom: Number(e.target.value) })}
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 text-black px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FineSettings;
