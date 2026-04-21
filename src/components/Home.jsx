import React, { useEffect, useRef, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import ReviewsSection from './ReviewsSection';
import { pdf } from '@react-pdf/renderer';
import UnifiedReport from './UnifiedReport';
import '../index.css';

export default function Home() {
  const observerRef = useRef(null);
  const { currentUser } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState('category');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [bookingData, setBookingData] = useState({ 
    category: '',
    purpose: '',
    otherPurpose: '',
    name: '',
    fatherName: '',
    dob: '',
    time: '',
    birthPlace: '',
    mobile: '',
    email: '',
    preferredDate: '',
    preferredSlot: ''
  });

  // ── UPI Payment Config ──────────────────────────────────────────────
  const PAYMENT_CONFIG = {
    vpa: import.meta.env.VITE_UPI_VPA, // Primary UPI ID
    name: 'Shri Namo Narayanaya',
    fees: {
      'Vaasthu Planning': 1001,
      'Marriage Matching': 501,
      'Divine Materials': 1501,
      'Birth Time Remedies': 501,
      'Business & Career': 751,
      'Building Corrections': 1001,
      'Other': 501,
      'default': 501
    }
  };

  const getDueAmount = () => PAYMENT_CONFIG.fees[bookingData.purpose] || PAYMENT_CONFIG.fees['default'];

  const getUpiUrl = () => {
    const amount = getDueAmount();
    return `upi://pay?pa=${PAYMENT_CONFIG.vpa}&pn=${encodeURIComponent(PAYMENT_CONFIG.name)}&am=${amount}&tn=${encodeURIComponent(bookingData.purpose + ' Consultation')}&cu=INR`;
  };

  const handleCategorySelect = (cat) => {
    setBookingData(prev => ({
      ...prev,
      category: cat,
      // Pre-fill name & email from Google account
      name: prev.name || currentUser?.displayName || '',
      email: prev.email || currentUser?.email || ''
    }));
    setBookingStep('form');
  };

  const openBookingModal = () => {
    if (!currentUser) {
      setShowLoginPrompt(true);
    } else {
      setShowBookingModal(true);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        userId: currentUser?.uid || 'guest',
        userEmail: currentUser?.email || bookingData.email,
        status: 'pending',
        paymentStatus: 'unpaid',
        amount: getDueAmount(),
        createdAt: serverTimestamp()
      });
      setBookingData(prev => ({ ...prev, id: docRef.id })); // Keep ID for payment update
      
      // Automatic Download for Guest/Preliminary Booking
      if (bookingData.purpose) {
        downloadBookingDocuments({ ...bookingData, id: docRef.id });
      }

      setBookingStep('success');
    } catch (err) {
      console.error('Booking save failed:', err);
      setBookingStep('success');
    } finally {
      setSubmitLoading(false);
    }
  };

  const downloadBookingDocuments = async (data) => {
    try {
      // 1. Fetch Real Astrological Data (Trial/Free API)
      // No Vedic API calls needed for simple receipt
      const vedicData = {};

      // 2. Generate Unified Report (Receipt + Kundli)
      const blob = await pdf(<UnifiedReport data={data} vedicData={vedicData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Astro_Report_${data.name.replace(/\s+/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF Download failed:', err);
    }
  };

  // Expose openBookingModal globally
  useEffect(() => { window._openBookingModal = openBookingModal; }, [currentUser]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    });

    const hiddenElements = document.querySelectorAll('.slide-hidden');
    hiddenElements.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        hiddenElements.forEach((el) => observerRef.current.unobserve(el));
      }
    };
  }, []);

  const leftServices = [
    { 
      title: "1. Vaasthu Planning", 
      desc: "(New House Plans/Designs)", 
      icon: <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
    },
    { 
      title: "2. Marriage Matching", 
      desc: "(Compatibility & Timing)", 
      icon: <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="12" r="6"></circle><circle cx="16" cy="12" r="6"></circle></svg>
    },
    { 
      title: "3. Divine Materials", 
      desc: "(Yantras, Stones, Rings)", 
      icon: <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 22 22 7 12 2"></polygon><polyline points="2 7 12 7 22 7"></polyline><polyline points="12 22 12 7"></polyline></svg>
    }
  ];

  const rightServices = [
    { 
      title: "4. Birth Time Remedies", 
      desc: "(Life Result & Education)", 
      icon: <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
    },
    { 
      title: "5. Business & Career", 
      desc: "(Job & Growth Analysis)", 
      icon: <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
    },
    { 
      title: "6. Building Corrections", 
      desc: "(Vaasthu for Old Buildings)", 
      icon: <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
    }
  ];

  const strategicPartners = [
    { name: 'Sri Sakthi Builders', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="30" height="30"><path d="M3 21h18"></path><path d="M9 8h1"></path><path d="M9 12h1"></path><path d="M9 16h1"></path><path d="M14 8h1"></path><path d="M14 12h1"></path><path d="M14 16h1"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path></svg> },
    { name: 'Sri Panjamugi Finance', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="30" height="30"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg> },
    { name: 'Mr. N. KUMAR Advocate', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="30" height="30"><path d="M12 3v18"></path><path d="M3 21h18"></path><path d="M12 7H5c-1 0-2 1-2 2s1 2 2 2h7"></path><path d="M12 7h7c1 0 2 1 2 2s-1 2-2 2h-7"></path><rect x="4" y="11" width="2" height="6" rx="1"></rect><rect x="18" y="11" width="2" height="6" rx="1"></rect></svg> },
    { name: 'Sri Viswabramma Garments', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="30" height="30"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path></svg> },
    { name: 'Vedic Cosmos Solutions', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="30" height="30"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><circle cx="12" cy="12" r="3"></circle></svg> },
  ];

  return (
    <div className="home-container">
      {/* Hero Section Split Layout */}
      <section className="hero-section">
        <video autoPlay loop muted playsInline className="hero-video">
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        
        <div className="container hero-inner split-layout">
          <div className="hero-photo-col slide-hidden slide-left">
            <div className="hero-profile-pic"></div>
          </div>
          <div className="hero-content slide-hidden slide-right" style={{textAlign: 'left'}}>
            <h1 style={{ fontSize: '3.5rem' }}>OM NAMO NARAYANA</h1>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--accent-gold)', marginBottom: '1.5rem', fontWeight: 500 }}>Vaasthu, Astrology, Numerology Office</h2>
            <div style={{ 
              marginBottom: '2rem', 
              background: 'rgba(10, 25, 47, 0.7)', 
              padding: '2rem', 
              borderRadius: '16px', 
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderLeft: '5px solid var(--accent-gold)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4), 0 0 15px rgba(212, 175, 55, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Subtle decorative element */}
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)' }}></div>
              
              <p style={{ 
                fontSize: '1.4rem', 
                color: 'var(--accent-gold)', 
                marginBottom: '0.8rem', 
                fontWeight: 700, 
                fontFamily: 'var(--font-heading)',
                letterSpacing: '1px',
                lineHeight: '1.2'
              }}>
                Shri Astrologer RKJ THULASERAJA ACHARYA
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '20px', height: '1px', background: 'var(--accent-teal)', opacity: 0.6 }}></div>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--text-secondary)', 
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}>
                  (B.A., DA., DCA., NT., GT....)
                </p>
              </div>
            </div>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              Guided by spiritual truth and years of traditional Vedic practice. Providing profound solutions for your career, health, relationships, and property.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section container" style={{ overflow: 'hidden' }}>
        <h2 className="section-title">Services Offered</h2>
        
        <div className="services-split-grid">
          {/* Left Side */}
          <div className="services-col">
            {leftServices.map((service, idx) => (
              <div key={idx} className="service-card glass-panel slide-hidden slide-left" style={{ textAlign: 'left', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ flexShrink: 0, opacity: 0.9, filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.4))' }}>
                  {service.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{service.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{service.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side */}
          <div className="services-col">
            {rightServices.map((service, idx) => (
              <div key={idx} className="service-card glass-panel slide-hidden slide-right" style={{ textAlign: 'left', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.5rem', transitionDelay: `${idx * 0.15}s` }}>
                <div style={{ flexShrink: 0, opacity: 0.9, filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.4))' }}>
                  {service.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{service.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container" style={{ marginBottom: '6rem', position: 'relative', zIndex: 1 }}>
        <h2 className="section-title">Office & Location</h2>
        
        <div className="office-grid">
          {/* Left: Map View */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.3rem', filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.4))' }}>Find Us on the Map</h4>
            <div style={{ flexGrow: 1, borderRadius: '8px', overflow: 'hidden', minHeight: '350px' }}>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15560.852721832047!2d78.718814!3d12.829141!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bad9b36ed6bd1ef%3A0xe96df16e25fc6638!2sMailpatti%2C%20Tamil%20Nadu%20635805!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade">
              </iframe>
            </div>
          </div>

          {/* Right: Details */}
          <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ color: 'var(--accent-gold)', marginBottom: '2rem', fontSize: '1.4rem', filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.4))' }}>Office Information</h4>
              
              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.2rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.2))' }}>📍</span>
                <div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.3rem' }}>Location:</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '0.5rem' }}>Mailpatti (Pincode: 635805),<br/>Near Gudiyattam, Vellore District, Tamil Nadu</p>
                  <a href="https://share.google/yzXWYBu6ai10y897L" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-teal)', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'underline' }}>View on Google Maps ↗</a>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.2rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.2))' }}>📞</span>
                <div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.3rem' }}>Contact:</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{import.meta.env.VITE_OFFICE_PHONE || '9751442007'} | {import.meta.env.VITE_OFFICE_PHONE_ALT || '9865546763'}</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.2rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.2))' }}>🕒</span>
                <div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.3rem' }}>Hours of Operation:</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>Mon-Sat: 9:30 AM – 9:40 PM <span style={{fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)'}}><br/>(Closing at 8:40 PM on Mondays)</span><br/>Sunday: Closed</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.2))' }}>🌐</span>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: 0 }}>Social & Contact:</p>
                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', marginLeft: '0.5rem' }}>
                  <a href={`https://wa.me/91${import.meta.env.VITE_OFFICE_PHONE || '9751442007'}?text=Om%20Namo%20Narayana%2C%20I%20want%20to%20book%20a%20consultation.`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-gold)', opacity: 0.8 }} className="social-icon-btn" title="Chat on WhatsApp">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                  </a>
                  <a href="https://www.facebook.com/profile.php?id=100008900615251" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-gold)', opacity: 0.8 }} className="social-icon-btn" title="Facebook Page">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </a>
                  <a href="mailto:nithishog31@gmail.com?subject=Consultation%20Inquiry" style={{ color: 'var(--accent-gold)', opacity: 0.8 }} className="social-icon-btn" title="Send Email">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '3.5rem', width: '100%', textAlign: 'center' }}>
              <button className="btn-primary" onClick={openBookingModal} style={{ width: '100%', padding: '1.2rem', fontSize: '1.2rem', borderRadius: '30px', boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' }}>
                Book Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Partners Trust Bar */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)', fontSize: '2rem', textAlign: 'center', marginBottom: '3rem', letterSpacing: '3px' }}>OUR STRATEGIC PARTNERS</h2>
        
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '2.5rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="marquee-container" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
            <div className="marquee-content" style={{ animationDuration: '40s' }}>
              {[...strategicPartners, ...strategicPartners].map((partner, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 'max-content', padding: '0 3rem' }}>
                  <div style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                    {partner.icon}
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500, opacity: 0.8 }}>{partner.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => { setShowBookingModal(false); setBookingStep('category'); }}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px', textAlign: 'left', padding: '3.5rem 3rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="close-btn" onClick={() => { setShowBookingModal(false); setBookingStep('category'); }} style={{ top: '25px', right: '25px' }}>✕</button>
            
            {bookingStep === 'category' && (
              <>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>Schedule Session</h2>
                <p className="text-secondary" style={{ marginBottom: '2rem' }}>How would you like to connect with Shri Astrologer RKJ THULASERAJA ACHARYA?</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <button className="btn-primary" style={{ padding: '1.2rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => handleCategorySelect('Online Consultation')}>
                    <span>🌐 Online Consultation</span>
                    <span style={{opacity: 0.5}}>→</span>
                  </button>
                  <button className="btn-primary" style={{ padding: '1.2rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }} onClick={() => handleCategorySelect('Offline Consultation')}>
                    <span>🏠 Offline Consultation</span>
                    <span style={{opacity: 0.5}}>→</span>
                  </button>
                </div>
              </>
            )}

            {bookingStep === 'form' && (
              <>
                <button onClick={() => setBookingStep('category')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}>
                   <span style={{ fontSize: '1.2rem' }}>←</span> Back
                </button>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>Enter Details</h2>
                <p className="text-secondary" style={{ marginBottom: '2rem' }}>{bookingData.category} Request</p>
                
                <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={bookingData.name}
                      onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                      style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} 
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Father's Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={bookingData.fatherName}
                      onChange={(e) => setBookingData({ ...bookingData, fatherName: e.target.value })}
                      style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} 
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Date of Birth *</label>
                      <input 
                        type="date" 
                        required 
                        value={bookingData.dob}
                        onChange={(e) => setBookingData({ ...bookingData, dob: e.target.value })}
                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} 
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Exact Time *</label>
                      <input 
                        type="time" 
                        required 
                        value={bookingData.time}
                        onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Birth Place *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="City/Town, State" 
                      value={bookingData.birthPlace}
                      onChange={(e) => setBookingData({ ...bookingData, birthPlace: e.target.value })}
                      style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Purpose of Consultation *</label>
                    <select 
                      required 
                      value={bookingData.purpose}
                      onChange={(e) => setBookingData({ ...bookingData, purpose: e.target.value })}
                      style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer' }}
                    >
                      <option value="" disabled style={{ background: '#0A192F' }}>Select a purpose</option>
                      <option value="Vaasthu Planning" style={{ background: '#0A192F' }}>Vaasthu Planning (New House Plans/Designs)</option>
                      <option value="Marriage Matching" style={{ background: '#0A192F' }}>Marriage Matching (Compatibility & Timing)</option>
                      <option value="Divine Materials" style={{ background: '#0A192F' }}>Divine Materials (Yantras, Stones, Rings)</option>
                      <option value="Birth Time Remedies" style={{ background: '#0A192F' }}>Birth Time Remedies (Life Result & Education)</option>
                      <option value="Business & Career" style={{ background: '#0A192F' }}>Business & Career (Job & Growth Analysis)</option>
                      <option value="Building Corrections" style={{ background: '#0A192F' }}>Building Corrections (Vaasthu for Old Buildings)</option>
                      <option value="Other" style={{ background: '#0A192F' }}>Other (Please specify below)</option>
                    </select>
                  </div>

                  {bookingData.purpose === 'Other' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Tell us more about your query</label>
                      <textarea 
                        placeholder="Write your details here..."
                        value={bookingData.otherPurpose}
                        onChange={(e) => setBookingData({ ...bookingData, otherPurpose: e.target.value })}
                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', minHeight: '100px', resize: 'vertical' }}
                      ></textarea>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Mobile Number *</label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="+91" 
                        value={bookingData.mobile}
                        onChange={(e) => setBookingData({ ...bookingData, mobile: e.target.value })}
                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} 
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Gmail *</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="example@gmail.com" 
                        value={bookingData.email}
                        onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }} 
                      />
                    </div>
                  </div>

                  {/* Preferred Date & Time Slot */}
                  <div style={{ padding: '1rem', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.04)', marginTop: '0.5rem' }}>
                    <p style={{ color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>📅 Preferred Appointment</p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Preferred Date *</label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={bookingData.preferredDate}
                          onChange={(e) => setBookingData({ ...bookingData, preferredDate: e.target.value })}
                          style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Preferred Slot *</label>
                        <select
                          required
                          value={bookingData.preferredSlot}
                          onChange={(e) => setBookingData({ ...bookingData, preferredSlot: e.target.value })}
                          style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer' }}
                        >
                          <option value="" disabled style={{ background: '#0A192F' }}>Select slot</option>
                          <option value="Morning (9 AM - 12 PM)" style={{ background: '#0A192F' }}>🌅 Morning (9 AM - 12 PM)</option>
                          <option value="Afternoon (12 PM - 4 PM)" style={{ background: '#0A192F' }}>☀️ Afternoon (12 PM - 4 PM)</option>
                          <option value="Evening (4 PM - 8 PM)" style={{ background: '#0A192F' }}>🌆 Evening (4 PM - 8 PM)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={submitLoading} className="btn-primary" style={{ marginTop: '1rem', padding: '1.2rem', fontSize: '1.1rem', borderRadius: '8px' }}>
                    {submitLoading ? '⏳ Submitting...' : 'Confirm Booking Request'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    (Note: payment still not confirmed)
                  </p>
                </form>
              </>
            )}

            {bookingStep === 'payment' && (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>Secure Payment</h2>
                <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>Finalize your booking with a direct UPI payment of <strong style={{ color: 'white' }}>₹{getDueAmount()}</strong></p>
                
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '15px', display: 'inline-block', marginBottom: '1.5rem', boxShadow: '0 0 20px rgba(212,175,55,0.2)' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getUpiUrl())}`} 
                    alt="UPI QR Code"
                    style={{ display: 'block', width: '200px', height: '200px' }}
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Scan the QR or click below to pay:</p>
                  <a href={getUpiUrl()} className="btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1rem', borderRadius: '10px', display: 'inline-block', textDecoration: 'none', background: '#20B2AA' }}>
                    📱 Pay via UPI App
                  </a>
                </div>

                <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <label style={{ color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.8rem', textTransform: 'uppercase' }}>Confirm Your Payment</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>Once paid, enter your Transaction ID (UTR) or mobile number used for payment:</p>
                  <input 
                    type="text"
                    placeholder="Enter Transaction ID / Reference"
                    value={bookingData.transactionId || ''}
                    onChange={(e) => setBookingData({ ...bookingData, transactionId: e.target.value })}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', marginBottom: '1rem' }}
                  />
                  <button 
                    className="btn-primary" 
                    onClick={async () => {
                      if (!bookingData.transactionId) { alert('Please enter transaction ID'); return; }
                      setSubmitLoading(true);
                      try {
                        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
                        // Prepare refined booking data for sync with profile
                        const finalData = {
                          ...bookingData,
                          id: bookingData.id,
                          email: bookingData.email,
                          userEmail: currentUser?.email || bookingData.email,
                          userId: currentUser?.uid || '',
                          createdAt: serverTimestamp(),
                          status: 'pending',
                          paymentStatus: 'waiting_verification',
                          hasReview: false
                        };
                        
                        await setDoc(doc(db, 'bookings', bookingData.id), finalData);
                        
                        // Re-download updated documents with transaction ID
                        downloadBookingDocuments(finalData);
                        
                        setBookingStep('success');
                      } catch(err) { console.error(err); setBookingStep('success'); }
                      finally { setSubmitLoading(false); }
                    }}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px' }}
                  >
                    Confirm & Complete Booking
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    (Note: payment still not confirmed - pending admin verification)
                  </p>
                </div>
              </div>
            )}

            {bookingStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ 
                  fontSize: '5rem', 
                  marginBottom: '1rem', 
                  animation: 'namoReveal 1s ease-out',
                  filter: 'drop-shadow(0 0 20px var(--accent-gold))'
                }}>🔱</div>
                <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-gold)', marginBottom: '0.8rem', fontFamily: 'var(--font-heading)' }}>Request Received</h2>
                <p className="text-primary" style={{ marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '1.1rem' }}>
                   Om Namo Narayana! <br/>
                   Your details for <strong style={{ color: 'var(--accent-gold)' }}>{bookingData.category}</strong> have been securely transmitted to our Divine records.
                </p>
                
                <div style={{ 
                   background: 'rgba(32,178,170,0.08)', 
                   padding: '1.5rem', 
                   borderRadius: '16px', 
                   marginBottom: '2.5rem', 
                   border: '1px solid rgba(32,178,170,0.25)',
                   textAlign: 'left'
                }}>
                  <p style={{ color: 'var(--accent-teal)', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>🛡️ Next Steps</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>
                    1. Our office will verify your request shortly.<br/>
                    2. You will receive a <strong>WhatsApp</strong> and <strong>Push Notification</strong> once the slot is confirmed.<br/>
                    3. Track your request and see divine advice in your new <strong>Profile</strong>.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                  <button className="btn-primary" onClick={() => { setShowBookingModal(false); setTimeout(() => window._setView('profile'), 300); }} style={{ padding: '1.2rem', borderRadius: '15px', fontWeight: 800 }}>
                    🕉️ Go to My Profile
                  </button>
                  <button className="btn-secondary" onClick={() => { setShowBookingModal(false); setTimeout(() => setBookingStep('category'), 500); }} style={{ padding: '0.8rem', borderRadius: '15px', border: 'none', background: 'transparent', opacity: 0.6, fontSize: '0.9rem' }}>
                    Return to home
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Reviews Section */}
      <ReviewsSection />

      {/* Login Required Prompt Modal */}
      {showLoginPrompt && (
        <div className="modal-overlay" onClick={() => setShowLoginPrompt(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '3rem 2.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
            <h2 style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-heading)', fontSize: '1.7rem', marginBottom: '0.8rem' }}>Login Required</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
              Please sign in with your Google account to book a consultation. This helps us send you updates and confirmation messages.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <button
                onClick={() => { setShowLoginPrompt(false); window._setView?.('login'); }}
                className="btn-primary"
                style={{ padding: '1rem', borderRadius: '10px', fontSize: '1rem' }}
              >
                🔑 Login / Sign Up
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                style={{ padding: '0.8rem', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
