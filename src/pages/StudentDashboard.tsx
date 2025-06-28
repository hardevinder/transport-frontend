import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

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
  feeStructureId: string; // Needed for payment
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(res => {
          const data = res.data as { slabs: Slab[] };
          setDues(data.slabs || []);
        })
        .catch(err => {
          console.error("Fee dues fetch error:", err);
        });


     axios
      .get('/transport-org/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(res => {
        const orgData = res.data as TransportOrg[];
        if (Array.isArray(orgData) && orgData.length > 0) {
          setOrg(orgData[0]);
        }
      })
      .catch(err => {
        console.error("Org fetch error:", err);
      });

    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentInfo');
    navigate('/student/login');
  };

  const handlePayNow = (slab: Slab) => {
    // Redirect to Razorpay payment page or initiate Razorpay logic
    // This is where you'd call the /create-order API
    navigate(`/student/pay?slab=${slab.slab}&amount=${slab.finalPayable}&feeStructureId=${slab.feeStructureId}`);
  };

  if (!student) {
    return <div className="text-center mt-20 text-gray-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="bg-blue-100 rounded-lg p-4 mb-6 shadow text-center">
        {org && (
          <div>
            <h1 className="text-3xl font-bold text-blue-800 mb-2">{org.name}</h1>
            <p className="text-sm text-gray-700">{org.address}</p>
            <p className="text-sm text-gray-700">
              Contact: {org.contact} | Email: {org.email}
            </p>
            <p className="text-sm text-gray-700">{org.website}</p>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-blue-700 text-center">Welcome, {student.name}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <p><strong>Admission Number:</strong> {student.admissionNumber}</p>
          <p><strong>Phone:</strong> {student.phone}</p>
          {student.class && <p><strong>Class:</strong> {student.class.name}</p>}
          {student.route && <p><strong>Route:</strong> {student.route.name}</p>}
          {student.stop && <p><strong>Stop:</strong> {student.stop.stopName}</p>}
          {student.addressLine && <p><strong>Address:</strong> {student.addressLine}, {student.cityOrVillage}</p>}
        </div>

        {dues.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-2 text-blue-600">Pending Fee Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border border-gray-200 rounded">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="p-2 border">Slab</th>
                    <th className="p-2 border">Due Amount</th>
                    <th className="p-2 border">Fine</th>
                    <th className="p-2 border">Total Payable</th>
                    <th className="p-2 border">Due Date</th>
                    <th className="p-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dues.map((d, idx) => (
                    <tr key={idx} className="text-center hover:bg-gray-50">
                      <td className="p-2 border">{d.slab}</td>
                      <td className="p-2 border">Rs. {d.dueAmount}</td>
                      <td className="p-2 border">Rs. {d.fine}</td>
                      <td className="p-2 border font-semibold">Rs. {d.finalPayable}</td>
                      <td className="p-2 border">{new Date(d.dueDate).toLocaleDateString()}</td>
                      <td className="p-2 border">
                        {d.status === 'Due' ? (
                          <button
                            onClick={() => handlePayNow(d)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Pay Online
                          </button>
                        ) : (
                          <span className="text-green-700 font-semibold">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
