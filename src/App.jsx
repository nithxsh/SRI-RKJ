import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import AiChatBot from './components/AiChatBot';
import StarsBackground from './components/StarsBackground';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { messaging, db } from './firebase';
import { getToken } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import './index.css';

const ADMIN_EMAIL = 'nithishog31@gmail.com';

// Route guard: redirects unauthenticated users away from protected pages
function ProtectedRoute({ children, setView }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    // Redirect back to login without crashing
    React.useEffect(() => { setView('login'); }, []);
    return null;
  }
  return children;
}
function AppInner() {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [isLoading, setIsLoading] = useState(true);

  // Expose setView globally
  React.useEffect(() => { window._setView = setCurrentView; }, [setCurrentView]);

  // Notification Permission & Token Handling
  React.useEffect(() => {
    if (!currentUser) return;

    async function setupNotifications() {
      try {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Get FCM Token
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
          });

          if (token) {
            // Store token in Firestore for Admin to use
            await setDoc(doc(db, 'users', currentUser.uid), {
              fcmToken: token,
              email: currentUser.email,
              lastTokenUpdate: serverTimestamp()
            }, { merge: true });
            console.log('🔔 Push notifications active.');
          }
        }
      } catch (err) {
        console.warn('Notification setup failed:', err.message);
      }
    }

    setupNotifications();
  }, [currentUser]);

  // Appointment Reminder System
  React.useEffect(() => {
    if (!currentUser) return;

    async function checkReminders() {
      try {
        const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
        const q = query(
          collection(db, 'bookings'), 
          where('userId', '==', currentUser.uid),
          where('status', '==', 'confirmed'),
          limit(10)
        );
        const snap = await getDocs(q);
        const now = new Date();

        snap.docs.forEach(d => {
          const b = d.data();
          if (!b.confirmedDate) return;

          // Simple time parsing for "confirmedDate" (YYYY-MM-DD) and "confirmedSlot"
          // Slots are usually: "Morning (9 AM - 12 PM)", "Afternoon (12 PM - 4 PM)", "Evening (4 PM - 8 PM)"
          // We'll use the start hour for the reminder
          let startHour = 9;
          if (b.confirmedSlot.includes('Afternoon')) startHour = 12;
          if (b.confirmedSlot.includes('Evening')) startHour = 16;

          const aptTime = new Date(b.confirmedDate);
          aptTime.setHours(startHour, 0, 0, 0);

          const diffMins = (aptTime - now) / (1000 * 60);

          // If within 15-20 minutes and not notified yet
          if (diffMins > 0 && diffMins <= 16) {
             const key = `reminder_${d.id}_${b.confirmedDate}`;
             if (!localStorage.getItem(key)) {
                new Notification("🕉️ Consultation Reminder", {
                   body: `Namaste! Your appointment for ${b.category} starts in about 15 minutes.`,
                   icon: '/icon-192.png'
                });
                localStorage.setItem(key, 'sent');
                console.log("🔔 Reminder triggered for:", d.id);
             }
          }
        });
      } catch (err) {
        console.warn('Reminder check failed:', err);
      }
    }

    const timer = setInterval(checkReminders, 60000); // Check once a minute
    checkReminders(); // Initial check
    return () => clearInterval(timer);
  }, [currentUser]);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999,
        animation: 'namoFadeOut 0.6s ease 2.6s both'
      }}>
        <style>{`
          @keyframes namoReveal {
            0%   { opacity: 0; transform: scaleX(1.4) scaleY(0.9); filter: blur(6px) brightness(3); }
            30%  { opacity: 1; filter: blur(0px) brightness(1.8); }
            60%  { transform: scaleX(1) scaleY(1); filter: blur(0px) brightness(1.2); }
            100% { transform: scaleX(1) scaleY(1); filter: blur(0px) brightness(1); }
          }
          @keyframes namoGlow {
            0%   { text-shadow: 0 0 80px #D4AF37, 0 0 160px #D4AF37, 0 0 300px #b8952e; }
            40%  { text-shadow: 0 0 40px #D4AF37, 0 0 80px rgba(212,175,55,0.6); }
            100% { text-shadow: 0 0 20px rgba(212,175,55,0.3); }
          }
          @keyframes namoFadeOut {
            from { opacity: 1; }
            to   { opacity: 0; pointer-events: none; }
          }
          @keyframes namoLine {
            0%   { width: 0%; opacity: 0; }
            30%  { opacity: 1; }
            100% { width: 100%; opacity: 0.4; }
          }
        `}</style>

        <div style={{ textAlign: 'center', userSelect: 'none' }}>
          {/* Netflix-style NAMO letters */}
          <div style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 'clamp(5rem, 18vw, 13rem)',
            fontWeight: 900,
            letterSpacing: '-4px',
            color: '#D4AF37',
            lineHeight: 1,
            animation: 'namoReveal 1.8s cubic-bezier(0.23,1,0.32,1) 0.2s both, namoGlow 1.8s ease 0.2s both',
          }}>
            NAMO
          </div>

          {/* Sweep line */}
          <div style={{ position: 'relative', height: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(to right, transparent, #D4AF37, #20B2AA, transparent)',
              animation: 'namoLine 1.6s ease 0.5s both',
              borderRadius: '2px'
            }} />
          </div>

          {/* Subtitle */}
          <p style={{
            marginTop: '1.2rem',
            color: 'rgba(212,175,55,0.6)',
            letterSpacing: '8px',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            fontFamily: '"Inter", sans-serif',
            fontWeight: 300,
            animation: 'namoReveal 1.2s ease 1.0s both'
          }}>
            Narayanaya
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <StarsBackground />
      <Navbar setView={setCurrentView} currentView={currentView} />
      {currentView === 'home' && <Home />}
      {currentView === 'login' && <Login setView={setCurrentView} />}
      {currentView === 'dashboard' && (
        <ProtectedRoute setView={setCurrentView}>
          <Dashboard />
        </ProtectedRoute>
      )}
      {currentView === 'admin' && (
        <ProtectedRoute setView={setCurrentView}>
          <AdminPanel />
        </ProtectedRoute>
      )}
      {/* Floating AI Chatbot — visible on all pages */}
      <AiChatBot />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
