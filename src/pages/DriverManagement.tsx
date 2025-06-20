// src/pages/DriverManagement.tsx

import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { API } from '../config/api';
import { toast, ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../components/DashboardLayout';
import { FaEdit, FaTrash } from 'react-icons/fa';

interface DriverInput {
  id?: string;
  name: string;
  phone: string;
  licenseNo: string;
  status?: string;
  createdAt?: string;
}

const DriverManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverInput[]>([]);
  const [form, setForm] = useState<DriverInput>({ name: '', phone: '', licenseNo: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await axios.get<DriverInput[]>(API.DRIVERS); // ✅ Typing fix
      setDrivers(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load drivers');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = (driver: DriverInput) => {
    setForm(driver);
    setEditingId(driver.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Driver will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API.DRIVERS}/${id}`);
        toast.success('Driver deleted successfully');
        fetchDrivers();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await axios.put(`${API.DRIVERS}/${editingId}`, form);
        toast.success('Driver updated successfully');
      } else {
        await axios.post(API.DRIVERS, form);
        toast.success('Driver created successfully');
      }
      setForm({ name: '', phone: '', licenseNo: '' });
      setEditingId(null);
      setShowForm(false);
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving driver');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <ToastContainer position="top-right" />

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-800">Driver Management</h2>
          <button
            onClick={() => {
              setForm({ name: '', phone: '', licenseNo: '' });
              setEditingId(null);
              setShowForm(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Driver
          </button>
        </div>

        <div className="bg-white shadow rounded p-4 overflow-auto">
          <table className="w-full table-auto border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Name</th>
                <th className="p-2">Phone</th>
                <th className="p-2">License No</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length > 0 ? (
                drivers.map((driver) => (
                  <tr key={driver.id} className="border-t">
                    <td className="p-2">{driver.name}</td>
                    <td className="p-2">{driver.phone}</td>
                    <td className="p-2">{driver.licenseNo}</td>
                    <td className="p-2 space-x-4">
                      <button onClick={() => handleEdit(driver)} className="text-blue-600">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(driver.id)} className="text-red-600">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No drivers found.
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
                {editingId ? 'Edit Driver' : 'Add Driver'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-2 right-3 text-gray-500 text-xl hover:text-black"
              >
                &times;
              </button>
              <div className="space-y-4">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Driver Name"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="licenseNo"
                  value={form.licenseNo}
                  onChange={handleChange}
                  placeholder="License Number"
                  className="w-full border p-2 rounded"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
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

export default DriverManagement;
