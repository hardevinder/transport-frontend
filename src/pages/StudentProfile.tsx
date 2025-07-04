import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../layouts/StudentLayout';

interface Student {
  id: string;
  name: string;
  phone: string;
  admissionNumber?: string;
  profilePicture?: string;
  addressLine?: string;
  cityOrVillage?: string;
  class?: { name: string };
  route?: { name: string };
  stop?: { stopName: string };
}

const StudentProfile: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<Partial<Student>>({});
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const studentId = JSON.parse(localStorage.getItem('studentInfo') || '{}')?.id;
  const token = localStorage.getItem('studentToken');

  useEffect(() => {
    if (!studentId || !token) {
      navigate('/student/login');
      return;
    }

    (async () => {
      try {
        const res = await axios.get(`/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const studentData = res.data as Student;
        setStudent(studentData);
        setForm(studentData);
      } catch (err) {
        console.error('Failed to fetch student:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, studentId, token]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.put(`/students/${studentId}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Profile updated!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    const formData = new FormData();
    formData.append('id', studentId);
    formData.append('image', image);

    try {
      await axios.post('/students/upload-picture', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Photo uploaded!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to upload photo.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentInfo');
    navigate('/student/login');
  };

  if (loading || !student) return <div className="text-center mt-10">Loading...</div>;

  return (
    <StudentLayout>
      <div className="max-w-xl mx-auto bg-white p-6 shadow rounded">
        <h2 className="text-xl font-bold text-center text-blue-700 mb-4">My Profile</h2>

        <div className="text-center mb-4">
          <img
            src={`http://localhost:3000/public${student.profilePicture}`}
            alt="Profile"
            className="w-24 h-24 rounded-full mx-auto border border-blue-500"
          />
          <input
            type="file"
            className="mt-2 text-sm"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
          <button
            onClick={handleUpload}
            className="text-sm mt-2 bg-blue-600 text-white px-3 py-1 rounded"
          >
            Upload Photo
          </button>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="text-sm font-semibold">Name</label>
            <input
              value={form.name || ''}
              disabled
              className="w-full p-2 border border-gray-300 rounded mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Phone</label>
            <input
              name="phone"
              value={form.phone || ''}
              onChange={handleInput}
              className="w-full p-2 border border-gray-300 rounded mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Address</label>
            <input
              name="addressLine"
              value={form.addressLine || ''}
              onChange={handleInput}
              className="w-full p-2 border border-gray-300 rounded mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">City / Village</label>
            <input
              name="cityOrVillage"
              value={form.cityOrVillage || ''}
              onChange={handleInput}
              className="w-full p-2 border border-gray-300 rounded mt-1"
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;
