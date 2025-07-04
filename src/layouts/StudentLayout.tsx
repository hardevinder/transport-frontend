import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentProfileMenu from '../components/StudentProfileMenu';
import axios from '../utils/axios';
import { API } from '../config/api';

const StudentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedStudent = localStorage.getItem('studentInfo');
    if (!storedStudent) {
      navigate('/student/login');
    } else {
      setStudent(JSON.parse(storedStudent));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentInfo');
    navigate('/student/login');
  };

  if (!student) return null;

  return (
    <div className="min-h-screen bg-gray-50 relative p-4 sm:p-6">
      <StudentProfileMenu student={student} onLogout={handleLogout} />
      {children}
    </div>
  );
};

export default StudentLayout;
