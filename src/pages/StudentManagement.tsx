  // pages/StudentManagement.tsx
  import React, { useEffect, useState } from 'react';
  import axios from '../utils/axios';
  import { API } from '../config/api';
  import { toast, ToastContainer } from 'react-toastify';
  import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
  import 'react-toastify/dist/ReactToastify.css';
  import DashboardLayout from '../components/DashboardLayout';

  interface Student {
    id?: string;
    name: string;
    phone: string;
    admissionNumber?: string;
    password?: string;
    classId?: string;
    routeId?: string;
    stopId?: string;
    concessionId?: string;
    status?: string;
    addressLine?: string;      // ✅ added
    cityOrVillage?: string;    // ✅ added
    gender?: string; 
    class?: { name: string };
    route?: { name: string };
    stop?: { stopName: string };
    vehicleId?: string;
    vehicle?: { busNo: string }; // ✅ add this
  }

  interface ClassOption {
    id: string;
    name: string;
  }

  interface RouteOption {
    id: string;
    name: string;
  }

  interface StopOption {
    id: string;
    stopName: string;
  }

  interface VehicleOption {
    id: string;
    busNo: string;
  }



  const StudentManagement: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [form, setForm] = useState<Student>({ name: '', phone: '' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [routes, setRoutes] = useState<RouteOption[]>([]);
    const [stops, setStops] = useState<StopOption[]>([]);
    const [vehicles, setVehicles] = useState<VehicleOption[]>([]);

    useEffect(() => {
      fetchStudents();
      fetchClasses();
      fetchRoutes();
      fetchVehicles(); // ✅ new
    }, []);

    const fetchStudents = async () => {
      try {
        const res = await axios.get<Student[]>(API.STUDENTS);
        setStudents(res.data);
      } catch {
        toast.error('Failed to fetch students');
      }
    };

    const fetchClasses = async () => {
      try {
        const res = await axios.get<ClassOption[]>(API.CLASSES);
        setClasses(res.data);
      } catch {
        toast.error('Failed to fetch classes');
      }
    };

    const fetchRoutes = async () => {
      try {
        const res = await axios.get<RouteOption[]>(API.ROUTES);
        setRoutes(res.data);
      } catch {
        toast.error('Failed to fetch routes');
      }
    };

  const fetchStops = async (routeId: string) => {
      try {
        const res = await axios.get<StopOption[]>(`${API.STOPS}/${routeId}`);
        setStops(res.data);
      } catch {
        toast.error('Failed to fetch stops');
      }
    };


    const fetchVehicles = async () => {
      try {
          const res = await axios.get<VehicleOption[]>(API.VEHICLES);
          setVehicles(res.data);
        } catch {
          toast.error('Failed to fetch vehicles');
        }
      };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));

      if (name === 'routeId') {
        fetchStops(value);
        setForm((prev) => ({ ...prev, stopId: '' }));
      }
    };

    const handleSubmit = async () => {
      if (!form.name || !form.phone) return toast.error('Name and phone are required');

      try {
        if (editingId) {
          await axios.put(`${API.STUDENTS}/${editingId}`, form);
          toast.success('Student updated');
        } else {
          await axios.post(API.STUDENTS, form);
          toast.success('Student created');
        }
        setForm({ name: '', phone: '' });
        setEditingId(null);
        setShowForm(false);
        fetchStudents();
      } catch {
        toast.error('Failed to save student');
      }
    };

    const handleDelete = async (id?: string) => {
      if (!id) return;
      if (window.confirm('Are you sure?')) {
        try {
          await axios.delete(`${API.STUDENTS}/${id}`);
          toast.success('Student deleted');
          fetchStudents();
        } catch {
          toast.error('Delete failed');
        }
      }
    };

    const handleToggleStatus = async (id: string) => {
      try {
        await axios.patch(`${API.STUDENTS}/${id}/toggle-status`);
        toast.success('Status toggled');
        fetchStudents();
      } catch {
        toast.error('Status update failed');
      }
    };

    const handleExport = async () => {
    try {
      const response = await axios.get(`${API.STUDENTS}/download-sample`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_sample.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export sample Excel');
    }
  };


  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post<{ message: string; errors?: string[] }>(
        `${API.STUDENTS}/import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success(res.data.message);
      if (res.data.errors?.length) {
        res.data.errors.forEach((err: string) => toast.warn(err));
      }

      fetchStudents();
    } catch {
      toast.error('Failed to import Excel file');
    }
  };



    const handleEdit = (student: Student) => {
          setForm({
        ...student,
        gender:
          student.gender?.toLowerCase() === 'male'
            ? 'Male'
            : student.gender?.toLowerCase() === 'female'
            ? 'Female'
            : student.gender?.toLowerCase() === 'other'
            ? 'Other'
            : '',
      });

      setEditingId(student.id || null);
      setShowForm(true);
      if (student.routeId) fetchStops(student.routeId);
    };

    const filtered = students.filter((s) =>
      `${s.name} ${s.phone} ${s.admissionNumber || ''}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <DashboardLayout>
        <div className="p-6">
          <ToastContainer position="top-right" />
          <div className="flex justify-between mb-4 items-center">
            <h2 className="text-2xl font-bold text-blue-800">Student Management</h2>
            <button
              onClick={() => {
                setForm({ name: '', phone: '' });
                setEditingId(null);
                setShowForm(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Add Student
            </button>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border p-2 rounded w-64"
              />
              <button
                onClick={() => setSearch('')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded"
              >
                Reset
              </button>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={handleExport}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                ⬇️ Export Sample
              </button>

              <label className="cursor-pointer bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                ⬆️ Import Excel
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleImport}
                  hidden
                />
              </label>
            </div>


            <table className="w-full border table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Phone</th>
                  <th className="p-2 text-left">Admission No.</th>
                  <th className="p-2 text-left">Class</th>
                  <th className="p-2 text-left">Route</th>
                  <th className="p-2 text-left">Stop</th>
                  <th className="p-2 text-left">Bus Number</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">{s.phone}</td>
                    <td className="p-2">{s.admissionNumber || '—'}</td>
                    <td className="p-2">{s.class?.name || '—'}</td>
                    <td className="p-2">{s.route?.name || '—'}</td>
                    <td className="p-2">{s.stop?.stopName || '—'}</td>
                    <td className="p-2">{s.vehicle?.busNo || '—'}</td>
                    <td className="p-2">
                      {s.status === 'active' ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </td>
                    <td className="p-2 space-x-3">
                      <button onClick={() => handleEdit(s)} className="text-blue-600">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-600">
                        <FaTrash />
                      </button>
                      <button onClick={() => s.id && handleToggleStatus(s.id)} className="text-yellow-600">
                        {s.status === 'active' ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-gray-500">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl relative">
                <h3 className="text-xl font-semibold mb-4 text-blue-800">
                  {editingId ? 'Edit Student' : 'Add Student'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="absolute top-2 right-3 text-gray-500 text-xl hover:text-black"
                >
                  &times;
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Name', name: 'name', type: 'text', placeholder: 'Name' },
                    { label: 'Phone', name: 'phone', type: 'text', placeholder: 'Phone' },
                    { label: 'Admission Number', name: 'admissionNumber', type: 'text', placeholder: 'Admission Number' },
                    { label: 'Password', name: 'password', type: 'password', placeholder: 'Password' },
                    { label: 'Address Line', name: 'addressLine', type: 'text', placeholder: 'Address Line' },
                    { label: 'City or Village', name: 'cityOrVillage', type: 'text', placeholder: 'City or Village' },
                  ].map(({ label, name, type, placeholder }) => (
                    <label key={name} className="block">
                      <span className="text-sm font-medium">{label}</span>
                      <input
                        name={name}
                        type={type}
                        value={(form as any)[name] || ''}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className="w-full border p-2 rounded mt-1"
                      />
                    </label>
                  ))}

                  {/* Gender */}
                  <label className="block">
                    <span className="text-sm font-medium">Gender</span>
                    <select
                      name="gender"
                      value={form.gender || ''}
                      onChange={handleChange}
                      className="w-full border p-2 rounded mt-1"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  {/* Class */}
                  <label className="block">
                    <span className="text-sm font-medium">Class</span>
                    <select
                      name="classId"
                      value={form.classId || ''}
                      onChange={handleChange}
                      className="w-full border p-2 rounded mt-1"
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </label>

                  {/* Route */}
                  <label className="block">
                    <span className="text-sm font-medium">Route</span>
                    <select
                      name="routeId"
                      value={form.routeId || ''}
                      onChange={handleChange}
                      className="w-full border p-2 rounded mt-1"
                    >
                      <option value="">Select Route</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </label>

                  {/* Stop */}
                  <label className="block">
                    <span className="text-sm font-medium">Stop</span>
                    <select
                      name="stopId"
                      value={form.stopId || ''}
                      onChange={handleChange}
                      className="w-full border p-2 rounded mt-1"
                    >
                      <option value="">Select Stop</option>
                      {stops.map((s) => (
                        <option key={s.id} value={s.id}>{s.stopName}</option>
                      ))}
                    </select>
                  </label>

                  {/* Bus Number */}
                  <label className="block">
                    <span className="text-sm font-medium">Bus Number</span>
                    <select
                      name="vehicleId"
                      value={form.vehicleId || ''}
                      onChange={handleChange}
                      className="w-full border p-2 rounded mt-1"
                    >
                      <option value="">Select Bus Number</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>{v.busNo}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Action Buttons */}
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

  export default StudentManagement;
