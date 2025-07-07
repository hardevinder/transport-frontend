import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../layouts/StudentLayout';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API, BASE_URL } from '../config/api';

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

interface TransportOrg {
  name: string;
  address: string;
  contact: string;
  email: string;
  website: string;
}

const StudentProfile: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<Partial<Student>>({});
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<TransportOrg | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  const studentId = JSON.parse(localStorage.getItem('studentInfo') || '{}')?.id;
  const token = localStorage.getItem('studentToken');

  const fetchStudentData = async () => {
    try {
      const res = await axios.get(`/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const studentData = res.data as Student;
      setStudent(studentData);
      setForm(studentData);
    } catch (err) {
      console.error('Failed to fetch student:', err);
    }
  };

  useEffect(() => {
    if (!studentId || !token) {
      navigate('/student/login');
      return;
    }

    (async () => {
      await fetchStudentData();

      try {
        const orgRes = await axios.get('/transport-org/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const orgData = Array.isArray(orgRes.data) ? orgRes.data[0] : orgRes.data;
        setOrg(orgData);
      } catch (err) {
        console.error('Failed to fetch org:', err);
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
      toast.success('Profile updated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile.');
    }
  };

  const handleUpload = async () => {
      if (!image) return;
      const formData = new FormData();
      formData.append('id', studentId);
      formData.append('image', image);

      try {
        const res = await axios.post<{ student: Student }>('/students/upload-picture', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Photo uploaded!');

        const updatedStudent = res.data?.student;
        setStudent(updatedStudent);
        setForm(updatedStudent);

        // ✅ Update localStorage so menu/header also shows new photo
        localStorage.setItem('studentInfo', JSON.stringify(updatedStudent));

      } catch (err) {
        console.error(err);
        toast.error('Failed to upload photo.');
      }
    };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      toast.warning('Please fill both password fields.');
      return;
    }

    try {
      await axios.post(
        `/students/change-password`,
        {
          studentId,
          currentPassword,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentInfo');
    navigate('/student/login');
  };

  if (loading || !student) return <div className="text-center mt-10">Loading...</div>;

  // ✅ Correct dynamic image URL
   const profileImgUrl = student.profilePicture
      ? `${BASE_URL.replace('/api', '')}/public${student.profilePicture}?t=${Date.now()}`
      : 'https://via.placeholder.com/96x96?text=No+Photo';




  return (
    <StudentLayout>
      {org && (
        <div className="bg-blue-100 rounded-lg p-4 mb-6 shadow text-center max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-2">{org.name}</h1>
          <p className="text-xs sm:text-sm text-gray-700">{org.address}</p>
          <p className="text-xs sm:text-sm text-gray-700">
            Contact: {org.contact} | Email: {org.email}
          </p>
          <p className="text-xs sm:text-sm text-gray-700">{org.website}</p>
          <div className="mt-2">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
            >
              ⬅️ Back to Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto bg-white p-6 shadow rounded">
        <h2 className="text-xl font-bold text-center text-blue-700 mb-4">My Profile</h2>

        <div className="text-center mb-4">
          <img
            src={profileImgUrl}
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
              className="w-full p-2 border border-gray-300 rounded mt-1 bg-gray-100"
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

        <div className="mt-10 border-t pt-6">
          <h3 className="text-center text-blue-700 font-semibold mb-4">Change Password</h3>
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-semibold">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mt-1"
              />
            </div>
            <div className="text-center">
              <button
                onClick={handlePasswordChange}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;
