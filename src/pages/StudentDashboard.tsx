import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import StudentLayout from '../layouts/StudentLayout';

interface Student {
  id: string;
  name: string;
  phone: string;
  admissionNumber: string;
  class?: { name: string };
  stop?: { stopName: string };
  route?: { name: string };
  addressLine?: string;
  cityOrVillage?: string;
}

interface Slab {
  slab: string;
  dueAmount: number;
  fine: number;
  finalPayable: number;
  status: string;
  paidAmount: number;
  paymentDate: string | null;
  dueDate: string;
  feeStructureId: string;
}

interface TransportOrg {
  name: string;
  address: string;
  contact: string;
  email: string;
  website: string;
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [dues, setDues] = useState<Slab[]>([]);
  const [org, setOrg] = useState<TransportOrg | null>(null);

  useEffect(() => {
    const storedStudent = localStorage.getItem('studentInfo');
    if (!storedStudent) {
      navigate('/student/login');
    } else {
      const parsed = JSON.parse(storedStudent);
      setStudent(parsed);

      const token = localStorage.getItem('studentToken');

      axios
        .get(`/transactions/fee-due-details/${parsed.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => {
          const data = res.data as { slabs: Slab[] };
          setDues(data.slabs || []);
        })
        .catch(err => {
          console.error('Fee dues fetch error:', err);
        });

      axios
        .get('/transport-org/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => {
          const orgData = res.data as TransportOrg[];
          if (Array.isArray(orgData) && orgData.length > 0) {
            setOrg(orgData[0]);
          }
        })
        .catch(err => {
          console.error('Org fetch error:', err);
        });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentInfo');
    navigate('/student/login');
  };

  const handlePayNow = (selectedSlab: Slab) => {
  const selectedIndex = dues.findIndex(d => d.slab === selectedSlab.slab);

  // Get all slabs up to and including selected, and filter unpaid ones
  const slabsToPay = dues.slice(0, selectedIndex + 1).filter(d => d.status === 'Due');

  if (slabsToPay.length === 0) {
    alert("No unpaid dues available before this slab.");
    return;
  }

  const totalPayable = slabsToPay.reduce((sum, slab) => sum + slab.finalPayable, 0);

  const slabDetails = slabsToPay.map(slab => ({
    slab: slab.slab,
    amount: slab.finalPayable,
    feeStructureId: slab.feeStructureId,
  }));

  navigate(
    `/student/pay?slabs=${encodeURIComponent(JSON.stringify(slabDetails))}&total=${totalPayable}`
  );
};


  if (!student) {
    return <div className="text-center mt-20 text-gray-600">Loading...</div>;
  }

  return (
  <StudentLayout>
    {/* School org header */}
    <div className="bg-blue-100 rounded-lg p-4 mb-6 shadow text-center">
      {org && (
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-2">{org.name}</h1>
          <p className="text-xs sm:text-sm text-gray-700">{org.address}</p>
          <p className="text-xs sm:text-sm text-gray-700">
            Contact: {org.contact} | Email: {org.email}
          </p>
          <p className="text-xs sm:text-sm text-gray-700">{org.website}</p>
        </div>
      )}
    </div>

    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-blue-700 text-center">
        Welcome, {student.name}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 text-sm sm:text-base">
        <p><strong>Admission Number:</strong> {student.admissionNumber}</p>
        <p><strong>Phone:</strong> {student.phone}</p>
        {student.class && <p><strong>Class:</strong> {student.class.name}</p>}
        {student.route && <p><strong>Route:</strong> {student.route.name}</p>}
        {student.stop && <p><strong>Stop:</strong> {student.stop.stopName}</p>}
        {student.addressLine && (
          <p><strong>Address:</strong> {student.addressLine}, {student.cityOrVillage}</p>
        )}
      </div>

      {dues.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4 text-blue-600">Pending Fee Details</h3>

          {/* Table for larger screens */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full table-auto border border-gray-200 rounded">
              <thead>
                <tr className="bg-blue-100">
                  <th className="p-2 border text-sm">Slab</th>
                  <th className="p-2 border text-sm">Due Amount</th>
                  <th className="p-2 border text-sm">Fine</th>
                  <th className="p-2 border text-sm">Total Payable</th>
                  <th className="p-2 border text-sm">Due Date</th>
                  <th className="p-2 border text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {dues.map((d, idx) => (
                  <tr key={idx} className="text-center hover:bg-gray-50">
                    <td className="p-2 border text-sm">{d.slab}</td>
                    <td className="p-2 border text-sm">Rs. {d.dueAmount}</td>
                    <td className="p-2 border text-sm">Rs. {d.fine}</td>
                    <td className="p-2 border font-semibold text-sm">Rs. {d.finalPayable}</td>
                    <td className="p-2 border text-sm">{new Date(d.dueDate).toLocaleDateString()}</td>
                    <td className="p-2 border">
                      {d.status === 'Due' ? (
                        <button
                          onClick={() => handlePayNow(d)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Pay Online
                        </button>
                      ) : (
                        <span className="text-green-700 font-semibold text-sm">Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vertical cards for mobile */}
          <div className="block sm:hidden space-y-4">
            {dues.map((d, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-sm"><strong>Slab:</strong> {d.slab}</p>
                <p className="text-sm"><strong>Due Amount:</strong> Rs. {d.dueAmount}</p>
                <p className="text-sm"><strong>Fine:</strong> Rs. {d.fine}</p>
                <p className="text-sm font-semibold"><strong>Total Payable:</strong> Rs. {d.finalPayable}</p>
                <p className="text-sm"><strong>Due Date:</strong> {new Date(d.dueDate).toLocaleDateString()}</p>
                <div className="mt-2">
                  {d.status === 'Due' ? (
                    <button
                      onClick={() => handlePayNow(d)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm w-full"
                    >
                      Pay Online
                    </button>
                  ) : (
                    <span className="text-green-700 font-semibold text-sm">Paid</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </StudentLayout>
);

};

export default StudentDashboard;