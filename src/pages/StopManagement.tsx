import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { API } from '../config/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../components/DashboardLayout';
import { FaEdit, FaTrash } from 'react-icons/fa';

interface Stop {
  id?: string;
  routeId: string;
  stopName: string;
  address?: string;
  stopOrder: number;
  stopTime: string;
  status?: string;
  routeName?: string;
}

interface Route {
  id: string;
  name: string;
}

const StopManagement: React.FC = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [form, setForm] = useState<Stop>({
    routeId: '',
    stopName: '',
    address: '',
    stopOrder: 1,
    stopTime: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');

  useEffect(() => {
    fetchAllStops();
    fetchRoutes();
  }, []);

  const fetchAllStops = async () => {
    try {
      const res = await axios.get<Stop[]>(`${API.STOPS}/all`);
      setStops(res.data);
    } catch {
      toast.error('Failed to fetch stops.');
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await axios.get<Route[]>(API.ROUTES);
      setRoutes(res.data);
    } catch {
      toast.error('Failed to fetch routes.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.stopName || !form.stopTime) {
      return toast.error('Please fill required fields: Stop Name and Time.');
    }

    const payload = {
      ...form,
      routeId: form.routeId || undefined,
      stopOrder: Number(form.stopOrder),
    };

    try {
      if (editingId) {
        await axios.put(`${API.STOPS}/${editingId}`, payload);
        toast.success('Stop updated');
      } else {
        await axios.post(API.STOPS, payload);
        toast.success('Stop created');
      }

      setForm({
        routeId: '',
        stopName: '',
        address: '',
        stopOrder: 1,
        stopTime: '',
      });
      setEditingId(null);
      setShowForm(false);
      fetchAllStops();
    } catch (err: any) {
      toast.error('Failed to save stop');
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this stop?')) {
      try {
        await axios.delete(`${API.STOPS}/${id}`);
        toast.success('Stop deleted');
        fetchAllStops();
      } catch {
        toast.error('Delete failed');
      }
    }
  };

  const handleEdit = (stop: Stop) => {
    setForm({
      ...stop,
      address: stop.address || '',
    });
    setEditingId(stop.id || null);
    setShowForm(true);
  };

  const filteredStops = stops.filter((stop) => {
    const matchesRoute = selectedRouteId ? stop.routeId === selectedRouteId : true;
    const matchesSearch = stop.stopName.toLowerCase().includes(search.toLowerCase());
    return matchesRoute && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <ToastContainer position="top-right" />
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-800">Stop Management</h2>
          <button
            onClick={() => {
              setForm({
                routeId: selectedRouteId || '',
                stopName: '',
                address: '',
                stopOrder: 1,
                stopTime: '',
              });
              setEditingId(null);
              setShowForm(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Stop
          </button>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="mb-4 flex justify-end gap-2 flex-wrap">
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="border p-2 rounded min-w-[200px]"
            >
              <option value="">All Routes</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by stop name"
              className="border p-2 rounded w-60"
            />

            <button
              onClick={() => {
                setSearch('');
                setSelectedRouteId('');
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded"
            >
              Reset
            </button>
          </div>

          <table className="w-full table-auto border">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Stop Name</th>
                <th className="p-2">Address</th>
                <th className="p-2">Route</th>
                <th className="p-2">Order</th>
                <th className="p-2">Time</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStops.map((stop) => (
                <tr key={stop.id} className="border-t">
                  <td className="p-2">{stop.stopName}</td>
                  <td className="p-2">{stop.address || '—'}</td>
                  <td className="p-2">{stop.routeName}</td>
                  <td className="p-2">{stop.stopOrder}</td>
                  <td className="p-2">{stop.stopTime}</td>
                  <td className="p-2">
                    {stop.status === 'active' ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </td>
                  <td className="p-2 space-x-3">
                    <button onClick={() => handleEdit(stop)} className="text-blue-600">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(stop.id)} className="text-red-600">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStops.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No stops found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative">
              <h3 className="text-xl font-semibold mb-4 text-blue-800">
                {editingId ? 'Edit Stop' : 'Add Stop'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-2 right-3 text-gray-500 text-xl hover:text-black"
              >
                &times;
              </button>
              <div className="space-y-4">
                <select
                  name="routeId"
                  value={form.routeId}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select Route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
                <input
                  name="stopName"
                  value={form.stopName}
                  onChange={handleChange}
                  placeholder="Stop Name"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="address"
                  value={form.address || ''}
                  onChange={handleChange}
                  placeholder="Address"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="stopOrder"
                  type="number"
                  value={form.stopOrder}
                  onChange={handleChange}
                  placeholder="Stop Order"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="stopTime"
                  value={form.stopTime}
                  onChange={handleChange}
                  placeholder="Stop Time (e.g. 08:30 AM)"
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

export default StopManagement;
