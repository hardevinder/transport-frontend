// VehicleManagement.tsx
import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { API } from '../config/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../components/DashboardLayout';
import { FaEdit, FaTrash } from 'react-icons/fa';

interface Vehicle {
  id?: string;
  busNo: string;
  capacity: number;
  status?: string;
}

const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState<Vehicle>({ busNo: '', capacity: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await axios.get<Vehicle[]>(API.VEHICLES);
      setVehicles(res.data);
    } catch {
      toast.error('Failed to fetch vehicles');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'capacity' ? Number(value) : value });
  };

  const handleSubmit = async () => {
    if (!form.busNo || form.capacity <= 0) {
      return toast.error('Please enter valid bus number and capacity.');
    }

    try {
      if (editingId) {
        await axios.put(`${API.VEHICLES}/${editingId}`, form);
        toast.success('Vehicle updated');
      } else {
        await axios.post(API.VEHICLES, form);
        toast.success('Vehicle created');
      }
      setForm({ busNo: '', capacity: 0 });
      setEditingId(null);
      setShowForm(false);
      fetchVehicles();
    } catch {
      toast.error('Failed to save vehicle');
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await axios.delete(`${API.VEHICLES}/${id}`);
        toast.success('Vehicle deleted');
        fetchVehicles();
      } catch {
        toast.error('Delete failed');
      }
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setForm(vehicle);
    setEditingId(vehicle.id || null);
    setShowForm(true);
  };

  const filteredVehicles = vehicles.filter((v) =>
    v.busNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <ToastContainer position="top-right" />
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-800">Vehicle Management</h2>
          <button
            onClick={() => {
              setForm({ busNo: '', capacity: 0 });
              setEditingId(null);
              setShowForm(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Vehicle
          </button>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="mb-4 flex justify-end gap-2 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by bus number"
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
                <th className="p-2">Bus Number</th>
                <th className="p-2">Capacity</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="p-2">{v.busNo}</td>
                  <td className="p-2">{v.capacity}</td>
                  <td className="p-2">
                    {v.status === 'active' ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </td>
                  <td className="p-2 space-x-3">
                    <button onClick={() => handleEdit(v)} className="text-blue-600">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(v.id)} className="text-red-600">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No vehicles found.
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
                {editingId ? 'Edit Vehicle' : 'Add Vehicle'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-2 right-3 text-gray-500 text-xl hover:text-black"
              >
                &times;
              </button>
              <div className="space-y-4">
                <input
                  name="busNo"
                  value={form.busNo}
                  onChange={handleChange}
                  placeholder="Bus Number"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="capacity"
                  type="number"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="Capacity"
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

export default VehicleManagement;
