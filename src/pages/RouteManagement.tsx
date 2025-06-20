import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { API } from '../config/api';
import { toast, ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../components/DashboardLayout';
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
}

interface RouteInput {
  id?: string;
  name: string;
  startPoint: string;
  endPoint: string;
  driverId?: string;
  status?: string;
  createdAt?: string;
  driver?: Driver;
}

const RouteManagement: React.FC = () => {
  const [routes, setRoutes] = useState<RouteInput[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [form, setForm] = useState<RouteInput>({ name: '', startPoint: '', endPoint: '', driverId: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRoutes();
    fetchDrivers();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await axios.get<RouteInput[]>(API.ROUTES);
      setRoutes(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load routes');
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await axios.get<Driver[]>(API.DRIVERS);
      setDrivers(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load drivers');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = (route: RouteInput) => {
    setForm({
      id: route.id,
      name: route.name,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      driverId: route.driverId,
    });
    setEditingId(route.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Route will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API.ROUTES}/${id}`);
        toast.success('Route deleted successfully');
        fetchRoutes();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleToggleStatus = async (id?: string) => {
    if (!id) return;
    try {
      await axios.patch(`${API.ROUTES}/${id}/status`);
      toast.success('Route status updated');
      fetchRoutes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Please enter a route name.');
    if (!form.startPoint.trim()) return toast.error('Please enter a start point.');
    if (!form.endPoint.trim()) return toast.error('Please enter an end point.');
    if (!form.driverId?.trim()) return toast.error('Please select a driver.');

    try {
      if (editingId) {
        await axios.put(`${API.ROUTES}/${editingId}`, form);
        toast.success('Route updated successfully');
      } else {
        await axios.post(API.ROUTES, form);
        toast.success('Route created successfully');
      }
      setForm({ name: '', startPoint: '', endPoint: '', driverId: '' });
      setEditingId(null);
      setShowForm(false);
      fetchRoutes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving route');
    }
  };

  const filteredRoutes = routes.filter((route) =>
    `${route.name} ${route.startPoint} ${route.endPoint} ${route.driver?.name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <ToastContainer position="top-right" />

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-800">Route Management</h2>
          <button
            onClick={() => {
              setForm({ name: '', startPoint: '', endPoint: '', driverId: '' });
              setEditingId(null);
              setShowForm(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Route
          </button>
        </div>

        <div className="bg-white shadow rounded p-4 overflow-auto">
          <div className="mb-4 flex justify-end gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="border p-2 rounded w-60"
            />
            <button
              onClick={() => setSearchTerm('')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded"
            >
              Reset
            </button>
          </div>

          <table className="w-full table-auto border">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Start</th>
                <th className="p-2">End</th>
                <th className="p-2">Driver</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.length > 0 ? (
                filteredRoutes.map((route) => (
                  <tr key={route.id} className="border-t">
                    <td className="p-2">{route.name}</td>
                    <td className="p-2">{route.startPoint}</td>
                    <td className="p-2">{route.endPoint}</td>
                    <td className="p-2">{route.driver?.name || '—'}</td>
                    <td className="p-2">
                      {route.status === 'active' ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </td>
                    <td className="p-2 space-x-4">
                      <button onClick={() => handleEdit(route)} className="text-blue-600">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(route.id)} className="text-red-600">
                        <FaTrash />
                      </button>
                      <button onClick={() => handleToggleStatus(route.id)} className="text-yellow-600">
                        {route.status === 'active' ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No routes found.
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
                {editingId ? 'Edit Route' : 'Add Route'}
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
                  placeholder="Route Name"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="startPoint"
                  value={form.startPoint}
                  onChange={handleChange}
                  placeholder="Start Point"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="endPoint"
                  value={form.endPoint}
                  onChange={handleChange}
                  placeholder="End Point"
                  className="w-full border p-2 rounded"
                />
                <select
                  name="driverId"
                  value={form.driverId}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select Driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.phone})
                    </option>
                  ))}
                </select>
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

export default RouteManagement;
