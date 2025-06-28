import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';

interface LoginResponse {
  token: string;
  student: any;
}

const StudentLoginPage: React.FC = () => {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('studentToken');

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/student/dashboard');
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post<LoginResponse>('/students/login', {
        admissionNumber,
        password,
      });

      localStorage.setItem('studentToken', res.data.token);
      localStorage.setItem('studentInfo', JSON.stringify(res.data.student));
      navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentInfo');
    navigate('/student/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
        {isLoggedIn && (
          <div className="mb-4">
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded"
            >
              Logout
            </button>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">Student Login</h2>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {isLoggedIn ? (
          <p className="text-green-500 text-sm mb-3 text-center">You are already logged in.</p>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Admission Number</label>
              <input
                type="text"
                value={admissionNumber}
                onChange={e => setAdmissionNumber(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
            >
              Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentLoginPage;