// pages/ClassManagement.tsx
import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { API } from '../config/api';
import { toast, ToastContainer } from 'react-toastify';
import { FaEdit, FaTrash, FaFileImport, FaFileDownload } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../components/DashboardLayout';

interface SchoolClass {
  id?: string;
  name: string;
}

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [form, setForm] = useState<SchoolClass>({ name: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await axios.get<SchoolClass[]>(API.CLASSES);
      setClasses(res.data);
    } catch {
      toast.error('Failed to fetch classes');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Class name is required');
    try {
      if (editingId) {
        await axios.put(`${API.CLASSES}/${editingId}`, form);
        toast.success('Class updated');
      } else {
        await axios.post(API.CLASSES, form);
        toast.success('Class created');
      }
      setForm({ name: '' });
      setEditingId(null);
      setShowForm(false);
      fetchClasses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save class');
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (window.confirm('Delete this class?')) {
      try {
        await axios.delete(`${API.CLASSES}/${id}`);
        toast.success('Class deleted');
        fetchClasses();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleEdit = (c: SchoolClass) => {
    setForm({ name: c.name });
    setEditingId(c.id || null);
    setShowForm(true);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await axios.post(API.CLASSES + '/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = res.data as { message: string; errors?: string[] };
    toast.success(data.message || 'Imported');
    if (data.errors) {
      data.errors.forEach((err: string) => toast.warning(err));
    }
    fetchClasses();
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Import failed');
  }
};


  const downloadSample = async () => {
  try {
    const res = await axios.get(API.CLASSES + '/sample', {
      responseType: 'blob',
    });
    const blob = new Blob([res.data as BlobPart]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'class_sample.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  } catch {
    toast.error('Failed to download sample');
  }
};


  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <ToastContainer position="top-right" />
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-800">Class Management</h2>
          <div className="flex gap-3">
            <button
              onClick={downloadSample}
              className="flex items-center gap-2 bg-yellow-600 text-white px-3 py-2 rounded hover:bg-yellow-700"
            >
              <FaFileDownload /> Export Sample
            </button>
            <label className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded cursor-pointer hover:bg-purple-700">
              <FaFileImport /> Import Excel
              <input type="file" accept=".xlsx" onChange={handleImport} hidden />
            </label>
            <button
              onClick={() => {
                setForm({ name: '' });
                setEditingId(null);
                setShowForm(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Add Class
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by class name"
              className="border p-2 rounded w-60"
            />
            <button
              onClick={() => setSearch('')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded"
            >
              Reset
            </button>
          </div>

          <table className="w-full table-auto border">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Class Name</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.name}</td>
                  <td className="p-2 space-x-3">
                    <button onClick={() => handleEdit(c)} className="text-blue-600">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClasses.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center py-4 text-gray-500">
                    No classes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
              <h3 className="text-xl font-semibold mb-4 text-blue-800">
                {editingId ? 'Edit Class' : 'Add Class'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-2 right-3 text-gray-500 text-xl hover:text-black"
              >
                &times;
              </button>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Class Name"
                className="w-full border p-2 rounded mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClassManagement;
