import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font, Image } from '@react-pdf/renderer';

// Register a standard font if needed, or use defaults
// For a Vedic look, we'll use serif-like settings

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#fff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #D4AF37',
    paddingBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#D4AF37',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
    borderBottom: '1pt solid #eee',
    paddingBottom: 5,
  },
  label: {
    width: 150,
    fontSize: 10,
    color: '#333',
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: '#000',
  },
  footer: {
    marginTop: 30,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderTop: '1pt solid #D4AF37',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: '#999',
    marginBottom: 3,
  },
  statusBadge: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FFF8E1',
    border: '1pt solid #FFE082',
    borderRadius: 5,
  },
  statusText: {
    fontSize: 10,
    color: '#F57C00',
    textAlign: 'center',
    fontWeight: 'bold',
  }
});

const ReceiptDocument = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Shri Namo Narayanaya</Text>
        <Text style={styles.subtitle}>Sri Astrologer RKJ THULASERAJA ACHARYA</Text>
        <Text style={{ fontSize: 8, color: '#999' }}>Mailpatti, Vellore, Tamil Nadu | +91 9751442007</Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1B4D3E', marginBottom: 10 }}>Booking Confirmation Receipt</Text>
        <Text style={{ fontSize: 10, color: '#666' }}>Receipt No: {data.id?.substring(0, 8).toUpperCase()}</Text>
        <Text style={{ fontSize: 10, color: '#666' }}>Date: {new Date().toLocaleDateString()}</Text>
      </View>

      <View style={{ border: '1pt solid #eee', borderRadius: 5, padding: 10 }}>
        <View style={styles.row}>
          <Text style={styles.label}>Patient/Client Name:</Text>
          <Text style={styles.value}>{data.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Consultation Purpose:</Text>
          <Text style={styles.value}>{data.purpose}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{data.category}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Father's Name:</Text>
          <Text style={styles.value}>{data.fatherName || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Birth Details:</Text>
          <Text style={styles.value}>{data.dob} | {data.time} | {data.birthPlace}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Preferred Appointment:</Text>
          <Text style={styles.value}>{data.preferredDate} ({data.preferredSlot})</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Contact:</Text>
          <Text style={styles.value}>{data.mobile} | {data.email}</Text>
        </View>
      </View>

      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>PENDING VERIFICATION</Text>
        <Text style={{ fontSize: 8, color: '#F57C00', textAlign: 'center', marginTop: 5 }}>
          (Payment successfully submitted. Waiting for admin verification.)
        </Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>Amount Due: ₹{data.amount || '0'}</Text>
        <Text style={{ fontSize: 9, color: '#666' }}>Transaction Ref: {data.transactionId || 'Awaiting'}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Thank you for choosing Shri Namo Narayanaya Services.</Text>
        <Text style={styles.footerText}>Please bring this receipt for your offline consultation.</Text>
        <Text style={styles.footerText}>Om Namo Narayana!</Text>
      </View>
    </Page>
  </Document>
);

export default ReceiptDocument;
