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
  vehicle?: { busNo: string }; // ✅ Add this

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
  const [isLoading, setIsLoading] = useState(false);
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
  

  // Load students, classes and today's transactions on mount
  useEffect(() => {
    axios
      .get<Student[]>(API.STUDENTS)
      .then(res => setStudents(res.data))
      .catch(() => toast.error('Failed to load students'));

    axios
      .get<Class[]>(API.CLASSES)
      .then(res => setClasses(res.data))
      .catch(() => toast.error('Failed to load classes'));

    fetchTransactions();
  }, []);

  // Fetch all transactions
  const [totalCollection, setTotalCollection] = useState(0);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get<{ transactions: Transaction[]; totalCollection?: number }>(
        `${API.TRANSACTIONS}/today`
      );
      setTransactions(res.data.transactions);
      // Fallback in case `totalCollection` not provided from backend
      const total = res.data.totalCollection ?? res.data.transactions.reduce(
        (sum, t) => sum + (t.amount || 0),
        0
      );
      setTotalCollection(total);
    } catch (err: any) {
      toast.error(`Failed to load transactions: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  // Fetch due‐slabs for a student
  const fetchDueDetails = async (studentId: string) => {
    try {
      const res = await axios.get<{ studentId: string; slabs: FeeSlab[] }>(
        `${API.TRANSACTIONS}/fee-due-details/${studentId}`
      );
      setFeeSlabs(res.data.slabs.map(slab => ({ ...slab, collection: 0 })));
    } catch {
      toast.error('Failed to load due details');
    }
  };

  // When class‐select dropdown changes
  const handleSelectStudent = async (id: string) => {
    setSelectedStudentId(id);
    const stu = students.find(s => s.id === id) || null;
    setSelectedStudent(stu);
    await fetchDueDetails(id);
  };

  // Update either concession or collection on a slab
  const updateSlab = (slab: string, field: 'concession' | 'collection', value: number) => {
    setFeeSlabs(prev =>
      prev.map(s =>
        s.slab === slab
          ? {
              ...s,
              [field]: value,
              finalPayable: Math.max(
                s.dueAmount +
                  s.fine -
                  (field === 'concession' ? value : s.concession) -
                  (field === 'collection' ? value : s.collection),
                0
              ),
            }
          : s
      )
    );
  };

  // Collect all entered payments
  const handleCollectAll = async () => {
    const valid = feeSlabs.filter(s => s.collection > 0 && s.status === 'Due');
    if (!valid.length) return toast.error('No valid collection amounts entered');

    try {
      const payload = {
        studentId: selectedStudentId,
        mode: paymentMode,
        status: 'success',
        slabs: valid.map(s => ({
          feeStructureId: s.feeStructureId,
          amount: s.collection,
          concession: s.concession,
          fineConcession: 0,
          paymentDate: new Date().toISOString(),
          transactionId: paymentMode === 'online' ? transactionId : undefined,
        })),
      };
      const res = await axios.post<{ slipId: string }>(API.TRANSACTIONS, payload);
      setSlipId(res.data.slipId);
      toast.success('All payments recorded');
      await fetchDueDetails(selectedStudentId);
      await fetchTransactions();
      setShowReceipt(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payments');
    }
  };

  // Generate & open PDF receipt
  const handlePrintReceipt = async (id: string) => {
    try {
      type TxResp = Transaction[] | { transactions: Transaction[] };
      const [orgRes, txRes] = await Promise.all([
        axios.get(API.TRANSPORT_ORG_PROFILE),
        axios.get<TxResp>(`${API.TRANSACTIONS}?slipId=${id}`),
      ]);
      const txs = Array.isArray(txRes.data) ? txRes.data : txRes.data.transactions;
      if (!txs.length) throw new Error('No transactions found for this Slip ID');

      const student = students.find(s => s.id === txs[0].studentId)!;
      const org = Array.isArray(orgRes.data) ? orgRes.data[0] : orgRes.data;

      const blob = await pdf(
        <PdfReceiptDocument school={org} student={student} transactions={txs} />
      ).toBlob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const win = window.open('', '_blank');
        if (!win) return toast.error('Popup blocked.');
        win.document.write(`
          <html><head><title>Receipt</title></head>
          <body style="margin:0">
            <iframe width="100%" height="100%" src="${reader.result}" frameborder="0"></iframe>
          </body></html>
        `);
      };
      reader.readAsDataURL(blob);
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate receipt');
    }
  };

  // Edit, update & delete handlers
  const handleEditTransaction = (tx: Transaction) => {
    setEditTransaction(tx);
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
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update transaction');
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
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete transaction');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Page Heading */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Transport Fee Collection</h2>

        {/* Total Collection Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-green-100 border border-green-300 p-5 rounded-xl shadow-sm">
            <h4 className="text-lg font-semibold text-green-800">Total Collection (Today)</h4>
            <p className="text-2xl font-bold text-green-900 mt-2">₹{totalCollection}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-4 mb-6">
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

        {/* Total Collection Card
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-100 border border-green-300 p-5 rounded-xl shadow-sm">
            <h4 className="text-lg font-semibold text-green-800">Total Collection (Today)</h4>
            <p className="text-2xl font-bold text-green-900 mt-2">₹{totalCollection}</p>
          </div>
        </div> */}

        {/* Transaction History Table */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Today's Transaction History</h3>
          {isLoading ? (
            <p className="text-gray-600">Loading transactions...</p>
          ) : transactions.length ? (
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Student</th>
                  <th className="p-2 border">Admission No</th>
                  <th className="p-2 border">Slab</th>
                  <th className="p-2 border">Amount</th>
                  <th className="p-2 border">Concession</th>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Slip ID</th>
                  <th className="p-2 border">Mode</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(transactions.map(t => t.slipId))).map((sid, idx) => {
                  const group = transactions.filter(t => t.slipId === sid);
                  const first = group[0];
                  const stu = students.find(s => s.id === first.studentId);
                  const totalAmt = group.reduce((a, t) => a + t.amount, 0);
                  const totalCon = group.reduce((a, t) => a + (t.concession || 0), 0);

                  return (
                    <tr key={sid} className="hover:bg-gray-50">
                      <td className="p-2 border font-semibold">{idx + 1}</td>
                      <td className="p-2 border">{stu?.name || 'Unknown'}</td>
                      <td className="p-2 border">{stu?.admissionNumber || '—'}</td>
                      <td className="p-2 border">{group.map(t => t.slab).join(', ')}</td>
                      <td className="p-2 border">₹{totalAmt}</td>
                      <td className="p-2 border">₹{totalCon}</td>
                      <td className="p-2 border">{new Date(first.paymentDate).toLocaleDateString()}</td>
                      <td className="p-2 border font-semibold text-blue-700">{sid}</td>
                      <td className="p-2 border">{first.mode}</td>
                      <td className="p-2 border">
                        <div className="flex gap-2">
                          <button onClick={() => handlePrintReceipt(sid)} className="text-green-600 hover:text-green-800">
                            <FaPrint />
                          </button>
                          <button onClick={() => handleEditTransaction(first)} className="text-blue-600 hover:text-blue-800">
                            <FaEdit />
                          </button>
                          <button onClick={() => handleDeleteTransaction(first.id)} className="text-red-600 hover:text-red-800">
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
            <p className="text-gray-600">No transactions available. Create one to get started.</p>
          )}
        </div>

        {/* Collect Fee Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Collect Fee</h3>

              {/* Tab selectors */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setTab('class')}
                  className={`flex-1 py-2 ${tab === 'class' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  Select by Class
                </button>
                <button
                  onClick={() => setTab('admission')}
                  className={`flex-1 py-2 ${tab === 'admission' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  By Admission No
                </button>
              </div>

              {/* Student detail box */}
              {selectedStudent && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-300 rounded-lg text-sm text-gray-800 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  <div><strong>Name:</strong> {selectedStudent.name}</div>
                  <div><strong>Phone:</strong> {selectedStudent.phone || 'N/A'}</div>
                  <div><strong>Admission No:</strong> {selectedStudent.admissionNumber}</div>
                  <div><strong>Class:</strong> {selectedStudent.class?.name || 'N/A'}</div>
                  <div><strong>Route:</strong> {selectedStudent.route?.name || 'N/A'}</div>
                  <div><strong>Stop:</strong> {selectedStudent.stop?.stopName || 'N/A'}</div>
                  <div><strong>Bus No:</strong> {selectedStudent?.vehicle?.busNo || 'N/A'}</div>
                  {(selectedStudent.addressLine || selectedStudent.cityOrVillage) && (
                    <div className="md:col-span-2">
                      <strong>Address:</strong> {selectedStudent.addressLine}, {selectedStudent.cityOrVillage}
                    </div>
                  )}
                </div>
              )}


              {/* Class vs Admission input */}
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
                    onClick={() => {
                      const stu = students.find(s => s.admissionNumber === selectedAdmission);
                      if (stu) handleSelectStudent(stu.id);
                      else toast.error('Student not found');
                    }}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg"
                  >
                    Search & Load
                  </button>
                </>
              )}

              {/* Payment mode */}
              <div className="mb-4 flex items-center gap-6">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={paymentMode === 'cash'}
                    onChange={() => setPaymentMode('cash')}
                    className="form-radio"
                  />
                  <span className="ml-2">Cash</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={paymentMode === 'online'}
                    onChange={() => setPaymentMode('online')}
                    className="form-radio"
                  />
                  <span className="ml-2">Online</span>
                </label>
              </div>

              {/* Online txn ID */}
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

              {/* Slabs table */}
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
                              onChange={e => updateSlab(s.slab, 'concession', parseFloat(e.target.value))}
                              disabled={s.finalPayable === 0}
                            />
                          </td>
                          <td className="p-2 border">
                            <input
                              type="number"
                              value={s.collection}
                              min="0"
                              className="w-24 p-1 border rounded-lg"
                              onChange={e => updateSlab(s.slab, 'collection', parseFloat(e.target.value))}
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

              {/* Close modal */}
              <div className="mt-6 text-right">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFeeSlabs([]);
                    setSelectedClass('');
                    setSelectedStudentId('');
                    setSelectedAdmission('');
                    setSelectedStudent(null);
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Edit Transaction</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Amount</label>
                  <input
                    type="number"
                    value={editTransaction.amount}
                    min="0"
                    className="w-full p-2 border rounded-lg"
                    onChange={e =>
                      setEditTransaction({
                        ...editTransaction,
                        amount: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Concession</label>
                  <input
                    type="number"
                    value={editTransaction.concession}
                    min="0"
                    className="w-full p-2 border rounded-lg"
                    onChange={e =>
                      setEditTransaction({
                        ...editTransaction,
                        concession: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Mode</label>
                  <select
                    value={editTransaction.mode}
                    className="w-full p-2 border rounded-lg"
                    onChange={e =>
                      setEditTransaction({ ...editTransaction, mode: e.target.value })
                    }
                  >
                    <option>Cash</option>
                    <option>Card</option>
                    <option>Online</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={handleUpdateTransaction} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
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

        {/* Delete Confirmation */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
              <p className="mb-6">Are you sure you want to delete this transaction?</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={confirmDeleteTransaction}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg"
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
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Receipt</h3>
              <p>
                <strong>Student:</strong> {students.find(s => s.id === selectedStudentId)?.name}
              </p>
              <p>
                <strong>Slabs:</strong>{' '}
                {feeSlabs.filter(s => s.collection > 0).map(s => s.slab).join(', ') || 'Multiple'}
              </p>
              <p>
                <strong>Concession:</strong> ₹{feeSlabs.reduce((a, s) => a + s.concession, 0)}
              </p>
              <p>
                <strong>Paid Amount:</strong> ₹{feeSlabs.reduce((a, s) => a + s.collection, 0)}
              </p>
              <p>
                <strong>Date:</strong> {new Date().toLocaleString()}
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => handlePrintReceipt(slipId!)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  <FaPrint /> Print
                </button>
                <button onClick={() => setShowReceipt(false)} className="bg-gray-400 text-white px-4 py-2 rounded-lg">
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
