import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { API } from '../config/api';
import { toast, ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../components/DashboardLayout';
import { FaTrashAlt, FaEdit } from 'react-icons/fa'; // ✅ NEW

interface TransportOrgProfileInput {
  id?: string;
  name: string;
  address: string;
  contact: string;
  email: string;
  website?: string;
}

const TransportOrgProfile: React.FC = () => {
  const [profiles, setProfiles] = useState<TransportOrgProfileInput[]>([]);
  const [form, setForm] = useState<TransportOrgProfileInput>({
    name: '',
    address: '',
    contact: '',
    email: '',
    website: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await axios.get(API.TRANSPORT_PROFILE);
      const data = Array.isArray(res.data) ? res.data : [res.data];
      setProfiles(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load profiles.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = (profile: TransportOrgProfileInput) => {
    setForm(profile);
    setEditingId(profile.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this profile!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API.TRANSPORT_PROFILE}/${id}`);
        toast.success('Profile deleted.');
        fetchProfiles();
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Error deleting profile.');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await axios.put(`${API.TRANSPORT_PROFILE}/${editingId}`, form);
        toast.success('Profile updated successfully!');
      } else {
        await axios.post(API.TRANSPORT_PROFILE, form);
        toast.success('Profile created successfully!');
      }

      setForm({ name: '', address: '', contact: '', email: '', website: '' });
      setEditingId(null);
      setShowForm(false);
      fetchProfiles();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error saving profile.');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <ToastContainer position="top-right" />
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-800">Transport Organization Profiles</h2>
          <button
            onClick={() => {
              setForm({ name: '', address: '', contact: '', email: '', website: '' });
              setEditingId(null);
              setShowForm(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add New
          </button>
        </div>

        <div className="bg-white rounded shadow p-4 mb-6 overflow-auto">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="min-w-full table-auto border">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2">Name</th>
                  <th className="p-2">Contact</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Website</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.length > 0 ? (
                  profiles.map((profile) => (
                    <tr key={profile.id} className="border-t">
                      <td className="p-2">{profile.name}</td>
                      <td className="p-2">{profile.contact}</td>
                      <td className="p-2">{profile.email}</td>
                      <td className="p-2">{profile.website || '-'}</td>
                      <td className="p-2 space-x-2 flex items-center">
                        <button
                          onClick={() => handleEdit(profile)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(profile.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">
                      No profiles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Form remains unchanged */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xl relative">
              <h3 className="text-xl font-semibold mb-4 text-blue-800">
                {editingId ? 'Edit Profile' : 'Add New Profile'}
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
                  placeholder="Organization Name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
                <textarea
                  name="address"
                  placeholder="Address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
                <input
                  name="contact"
                  placeholder="Contact"
                  value={form.contact}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
                <input
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
                <input
                  name="website"
                  placeholder="Website"
                  value={form.website}
                  onChange={handleChange}
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

export default TransportOrgProfile;
