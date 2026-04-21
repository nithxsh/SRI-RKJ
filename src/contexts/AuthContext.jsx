import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  
  function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  function logout() {
    return signOut(auth);
  }

  function changePassword(newPassword) {
    if (!currentUser) return Promise.reject("No user logged in");
    return import('firebase/auth').then(({ updatePassword }) => updatePassword(currentUser, newPassword));
  }

  function reauthenticate(password) {
    if (!currentUser || !currentUser.email) return Promise.reject("No user or email");
    return import('firebase/auth').then(({ EmailAuthProvider, reauthenticateWithCredential }) => {
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      return reauthenticateWithCredential(currentUser, credential);
    });
  }

  function updateUserData(newData) {
    if (!currentUser) return Promise.reject("No user logged in");
    const userRef = doc(db, 'users', currentUser.uid);
    return setDoc(userRef, newData, { merge: true }).then(() => {
      setUserData(prev => ({ ...prev, ...newData }));
    });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Auto-provision user document in Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            const initialData = {
              email: user.email,
              name: user.displayName || user.email.split('@')[0],
              role: user.email === (import.meta.env.VITE_ADMIN_EMAIL || 'nithishog31@gmail.com') ? 'admin' : 'user',
              joinedAt: serverTimestamp(),
              avatar: user.photoURL || '🕉️' // Use Google photo if available
            };
            await setDoc(userRef, initialData);
            setUserData(initialData);
          } else {
            setUserData(userSnap.data());
          }
        } catch (error) {
          console.error("Firestore User Provisioning Error:", error);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    signup,
    login,
    loginWithGoogle,
    logout,
    changePassword,
    reauthenticate,
    updateUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
