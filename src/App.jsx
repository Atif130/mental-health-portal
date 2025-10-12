import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './App.css'; // Nayi CSS file import karein

// Import all components
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('main');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setView('main');
  };

  // Main Choice Screen (New Design)
  if (view === 'main') {
    return (
      <div className="app-container">
        <div className="main-card">
          <h1>Welcome to Silver Companion</h1>
          <p>Your confidential space for mental wellness.</p>
          <div className="choice-container">
            <button className="choice-button" onClick={() => setView('student')}>
              👤 Enter Your Safe Space
            </button>
            <button className="choice-button" onClick={() => setView('admin')}>
              🛡️ Admin & Counselor Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Student View Logic (Abhi iska design nahi kiya hai)
  // In App.jsx, replace this entire block
if (view === 'student') {
  if (user) {
    return <Dashboard />;
  }
  return (
    <div className="form-container">
       <button className="back-button" onClick={() => setView('main')}>
          &#x2190; {/* This is a left arrow */}
       </button>
      <div>
        {isRegistering ? (
          <Register />
        ) : (
          <Login />
        )}
        <div className="form-toggle">
          <button onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
  
  // Admin View Logic (Abhi iska design nahi kiya hai)
  // In App.jsx, replace this entire block
if (view === 'admin') {
  if (isAdmin) {
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }
  return (
    <div className="form-container">
       <button className="back-button" onClick={() => setView('main')}>
          &#x2190;
       </button>
       <AdminLogin onLogin={() => setIsAdmin(true)} />
    </div>
  );
}
}

export default App;
