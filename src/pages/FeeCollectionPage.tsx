import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { API } from '../config/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import { FaPrint, FaEdit, FaTrash } from 'react-icons/fa';
import { pdf } from '@react-pdf/renderer';
import PdfReceiptDocument from '../components/PdfReceiptDocument';

interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  phone?: string;
  classId: string;
  class?: { id: string; name: string };
  stop?: { stopName: string };
  route?: { name: string };
  addressLine?: string;
  cityOrVillage?: string;
}


interface Class {
  id: string;
  name: string;
}

interface FeeSlab {
  slab: string;
  feeStructureId: string;
  dueAmount: number;
  concession: number;
  fine: number;
  finalPayable: number;
  status: 'Paid' | 'Due';
  paidAmount: number;
  paymentDate: string | null;
  collection: number;
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

const FeeCollectionPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedAdmission, setSelectedAdmission] = useState('');
  const [feeSlabs, setFeeSlabs] = useState<FeeSlab[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [tab, setTab] = useState<'class' | 'admission'>('class');
  const [slipId, setSlipId] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online'>('cash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);


  useEffect(() => {
    console.log('Initial useEffect running');
    axios
      .get<Student[]>(API.STUDENTS)
      .then(res => {
        console.log('Students fetched:', res.data);
        setStudents(res.data);
      })
      .catch(err => {
        console.error('Failed to load students:', err);
        toast.error('Failed to load students');
      });
    axios
      .get<Class[]>(API.CLASSES)
      .then(res => {
        console.log('Classes fetched:', res.data);
        setClasses(res.data);
      })
      .catch(err => {
        console.error('Failed to load classes:', err);
        toast.error('Failed to load classes');
      });
    fetchTransactions();

    // Optional: Mock data for testing UI rendering (uncomment to test)
    /*
    setTransactions([
      {
        id: '1',
        slipId: 'slip1',
        studentId: 'student1',
        feeStructureId: 'fee1',
        slab: 'Monthly',
        amount: 1000,
        concession: 100,
        paymentDate: new Date().toISOString(),
        paymentMode: 'Cash',
        status: 'success',
      },
    ]);
    */
  }, []);

  useEffect(() => {
    console.log('Transactions state updated:', transactions);
  }, [transactions]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       fetchTransactions();
//     }, 2000);

//   return () => clearInterval(interval);
// }, []);


  useEffect(() => {
    console.log('Students state updated:', students);
  }, [students]);

  const fetchDueDetails = async (studentId: string) => {
    try {
      const res = await axios.get<{ studentId: string; slabs: FeeSlab[] }>(
        `${API.TRANSACTIONS}/fee-due-details/${studentId}`
      );
      console.log('Due details fetched:', res.data);
      setFeeSlabs(res.data.slabs.map(slab => ({ ...slab, collection: 0 })));
    } catch (error) {
      console.error('Error fetching due details:', error);
      toast.error('Failed to load due details');
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching transactions from:', API.TRANSACTIONS);
      const res = await axios.get<{ transactions: Transaction[] }>(API.TRANSACTIONS);
      setTransactions(res.data.transactions);      
    } catch (error: any) {
      console.error('Error fetching transactions:', error.response?.data || error.message);
      toast.error(`Failed to load transactions: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
const handleSelectStudent = async (id: string) => {
  setSelectedStudentId(id);
  const student = students.find(s => s.id === id) || null;
  setSelectedStudent(student);  // ✅ Set full student data
  await fetchDueDetails(id);
};


  const updateSlab = (slab: string, field: 'concession' | 'collection', value: number) => {
    setFeeSlabs(prev =>
      prev.map(s =>
        s.slab === slab
          ? {
              ...s,
              [field]: value,
              finalPayable: Math.max(
                s.dueAmount +
                  (s.fine || 0) -
                  (field === 'concession' ? value : s.concession || 0) -
                  (field === 'collection' ? value : s.collection || 0),
                0
              ),
            }
          : s
      )
    );
  };

  const handleCollectAll = async () => {
  const validSlabs = feeSlabs.filter(s => s.collection > 0 && s.status === 'Due');
  if (!validSlabs.length) {
    return toast.error('No valid collection amounts entered');
  }

  try {
    const payload = {
      studentId: selectedStudentId,
      mode: paymentMode,              // ← use the radio choice
      status: 'success',
      slabs: validSlabs.map(s => ({
        feeStructureId: s.feeStructureId,
        amount: s.collection,
        concession: s.concession,
        fineConcession: 0,
        paymentDate: new Date().toISOString(),
        transactionId: paymentMode === 'online'
          ? transactionId
          : undefined              // ← only include when online
      }))
    };

    const res = await axios.post<{ slipId: string }>(API.TRANSACTIONS, payload);
    setSlipId(res.data.slipId);
    toast.success('All payments recorded');

    // refresh UI
    await fetchDueDetails(selectedStudentId);
    await fetchTransactions();
    setShowReceipt(true);
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to record payments');
  }
};



const handlePrintReceipt = async (slipId: string) => {
  try {
    type TransactionResponse = Transaction[] | { transactions: Transaction[] };

    const [orgRes, transRes] = await Promise.all([
      axios.get(API.TRANSPORT_ORG_PROFILE),
      axios.get<TransactionResponse>(`${API.TRANSACTIONS}?slipId=${slipId}`),
    ]);

    // ✅ Safely extract transactions
    const transactions = Array.isArray(transRes.data)
      ? transRes.data
      : transRes.data.transactions;

    if (!transactions || transactions.length === 0) {
      throw new Error('❌ No transactions found for this Slip ID');
    }

    const student = students.find(s => s.id === transactions[0]?.studentId);
    if (!student) {
      throw new Error('❌ Student not found for this transaction');
    }

    const orgProfile = Array.isArray(orgRes.data) ? orgRes.data[0] : orgRes.data;
    if (!orgProfile) {
      throw new Error('❌ Organization profile not found');
    }

    // ✅ Log data for debug
    console.log('📌 Slip ID:', slipId);
    console.log('📌 Transactions:', transactions);
    console.log('📌 Student:', student);
    console.log('📌 Org Profile:', orgProfile);

    const blob = await pdf(
      <PdfReceiptDocument
        school={orgProfile}
        student={student}
        transactions={transactions}
      />
    ).toBlob();

    if (!blob || blob.size === 0) {
      throw new Error('❌ PDF blob is empty or invalid');
    }

    // ✅ Display using FileReader & iframe (popup-safe)
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result;
      const win = window.open('', '_blank');
      if (!win) {
        toast.error('Popup blocked. Please allow popups for this site.');
        return;
      }
      win.document.write(`
        <html><head><title>Transport Fee Receipt</title></head>
        <body style="margin:0">
          <iframe width="100%" height="100%" src="${base64data}" frameborder="0"></iframe>
        </body></html>
      `);
    };
    reader.readAsDataURL(blob);
  } catch (err: any) {
    console.error('🧨 Error generating receipt:', err);
    toast.error(err.message || 'Failed to generate or open receipt');
  }
};



  const handleEditTransaction = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setShowEditModal(true);
  };

  const handleUpdateTransaction = async () => {
    if (!editTransaction) return;
    try {
      await axios.put(`${API.TRANSACTIONS}/${editTransaction.id}`, {
        ...editTransaction,
        paymentDate: new Date(editTransaction.paymentDate).toISOString(),
      });
      toast.success('Transaction updated');
      setShowEditModal(false);
      setEditTransaction(null);
      await fetchTransactions();
      if (selectedStudentId) await fetchDueDetails(selectedStudentId);
    } catch (err: any) {
      console.error('Error updating transaction:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to update transaction');
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setDeleteTransactionId(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!deleteTransactionId) return;
    try {
      await axios.delete(`${API.TRANSACTIONS}/${deleteTransactionId}`);
      toast.success('Transaction deleted');
      setShowDeleteModal(false);
      setDeleteTransactionId(null);
      await fetchTransactions();
      if (selectedStudentId) await fetchDueDetails(selectedStudentId);
    } catch (err: any) {
      console.error('Error deleting transaction:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Transport Fee Collection</h2>
           <button
              onClick={fetchTransactions}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
            >
              🔄 Refresh Transactions
            </button>
          
          <button
            onClick={() => {
              setSelectedStudentId('');
              setFeeSlabs([]);
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            Collect Fee
          </button>
        </div>

        {/* Transaction History */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Transaction History</h3>
          {isLoading ? (
            <p className="text-gray-600">Loading transactions...</p>
          ) : transactions.length > 0 ? (
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                     <th className="p-2 border text-left">#</th> {/* Serial Number */}
                    <th className="p-2 border text-left">Student</th>
                    <th className="p-2 border text-left">Admission No</th>
                    <th className="p-2 border text-left">Slab</th>
                    <th className="p-2 border text-left">Amount</th>
                    <th className="p-2 border text-left">Concession</th>
                    <th className="p-2 border text-left">Date</th>
                    <th className="p-2 border text-left">Slip ID</th> {/* ✅ Added */}
                    <th className="p-2 border text-left">Mode</th>
                    <th className="p-2 border text-left">Actions</th>
                  </tr>

              </thead>
 <tbody>
    {Array.from(new Set(transactions.map(t => t.slipId))).map((currentSlipId, index) => {
    const grouped = transactions.filter(t => t.slipId === currentSlipId);
    const first = grouped[0];
    const student = students.find(s => s.id === first.studentId);

    const totalAmount = grouped.reduce((sum, t) => sum + t.amount, 0);
    const totalConcession = grouped.reduce((sum, t) => sum + (t.concession || 0), 0);

    return (
      <tr key={currentSlipId} className="hover:bg-gray-50">
        <td className="p-2 border font-semibold text-gray-700">{index + 1}</td>
        <td className="p-2 border">{student?.name || 'Unknown'}</td>
        <td className="p-2 border">{student?.admissionNumber || '—'}</td>
        <td className="p-2 border">
          {grouped.map(t => t.slab).join(', ')}
        </td>
        <td className="p-2 border">₹{totalAmount}</td>
        <td className="p-2 border">₹{totalConcession}</td>
        <td className="p-2 border">
          {new Date(first.paymentDate).toLocaleDateString()}
        </td>
        <td className="p-2 border font-semibold text-blue-700">{currentSlipId}</td>
        <td className="p-2 border">{first.mode}</td>
        <td className="p-2 border">
          <div className="flex gap-2">
            <button
              onClick={() => handlePrintReceipt(currentSlipId)}

              className="text-green-600 hover:text-green-800"
              title="Print Receipt"
            >
              <FaPrint />
            </button>
            <button
              onClick={() => handleEditTransaction(first)}
              className="text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDeleteTransaction(first.id)}
              className="text-red-600 hover:text-red-800"
              title="Delete"
            >
              <FaTrash />
            </button>
          </div>
        </td>

      </tr>
    );
  })}
</tbody>



            </table>
          ) : (
            <p className="text-gray-600">No transactions available. Create a new transaction to get started.</p>
          )}
        </div>

        {/* Collect Fee Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Collect Fee</h3>
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setTab('class')}
                  className={`flex-1 py-2 px-4 ${tab === 'class' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  Select by Class
                </button>
                <button
                  onClick={() => setTab('admission')}
                  className={`flex-1 py-2 px-4 ${tab === 'admission' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  By Admission No
                </button>
              </div>


              {selectedStudent && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-300 rounded-lg text-sm text-gray-800 space-y-1">
                  <p><strong>Name:</strong> {selectedStudent.name}</p>
                  <p><strong>Phone:</strong> {selectedStudent.phone || 'N/A'}</p>
                  <p><strong>Admission No:</strong> {selectedStudent.admissionNumber}</p>
                  {selectedStudent.class && <p><strong>Class:</strong> {selectedStudent.class.name}</p>}
                  {selectedStudent.route && <p><strong>Route:</strong> {selectedStudent.route.name}</p>}
                  {selectedStudent.stop && <p><strong>Stop:</strong> {selectedStudent.stop.stopName}</p>}
                  {(selectedStudent.addressLine || selectedStudent.cityOrVillage) && (
                    <p>
                      <strong>Address:</strong> {selectedStudent.addressLine}, {selectedStudent.cityOrVillage}
                    </p>
                  )}
                </div>
              )}


              {tab === 'class' ? (
                <>
                  <select
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    className="w-full mb-4 p-3 border rounded-lg"
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedStudentId}
                    onChange={e => handleSelectStudent(e.target.value)}
                    className="w-full mb-4 p-3 border rounded-lg"
                  >
                    <option value="">Select Student</option>
                    {students
                      .filter(s => s.classId === selectedClass)
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.admissionNumber})
                        </option>
                      ))}
                  </select>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={selectedAdmission}
                    onChange={e => setSelectedAdmission(e.target.value)}
                    className="w-full mb-4 p-3 border rounded-lg"
                    placeholder="Enter Admission Number"
                  />
                  <button
                    className="w-full bg-blue-600 text-white py-3 rounded-lg"
                   onClick={() => {
                      const student = students.find(s => s.admissionNumber === selectedAdmission);
                      if (student) {
                        handleSelectStudent(student.id);
                        setSelectedStudent(student);  // ✅ Also set here
                      } else {
                        toast.error('Student not found');
                      }
                    }}

                  >
                    Search & Load
                  </button>
                </>
              )}
              {/* just before your <table> of feeSlabs */}
              <div className="mb-4 flex items-center gap-6">
                {/* Cash radio */}
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="paymentMode"
                    value="cash"
                    checked={paymentMode === 'cash'}
                    onChange={() => setPaymentMode('cash')}
                    className="form-radio"
                  />
                  <span className="ml-2">Cash</span>
                </label>

                {/* Online radio */}
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="paymentMode"
                    value="online"
                    checked={paymentMode === 'online'}
                    onChange={() => setPaymentMode('online')}
                    className="form-radio"
                  />
                  <span className="ml-2">Online</span>
                </label>
              </div>

              {paymentMode === 'online' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg"
                    placeholder="Enter payment gateway txn ID"
                  />
                </div>
              )}


              {feeSlabs.length > 0 && (
                <>
                  <table className="w-full border mt-6">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 border">Slab</th>
                        <th className="p-2 border">Due</th>
                        <th className="p-2 border">Fine</th>
                        <th className="p-2 border">Concession</th>
                        <th className="p-2 border">Collection</th>
                        <th className="p-2 border">Final Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeSlabs.map(s => (
                        <tr key={s.slab}>
                          <td className="p-2 border">{s.slab}</td>
                          <td className="p-2 border">₹{s.dueAmount}</td>
                          <td className="p-2 border">₹{s.fine}</td>
                          <td className="p-2 border">
                            <input
                              type="number"
                              value={s.concession}
                              min="0"
                              className="w-24 p-1 border rounded-lg"
                              onChange={e =>
                                updateSlab(s.slab, 'concession', parseFloat(e.target.value || '0'))
                              }
                              disabled={s.finalPayable === 0}
                            />
                          </td>
                          <td className="p-2 border">
                            <input
                              type="number"
                              value={s.collection}
                              min="0"
                              className="w-24 p-1 border rounded-lg"
                              onChange={e =>
                                updateSlab(s.slab, 'collection', parseFloat(e.target.value || '0'))
                              }
                              disabled={s.finalPayable === 0}
                            />
                          </td>
                          <td className="p-2 border font-semibold">₹{s.finalPayable}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={handleCollectAll}
                    className="mt-4 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
                  >
                    Collect All
                  </button>
                </>
              )}

              <div className="mt-6 text-right">
                <button
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowModal(false);
                    setFeeSlabs([]);
                    setSelectedClass('');
                    setSelectedStudentId('');
                    setSelectedAdmission('');
                    setSelectedStudent(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {showEditModal && editTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Transaction</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    value={editTransaction.amount}
                    min="0"
                    className="w-full p-2 border rounded-lg"
                    onChange={e =>
                      setEditTransaction({ ...editTransaction, amount: parseFloat(e.target.value || '0') })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Concession</label>
                  <input
                    type="number"
                    value={editTransaction.concession}
                    min="0"
                    className="w-full p-2 border rounded-lg"
                    onChange={e =>
                      setEditTransaction({ ...editTransaction, concession: parseFloat(e.target.value || '0') })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
                  <select
                    value={editTransaction.mode}
                    className="w-full p-2 border rounded-lg"
                    onChange={e => setEditTransaction({ ...editTransaction, mode: e.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-2 justify-end">
                <button
                  onClick={handleUpdateTransaction}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditTransaction(null);
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this transaction? This action cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={confirmDeleteTransaction}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTransactionId(null);
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Receipt</h3>
              <p>
                <strong>Student:</strong> {students.find(s => s.id === selectedStudentId)?.name}
              </p>
              <p>
                <strong>Slabs:</strong> {feeSlabs.filter(s => s.collection > 0).map(s => s.slab).join(', ') || 'Multiple'}
              </p>
              <p>
                <strong>Concession:</strong> ₹{feeSlabs.reduce((sum, s) => sum + (s.concession || 0), 0)}
              </p>
              <p>
                <strong>Paid Amount:</strong> ₹{feeSlabs.reduce((sum, s) => sum + (s.collection || 0), 0)}
              </p>
              <p>
                <strong>Date:</strong> {new Date().toLocaleString()}
              </p>
              <div className="mt-4 flex gap-2 justify-end">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  onClick={() => handlePrintReceipt(slipId!)}
                >
                  <FaPrint /> Print
                </button>
                <button
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg"
                  onClick={() => setShowReceipt(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FeeCollectionPage;