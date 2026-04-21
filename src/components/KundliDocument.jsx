import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#fffaf0',
  },
  header: {
    padding: 20,
    border: '2pt solid #8B4513',
    backgroundColor: '#fff',
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#D4AF37',
    marginTop: 5,
  },
  card: {
    border: '1pt solid #D4AF37',
    padding: 15,
    marginBottom: 15,
  },
  chartContainer: {
    width: '100%',
    height: 300,
    border: '2pt solid #8B4513',
    position: 'relative',
    marginVertical: 20,
  },
  chartLine: {
    position: 'absolute',
    border: '0.5pt solid #8B4513',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    padding: 5,
  },
  label: {
    fontSize: 10,
    color: '#666',
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  om: {
    fontSize: 40,
    marginBottom: 10,
  }
});

const KundliDocument = ({ data, vedicData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.om}>🕉️</Text>
        <Text style={styles.title}>JANAM KUNDLI</Text>
        <Text style={styles.subtitle}>Shri Namo Narayanaya Astrology Services</Text>
      </View>

      <View style={styles.card}>
        <Text style={{ fontSize: 16, borderBottom: '1pt solid #eee', paddingBottom: 5, marginBottom: 10, color: '#8B4513', fontFamily: 'Helvetica-Bold' }}>
          Personal Details
        </Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{data.name}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Date of Birth</Text>
            <Text style={styles.value}>{data.dob}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Time of Birth</Text>
            <Text style={styles.value}>{data.time}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Place of Birth</Text>
            <Text style={styles.value}>{data.birthPlace}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Father's Name</Text>
            <Text style={styles.value}>{data.fatherName || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Vedic Attributes Section */}
      {vedicData && Object.keys(vedicData).length > 0 && (
        <View style={styles.card}>
          <Text style={{ fontSize: 16, borderBottom: '1pt solid #eee', paddingBottom: 5, marginBottom: 10, color: '#8B4513', fontFamily: 'Helvetica-Bold' }}>
            Vedic Attributes
          </Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Ascendant (Lagna)</Text>
              <Text style={styles.value}>{vedicData.ascendant}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Moon Sign (Rashi)</Text>
              <Text style={styles.value}>{vedicData.moon_sign}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Nakshatra</Text>
              <Text style={styles.value}>{vedicData.nakshatra}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Sun Sign</Text>
              <Text style={styles.value}>{vedicData.sun_sign}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 18, marginBottom: 10, color: '#8B4513' }}>Lagna Chart (Approximate)</Text>
        {/* Placeholder for Chart - In a real app, you'd draw SVGs here */}
        <View style={{ width: 250, height: 250, border: '1pt solid #8B4513', padding: 10 }}>
           <Text style={{ fontSize: 8, textAlign: 'center', marginTop: 100 }}>[ Divine Chart Data Processing... ]</Text>
           <Text style={{ fontSize: 7, textAlign: 'center', color: '#999', marginTop: 20 }}>Consult with RKJ Acharya for full manual analysis.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={{ fontSize: 14, color: '#8B4513', marginBottom: 5 }}>Divine Note:</Text>
        <Text style={{ fontSize: 10, lineHeight: 1.5 }}>
          This is an interactive preliminary report generated based on the birth details provided. 
          Vedic Astrology requires precise calculation of divisional charts (D-charts) for accurate predictions. 
          Please keep this report ready for your consultation with Acharya Ji.
        </Text>
      </View>

      <Text style={{ position: 'absolute', bottom: 20, right: 30, fontSize: 8, color: '#ccc' }}>
        Generated by Shri Namo Narayanaya Portal
      </Text>
    </Page>
  </Document>
);

export default KundliDocument;
