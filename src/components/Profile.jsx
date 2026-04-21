import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { pdf } from '@react-pdf/renderer';
import UnifiedReport from './UnifiedReport';
import '../index.css';

function PasswordChangeForm() {
  const { reauthenticate, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    setError(''); setSuccess(''); setLoading(true);
    try {
      await reauthenticate(currentPassword);
      await changePassword(newPassword);
      setSuccess('Password updated successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError('Failed to update password. Check current password.');
    } finally { setLoading(false); }
  }

  const inputStyle = { width: '100%', padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', marginBottom: '1rem', outline: 'none' };

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', maxWidth: '450px', margin: '0 auto' }}>
      <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontSize: '1.1rem', textAlign: 'center' }}>🔐 SECURITY</h4>
      {error && <p style={{ color: '#EA4335', fontSize: '0.8rem', background: 'rgba(234,67,53,0.1)', padding: '0.8rem', borderRadius: '8px' }}>{error}</p>}
      {success && <p style={{ color: '#6fc96f', fontSize: '0.8rem', background: 'rgba(111,201,111,0.1)', padding: '0.8rem', borderRadius: '8px' }}>{success}</p>}
      <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required style={inputStyle} />
      <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={inputStyle} />
      <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={inputStyle} />
      <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>{loading ? '...' : 'Update Password'}</button>
    </form>
  );
}

export default function Profile() {
  const { userData, currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Use multiple listeners or a combined approach if possible. 
    // To avoid index issues, we'll listen to the main userId query which is the strongest link.
    const q = query(collection(db, 'bookings'), where('userId', '==', currentUser.uid));
    
    setLoadingBookings(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort by creation time
      fetchedBookings.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setBookings(fetchedBookings);
      setLoadingBookings(false);
    }, (error) => {
      console.error("Profile listen error:", error);
      setLoadingBookings(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const downloadPDF = async (data) => {
    try {
      // No Vedic API calls needed for simple receipt
      const vedicData = {};

      const blob = await pdf(<UnifiedReport data={data} vedicData={vedicData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Astro_Report_${data.name.replace(/\s+/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error('Download failed:', err); }
  };

  if (!currentUser) return <div style={{paddingTop:'150px', textAlign:'center', color:'white'}}>Login required.</div>;

  return (
    <div className="profile-container container" style={{ paddingTop: '120px', paddingBottom: '120px', maxWidth: '800px' }}>
      <div className="profile-header glass-panel" style={{ padding: '2.5rem', borderRadius: '32px', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--accent-gold)', padding: '3px' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-space)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', overflow:'hidden' }}>
              {currentUser.photoURL ? <img src={currentUser.photoURL} alt="P" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span>{userData?.avatar || '🕉️'}</span>}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'0.5rem' }}>
              <h2 style={{color:'white', fontSize:'1.8rem', margin:0}}>{userData?.name || currentUser.displayName || currentUser.email.split('@')[0]}</h2>
              <button onClick={logout} style={{ background:'rgba(234,67,53,0.1)', color:'#EA4335', border:'1px solid rgba(234,67,53,0.2)', padding:'4px 10px', borderRadius:'6px', fontSize:'0.75rem', cursor:'pointer' }}>Logout</button>
            </div>
            <p style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.9rem' }}>🔱 Divine Seeker</p>
          </div>
        </div>

        <div className="profile-tabs" style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
          <button className={`profile-tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>📋 Bookings</button>
          <button className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>⚙️ Settings</button>
        </div>
      </div>

      <div className="profile-content">
        {activeTab === 'bookings' && (
          <div className="glass-panel" style={{ padding: '1rem', borderRadius: '24px' }}>
            {loadingBookings ? <p style={{textAlign:'center', color:'var(--text-secondary)'}}>⏳ Records found...</p> : 
             bookings.length === 0 ? <div style={{textAlign:'center', padding:'3rem'}}><p>No bookings yet.</p><button className="btn-primary" onClick={()=>window._setView('home')}>View Services</button></div> :
             bookings.map(b => (
                <div key={b.id} className="booking-item" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{flex:1}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      <p style={{fontWeight:800, color:'white', fontSize: '1.1rem', margin:0}}>{b.category}</p>
                      <span style={{fontSize:'0.6rem', padding:'2px 10px', borderRadius:'12px', background:'rgba(212,175,55,0.1)', color: 'var(--accent-gold)', border: '1px solid rgba(212,175,55,0.2)', fontWeight: 800, textTransform: 'uppercase'}}>{b.status}</span>
                    </div>
                    <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', margin: 0}}>{b.confirmedDate || b.preferredDate} · {b.confirmedSlot || b.preferredSlot}</p>
                  </div>
                   <div style={{display:'flex', gap:'0.6rem', alignItems:'center'}}>
                     {b.status === 'completed' && !b.hasReview && <button className="btn-primary" onClick={()=>setShowReviewModal(b.id)} style={{fontSize:'0.75rem', padding: '8px 16px', borderRadius: '10px'}}>🌟 Rate</button>}
                     <button className="btn-secondary" onClick={() => downloadPDF(b)} style={{fontSize:'0.75rem', padding:'8px 16px', border:'1.5px solid var(--accent-gold)', color: 'var(--accent-gold)', borderRadius: '10px'}} title="Download Report">📥 Download</button>
                   </div>
                 </div>
             ))
            }
          </div>
        )}
        {activeTab === 'security' && <PasswordChangeForm />}
      </div>

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(null)}>
          <div className="modal-content glass-panel" onClick={e=>e.stopPropagation()} style={{maxWidth:'400px', padding:'2.5rem'}}>
            <h3 style={{color:'var(--accent-gold)', textAlign:'center', marginBottom:'1.5rem'}}>Share Feedback</h3>
            <div style={{display:'flex', justifyContent:'center', gap:'0.2rem', marginBottom:'1.5rem'}}>
              {[1,2,3,4,5].map(s=>(<button key={s} onClick={()=>setReviewData({...reviewData, rating:s})} style={{background:'none', border:'none', fontSize:'1.5rem', color:s<=reviewData.rating?'var(--accent-gold)':'rgba(255,255,255,0.1)'}}>★</button>))}
            </div>
            <textarea value={reviewData.comment} onChange={e=>setReviewData({...reviewData, comment:e.target.value})} style={{width:'100%', background:'rgba(255,255,255,0.05)', color:'white', border:'1px solid rgba(255,255,255,0.1)', padding:'10px', borderRadius:'10px', minHeight:'100px'}} />
            <button className="btn-primary" style={{width:'100%', marginTop:'1rem'}} onClick={async()=>{
              setSubmittingReview(true);
              try { await addDoc(collection(db,'reviews'), { bookingId:showReviewModal, userId:currentUser.uid, userName:userData?.name||'Seeker', rating:reviewData.rating, comment:reviewData.comment, createdAt:serverTimestamp() });
              await updateDoc(doc(db,'bookings',showReviewModal), { hasReview:true, reviewData }); setBookings(prev=>prev.map(x=>x.id===showReviewModal?{...x, hasReview:true, reviewData}:x)); setShowReviewModal(null);
              } catch(e){console.error(e)} finally{setSubmittingReview(false)}
            }}>{submittingReview?'...':'Submit'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
