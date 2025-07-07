import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import StudentLayout from '../layouts/StudentLayout';
import { pdf } from '@react-pdf/renderer';
import PdfReceiptDocument from '../components/PdfReceiptDocument';


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
  slipId?: number; 
}

interface TransportOrg {
  name: string;
  address: string;
  contact: string;
  email: string;
  website: string;
}

interface Transaction {
  id: string;
  slipId: string;
  studentId: string;
  feeStructureId: string;
  slab: string;
  amount: number;
  concession: number;
  paymentDate: string;
  mode: string;
  status: string;
}


const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [dues, setDues] = useState<Slab[]>([]);
  const [org, setOrg] = useState<TransportOrg | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedSlabs, setSelectedSlabs] = useState<Slab[]>([]);
  const [totalPayable, setTotalPayable] = useState(0);

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
    const slabsToPay = dues.slice(0, selectedIndex + 1).filter(d => d.status === 'Due');

    if (slabsToPay.length === 0) {
      alert("No unpaid dues available before this slab.");
      return;
    }

    const total = slabsToPay.reduce((sum, slab) => sum + slab.finalPayable, 0);
    setSelectedSlabs(slabsToPay);
    setTotalPayable(total);
    setShowModal(true);
  };

 const handlePrintReceipt = async (slipId: number) => {
    try {
      if (!student) return;

      const token = localStorage.getItem('studentToken');

      // Fetch transport org profile
      const orgRes = await axios.get('/transport-org/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const orgProfile = Array.isArray(orgRes.data) ? orgRes.data[0] : orgRes.data;

      // Fetch transactions using slipId
      const transRes = await axios.get(`/transactions?slipId=${slipId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

    const transactions = Array.isArray(transRes.data)
      ? transRes.data as Transaction[]
      : (transRes.data as { transactions: Transaction[] }).transactions;


      if (!transactions || transactions.length === 0) {
        throw new Error('No transactions found for this Slip ID');
      }

      const blob = await pdf(
        <PdfReceiptDocument
          school={orgProfile}
          student={student}
          transactions={transactions}
        />
      ).toBlob();

      if (!blob || blob.size === 0) {
        throw new Error('PDF generation failed');
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        const win = window.open('', '_blank');
        if (!win) {
          alert('Please allow popups to view receipt');
          return;
        }
        win.document.write(`
          <html><head><title>Fee Receipt</title></head>
          <body style="margin:0">
            <iframe width="100%" height="100%" src="${base64data}" frameborder="0"></iframe>
          </body></html>
        `);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      console.error('Receipt generation error:', err);
      alert(err.message || 'Unable to generate receipt');
    }
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
                          <>
                            <span className="text-green-700 font-semibold text-sm block">Paid</span>
                            {d.slipId && (
                              <button
                                onClick={() => handlePrintReceipt(d.slipId!)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 mt-1 rounded text-sm"
                              >
                                View Receipt
                              </button>
                            )}
                          </>

                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile-friendly cards */}
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
                      <>
                        <span className="text-green-700 font-semibold text-sm block">Paid</span>
                        {d.slipId && (
                          <button
                            onClick={() => handlePrintReceipt(d.slipId!)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 mt-2 rounded text-sm w-full"
                          >
                            View Receipt
                          </button>
                        )}
                      </>

                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Terms & Conditions */}
      <div className="max-w-4xl mx-auto mt-10 bg-yellow-50 border border-yellow-300 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-yellow-800 mb-4">📜 Transport Terms & Conditions</h3>

        <h4 className="text-lg font-bold text-gray-800 mt-4 mb-2">1. Fee & Payment Policy</h4>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Transport fee will only be accepted through the official fee book or transport app. No other form of payment will be entertained.</li>
          <li>Maintenance charges must be paid strictly as per the schedule in the fee book or online portal.</li>
          <li>Transport charges apply for 11½ months regardless of holidays or attendance. No concession for absence or non-usage.</li>
          <li>Mid-session withdrawal is not allowed. Annual commitment is mandatory.</li>
          <li>Maintenance charges are strictly non-refundable.</li>
          <li>Cheque payments accepted till 7th, cash/online till 10th of each month.</li>
          <li>Late payment penalty: ₹30/day after the due date.</li>
        </ul>

        <h4 className="text-lg font-bold text-gray-800 mt-6 mb-2">2. Transport Route & Conduct Rules</h4>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Buses will not enter narrow or restricted roads as per High Court and local guidelines. Parents must manage pick-up/drop-off at designated points.</li>
          <li>Transport may be immediately suspended for:
            <ul className="list-disc list-inside ml-5">
              <li>Misconduct during transit</li>
              <li>Non-payment or irregular payment</li>
              <li>Lack of parental cooperation</li>
              <li>Damage to vehicle or school property</li>
            </ul>
          </li>
        </ul>

        <p className="text-sm text-gray-600 mt-4 italic">
          Parents are advised to review these policies before opting for transport services to ensure a safe and efficient experience for all students.
        </p>
      </div>


      {/* Confirm Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-blue-700 mb-4">Confirm Your Payment</h2>
            <ul className="mb-4 space-y-1 text-sm text-gray-700 max-h-48 overflow-auto">
              {selectedSlabs.map((s, i) => (
                <li key={i}>
                  ✅ <strong>{s.slab}</strong> – Rs. {s.finalPayable}
                </li>
              ))}
            </ul>
            <p className="text-base font-semibold mb-4 text-gray-800">
              Total Payable: <span className="text-green-700">Rs. {totalPayable}</span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1 rounded bg-gray-300 hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const slabDetails = selectedSlabs.map(slab => ({
                    slab: slab.slab,
                    amount: slab.finalPayable,
                    feeStructureId: slab.feeStructureId,
                  }));
                  setShowModal(false);
                  navigate(
                    `/student/pay?slabs=${encodeURIComponent(JSON.stringify(slabDetails))}&total=${totalPayable}`
                  );
                }}
                className="px-4 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                Proceed to Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default StudentDashboard;
