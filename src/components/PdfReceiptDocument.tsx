import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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

const PdfReceiptDocument = ({ school, student, transactions }: any) => {
  const firstTxn = transactions[0] || {};
  const filteredTransactions = transactions.filter(
    (t: any) => t.slipId === firstTxn?.slipId
  );

  const totalAmount = filteredTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const totalConcession = filteredTransactions.reduce((sum: number, t: any) => sum + (t.concession || 0), 0);
  const netBalance = totalAmount - totalConcession;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>
          {school?.name || 'School Name'} - Transport Fee Receipt
        </Text>

        {/* School Info */}
        <View style={styles.section}>
          {[
            { label: 'Address:', value: school?.address },
            { label: 'Phone:', value: school?.contact },
            { label: 'Email:', value: school?.email },
            { label: 'Website:', value: school?.website },
          ].map((item, index) => (
            <View style={styles.row} key={index}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.value || '—'}</Text>
            </View>
          ))}
        </View>

        {/* Receipt Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Receipt Date:</Text>
            <Text style={styles.value}>
              {firstTxn?.paymentDate ? new Date(firstTxn.paymentDate).toLocaleDateString() : '—'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Receipt ID:</Text>
            <Text style={styles.value}>{firstTxn?.slipId || '—'}</Text>
          </View>
        </View>

        {/* Student Info */}
        <View style={styles.section}>
          {[
            { label: 'Student Name:', value: student?.name },
            { label: 'Admission No:', value: student?.admissionNumber },
            { label: 'Class:', value: student?.class?.name },
            {
              label: 'Address:',
              value: `${student?.addressLine || ''}, ${student?.cityOrVillage || ''}`,
            },
          ].map((item, index) => (
            <View style={styles.row} key={index}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.value || '—'}</Text>
            </View>
          ))}
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}>Slab</Text>
          <Text style={styles.tableHeaderCell}>Amount (INR)</Text>
          <Text style={styles.tableHeaderCell}>Concession (INR)</Text>
          <Text style={styles.tableHeaderCell}>Net Paid (INR)</Text>
          <Text style={styles.tableHeaderCell}>Mode</Text>
        </View>

        {/* Table Rows */}
        {filteredTransactions.map((t: any, i: number) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.tableCell}>{t.slab || '—'}</Text>
            <Text style={styles.tableCell}>
              {t.amount?.toLocaleString() || '0'}
             
            </Text>
            <Text style={styles.tableCell}>
              {t.concession?.toLocaleString() || '0'}
             
            </Text>
            <Text style={styles.tableCell}>
              {(t.amount - (t.concession || 0))?.toLocaleString()}
             
            </Text>
            <Text style={styles.tableCell}>{t.mode || '—'}</Text>
          </View>
        ))}

        {/* Summary Section */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Paid (INR):</Text>
            <Text style={styles.summaryLabel}>{totalAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Concession (INR):</Text>
            <Text style={styles.summaryLabel}>{totalConcession.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net Balance (INR):</Text>
            <Text style={styles.summaryLabel}>{netBalance.toLocaleString()}</Text>
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
};

export default PdfReceiptDocument;
