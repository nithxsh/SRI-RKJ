import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Svg, Path, Circle, G } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    padding: 25, 
    backgroundColor: '#fff', 
    fontFamily: 'Helvetica',
    border: '4pt solid #D4AF37',
  },
  innerBorder: {
    border: '0.5pt solid #D4AF37',
    padding: 20,
    height: '100%',
    position: 'relative'
  },
  headerContainer: { alignItems: 'center', marginBottom: 15 },
  mainTitle: { fontSize: 26, color: '#D4AF37', textAlign: 'center', fontWeight: 'bold', letterSpacing: 2 },
  subHeader: { fontSize: 11, color: '#546E7A', textAlign: 'center', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1.5 },
  contactLine: { fontSize: 8, color: '#90A4AE', textAlign: 'center', marginTop: 4 },
  thickGoldLine: { height: 1.5, backgroundColor: '#D4AF37', marginVertical: 12, width: '80%', alignSelf: 'center' },
  
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  receiptTitle: { fontSize: 20, color: '#006064', fontWeight: 'bold' },
  metaBlock: { alignItems: 'flex-end' },
  metaLabel: { fontSize: 9, color: '#006064', fontWeight: 'bold' },
  metaValue: { fontSize: 9, color: '#455A64' },

  table: { border: '1pt solid #006064', borderRadius: 4, overflow: 'hidden', marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottom: '1pt solid #006064', minHeight: 32, alignItems: 'center' },
  tableLabel: { 
    width: '35%', 
    paddingLeft: 12, 
    fontSize: 9, 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    backgroundColor: '#006064', 
    height: '100%', 
    justifyContent: 'center',
    paddingTop: 10
  },
  tableValue: { width: '65%', paddingLeft: 10, fontSize: 10, color: '#263238', fontWeight: 'bold' },
  
  paymentStatus: { marginTop: 12, paddingLeft: 5 },
  paymentText: { fontSize: 10, color: '#B71C1C', fontWeight: 'bold' },

  // ADDITIONS: QR AND STAMP
  bottomAssets: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 25,
    paddingHorizontal: 10
  },
  qrContainer: { alignItems: 'center' },
  qrImage: { width: 60, height: 60, border: '1pt solid #ECEFF1', pading: 2 },
  qrText: { fontSize: 7, color: '#546E7A', marginTop: 4, fontWeight: 'bold' },

  footer: { marginTop: 'auto', alignItems: 'center' },
  divider: { width: '100%', height: 1, backgroundColor: '#D4AF37', marginBottom: 8 },
  disclaimer: { fontSize: 7, color: '#90A4AE', textAlign: 'center', fontStyle: 'italic', marginBottom: 3 },
  branding: { fontSize: 9, color: '#D4AF37', fontWeight: 'bold' }
});

const RoyalLotus = () => (
  <Svg viewBox="0 0 100 100" style={{ width: 50, height: 50, marginBottom: 5 }}>
    <Path d="M50 5 C60 25 95 35 50 95 C5 35 40 25 50 5" fill="#D4AF37" />
    <Path d="M50 35 C75 45 85 65 50 95 C15 65 25 45 50 35" fill="#B8860B" />
  </Svg>
);

const DivineStamp = () => (
  <View style={{ width: 80, height: 80 }}>
    <Svg viewBox="0 0 100 100">
      <G>
        <Circle cx="50" cy="50" r="45" stroke="#D4AF37" strokeWidth="2" fill="none" />
        <Circle cx="50" cy="50" r="38" stroke="#D4AF37" strokeWidth="0.5" fill="none" strokeDasharray="2,2" />
        <Path d="M50 25 L55 38 L68 38 L58 48 L62 61 L50 52 L38 61 L42 48 L32 38 L45 38 Z" fill="#D4AF37" />
        {/* Curved Text Simulation */}
        <Text x="18" y="18" style={{ fontSize: 6, fill: '#D4AF37', fontWeight: 'bold' }}>AUTHENTIC</Text>
        <Text x="52" y="88" style={{ fontSize: 6, fill: '#D4AF37', fontWeight: 'bold' }}>CONSULTATION</Text>
      </G>
    </Svg>
  </View>
);

const UnifiedReport = ({ data }) => {
  const officePhone = import.meta.env.VITE_OFFICE_PHONE || '9751442007';
  const whatsappUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://wa.me/91${officePhone}?text=Namaste,%20I%20have%20a%20question%20about%20my%20booking%20ref:${data.id?.substring(0,8)}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.innerBorder}>
          <View style={styles.headerContainer}>
            <RoyalLotus />
            <Text style={styles.mainTitle}>Shri Namo Narayanaya</Text>
            <Text style={styles.subHeader}>Sri Astrologer RKJ THULASERAJA ACHARYA</Text>
            <Text style={styles.contactLine}>Vellore, Tamil Nadu, India | +91 {officePhone}</Text>
            <View style={styles.thickGoldLine} />
          </View>
          
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>OFFICIAL RECEIPT</Text>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Receipt No: <Text style={styles.metaValue}>{data.id?.substring(0,8).toUpperCase()}</Text></Text>
              <Text style={styles.metaLabel}>Date: <Text style={styles.metaValue}>{new Date().toLocaleDateString('en-GB')}</Text></Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableRow}><View style={styles.tableLabel}><Text>CLIENT NAME</Text></View><Text style={styles.tableValue}>{data.name}</Text></View>
            <View style={styles.tableRow}><View style={styles.tableLabel}><Text>SERVICE TYPE</Text></View><Text style={styles.tableValue}>{data.category}</Text></View>
            <View style={styles.tableRow}><View style={styles.tableLabel}><Text>BIRTH DETAILS</Text></View><Text style={styles.tableValue}>{data.dob} | {data.time} | {data.birthPlace}</Text></View>
            <View style={styles.tableRow}><View style={styles.tableLabel}><Text>APPOINTMENT</Text></View><Text style={styles.tableValue}>{data.preferredDate} ({data.preferredSlot})</Text></View>
            <View style={styles.tableRow}><View style={styles.tableLabel}><Text>CONTACT INFO</Text></View><Text style={styles.tableValue}>{data.mobile} | {data.email}</Text></View>
          </View>

          <View style={styles.paymentStatus}>
            <Text style={styles.paymentText}>PAYMENT NOT DONE BY ONLINE (Ref: {data.transactionId || 'Awaiting'})</Text>
          </View>

          <View style={styles.bottomAssets}>
            <View style={{ ...styles.qrContainer, marginHorizontal: 'auto' }}>
              <Image style={styles.qrImage} src={whatsappUrl} />
              <Text style={styles.qrText}>SCAN FOR WHATSAPP HELP</Text>
            </View>
          </View>

          <View style={{ marginTop: 25 }}>
            <Text style={{ fontSize: 9, color: '#455A64', textAlign: 'center', lineHeight: 1.5 }}>
              May the divine blessings of Lord Narayana be with you.{"\n"}
              Please present this official receipt during your consultation session.
            </Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.divider} />
            <Text style={styles.disclaimer}>*(Computer Generated Official Booking Receipt)</Text>
            <Text style={styles.branding}>Built by Incognito Builders</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default UnifiedReport;
