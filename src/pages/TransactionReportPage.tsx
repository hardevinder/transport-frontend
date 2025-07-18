import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { API } from '../config/api';
import { toast } from 'react-toastify';
import { FaPrint, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import PdfReceiptDocument from '../components/PdfReceiptDocument';
import DashboardLayout from '../components/DashboardLayout';

interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  phone?: string;
  addressLine?: string;
  cityOrVillage?: string;
  profilePicture?: string;
}

interface Transaction {
  id: string;
  slipId: number;
  studentId: string;
  slab: string;
  amount: number;
  concession: number;
  fine?: number;
  mode: string;
  paymentDate: string;
  status: string;
  student?: Student; // Optional for fallback
}

interface TransactionResponse {
  transactions: Transaction[];
  totalCollection: number;
}

const TransactionReportPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalCollection, setTotalCollection] = useState(0);
  const [cashCollection, setCashCollection] = useState(0);
  const [onlineCollection, setOnlineCollection] = useState(0);

  useEffect(() => {
    axios
      .get<Student[]>(API.STUDENTS)
      .then(res => setStudents(res.data))
      .catch(() => toast.error('Failed to load students'));
  }, []);

  const fetchFilteredTransactions = async () => {
    if (!startDate || !endDate) {
      return toast.error('Please select both dates');
    }

    setIsLoading(true);
    try {
      const res = await axios.get<TransactionResponse>(
        `${API.TRANSACTIONS}/filter-by-date?startDate=${startDate}&endDate=${endDate}`
      );
      const allTx = res.data.transactions;
      setTransactions(allTx);
      setTotalCollection(res.data.totalCollection || 0);
      setCashCollection(allTx.filter(t => t.mode === 'cash').reduce((a, t) => a + t.amount, 0));
      setOnlineCollection(allTx.filter(t => t.mode === 'online').reduce((a, t) => a + t.amount, 0));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintReceipt = async (slipId: string | number) => {
    try {
      const [orgRes, txRes] = await Promise.all([
        axios.get(API.TRANSPORT_ORG_PROFILE),
        axios.get<{ transactions: Transaction[] }>(`${API.TRANSACTIONS}?slipId=${slipId}`)
      ]);
      const org = Array.isArray(orgRes.data) ? orgRes.data[0] : orgRes.data;
      const txs = txRes.data.transactions;

      if (!txs.length) throw new Error('No transactions found');

      // Fallback if student is not included inside transaction
      const student = txs[0].student || students.find(s => s.id === txs[0].studentId);
      if (!student) throw new Error('Student info not found');

      const blob = await pdf(
        <PdfReceiptDocument school={org} student={student} transactions={txs} />
      ).toBlob();

      const reader = new FileReader();
      reader.onloadend = () => {
        const win = window.open('', '_blank');
        if (!win) return toast.error('Popup blocked');
        win.document.write(`
          <html><head><title>Receipt</title></head>
          <body style="margin:0">
            <iframe width="100%" height="100%" src="${reader.result}" frameborder="0"></iframe>
          </body></html>
        `);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      toast.error(err.message || 'Failed to print receipt');
    }
  };

  const exportExcel = () => {
    const grouped: any[] = [];

    const slipGroups = Array.from(new Set(transactions.map(t => t.slipId)));
    slipGroups.forEach(slipId => {
      const group = transactions.filter(t => t.slipId === slipId);
      const first = group[0];
      const student = first.student || students.find(s => s.id === first.studentId);
      if (!student) return;

      grouped.push({
        SlipID: slipId,
        Name: student.name,
        AdmissionNo: student.admissionNumber,
        Slabs: group.map(g => g.slab).join(', '),
        Amount: group.reduce((a, g) => a + g.amount, 0),
        Mode: first.mode,
        Date: new Date(first.paymentDate).toLocaleDateString(),
      });
    });

    const ws = XLSX.utils.json_to_sheet(grouped);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'TransactionReport.xlsx');
  };

  const exportPdf = async () => {
  const orgRes = await axios.get(API.TRANSPORT_ORG_PROFILE);
  const org = Array.isArray(orgRes.data) ? orgRes.data[0] : orgRes.data;

  const styles = StyleSheet.create({
    page: {
      padding: 30,
      fontSize: 11,
      fontFamily: 'Helvetica',
    },
    heading: {
      fontSize: 18,
      textAlign: 'center',
      fontWeight: 'bold',
      marginBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#333',
      paddingBottom: 6,
    },
    section: {
      marginBottom: 14,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    label: {
      fontWeight: 'bold',
      width: '35%',
    },
    value: {
      width: '65%',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f2f2f2',
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
      paddingVertical: 6,
      fontWeight: 'bold',
      fontSize: 11,
      textAlign: 'center',
    },
    tableHeaderCell: {
      width: '20%',
      textAlign: 'center',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      paddingVertical: 6,
    },
    tableCell: {
      width: '20%',
      textAlign: 'center',
      fontSize: 10,
    },
    summaryBox: {
      marginTop: 20,
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: '#999',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    summaryLabel: {
      fontWeight: 'bold',
      fontSize: 11,
    },
    summaryValue: {
      fontSize: 11,
    },
    footer: {
      marginTop: 40,
      alignItems: 'center',
      textAlign: 'center',
    },
  });

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Heading */}
        <Text style={styles.heading}>Transaction Report</Text>

        {/* Organization Info */}
        <View style={styles.section}>
          {[
            { label: 'School Name:', value: org?.name },
            { label: 'Address:', value: org?.address },
            { label: 'Phone:', value: org?.contact },
            { label: 'Email:', value: org?.email },
            { label: 'Website:', value: org?.website },
          ].map((item, index) => (
            <View style={styles.row} key={index}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.value || '—'}</Text>
            </View>
          ))}
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}>#</Text>
          <Text style={styles.tableHeaderCell}>Student</Text>
          <Text style={styles.tableHeaderCell}>Adm No</Text>
          <Text style={styles.tableHeaderCell}>Amount (INR)</Text>
          <Text style={styles.tableHeaderCell}>Mode</Text>
        </View>

        {/* Table Rows */}
        {Array.from(new Set(transactions.map(t => t.slipId))).map((sid, idx) => {
          const group = transactions.filter(t => t.slipId === sid);
          const first = group[0];
          const student = first.student || students.find(s => s.id === first.studentId);
          if (!student) return null;

          const totalAmt = group.reduce((a, t) => a + t.amount, 0);

          return (
            <View key={sid} style={styles.tableRow}>
              <Text style={styles.tableCell}>{idx + 1}</Text>
              <Text style={styles.tableCell}>{student.name}</Text>
              <Text style={styles.tableCell}>{student.admissionNumber}</Text>
              <Text style={styles.tableCell}>{totalAmt.toLocaleString()}</Text>
              <Text style={styles.tableCell}>{first.mode}</Text>
            </View>
          );
        })}

        {/* Summary Section */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Collection (INR):</Text>
            <Text style={styles.summaryValue}>{totalCollection.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cash Collection (INR):</Text>
            <Text style={styles.summaryValue}>{cashCollection.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Online Collection (INR):</Text>
            <Text style={styles.summaryValue}>{onlineCollection.toLocaleString()}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>___________________________</Text>
          <Text>Authorized Signature</Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  saveAs(blob, 'TransactionReport.pdf');
};


  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Transaction Report (By Date)</h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="block text-sm">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded" />
          </div>
          <button onClick={fetchFilteredTransactions} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            📅 Filter
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-100 border border-green-300 p-4 rounded-xl">
            <h4 className="text-lg font-semibold text-green-800">Total Collection</h4>
            <p className="text-2xl font-bold text-green-900">{totalCollection}</p>
          </div>
          <div className="bg-yellow-100 border border-yellow-300 p-4 rounded-xl">
            <h4 className="text-lg font-semibold text-yellow-800">Cash Collection</h4>
            <p className="text-2xl font-bold text-yellow-900">{cashCollection}</p>
          </div>
          <div className="bg-blue-100 border border-blue-300 p-4 rounded-xl">
            <h4 className="text-lg font-semibold text-blue-800">Online Collection</h4>
            <p className="text-2xl font-bold text-blue-900">{onlineCollection}</p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-4 mb-6">
          <button onClick={exportExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
            <FaFileExcel /> Export Excel
          </button>
          <button onClick={exportPdf} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2">
            <FaFilePdf /> Export PDF
          </button>
        </div>

        {/* Transactions Table */}
        {isLoading ? (
          <p>Loading...</p>
        ) : transactions.length ? (
          <table className="w-full border border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">#</th>
                <th className="border p-2">Student</th>
                <th className="border p-2">Admission No</th>
                <th className="border p-2">Slabs</th>
                <th className="border p-2">Amount</th>
                <th className="border p-2">Mode</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Slip ID</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(new Set(transactions.map(t => t.slipId))).map((sid, index) => {
                const group = transactions.filter(t => t.slipId === sid);
                const first = group[0];
                const student = first.student || students.find(s => s.id === first.studentId);
                if (!student) return null;

                const totalAmount = group.reduce((a, t) => a + (t.amount || 0), 0);
                const slabs = group.map(t => t.slab).join(', ');

                return (
                  <tr key={sid} className="hover:bg-gray-50">
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2">{student.name}</td>
                    <td className="border p-2">{student.admissionNumber}</td>
                    <td className="border p-2">{slabs}</td>
                    <td className="border p-2">{totalAmount}</td>
                    <td className="border p-2">{first.mode}</td>
                    <td className="border p-2">{new Date(first.paymentDate).toLocaleDateString()}</td>
                    <td className="border p-2 font-semibold text-blue-700">{sid}</td>
                    <td className="border p-2 text-center">
                      <button onClick={() => handlePrintReceipt(sid)} className="text-green-600 hover:text-green-800">
                        <FaPrint />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600">No transactions found for selected date range.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TransactionReportPage;
