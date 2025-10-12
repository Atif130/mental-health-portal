 import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import AiCheckup from './AiCheckup';
import MoodAnalysis from './MoodAnalysis';
import Humanoid from './Humanoid';
import PastReports from './PastReports';
import Journal from './Journal';
import './Dashboard.css'; // Nayi CSS file import karein

function Dashboard() {
  const [view, setView] = useState('main');
  const [userData, setUserData] = useState(null); // Student ka data save karne ke liye state

  // Jab component load ho, to student ka data fetch karein
  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  const renderMainView = () => (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            {/* Yahan student ka naam display hoga */}
            <h1>Welcome, {userData ? userData.name.split(' ')[0] : 'Student'}!</h1>
            <p>Your personal space for clarity and growth.</p>
          </div>
        </div>
        
        <div className="feature-grid">
          <button className="feature-button" onClick={() => setView('checkup')}>
            <span className="emoji">🧠</span>
            <h3>AI Wellness Check</h3>
            <p>Answer a few questions for a detailed analysis.</p>
          </button>
          <button className="feature-button" onClick={() => setView('mood')}>
            <span className="emoji">😊</span>
            <h3>Mood Mirror</h3>
            <p>Analyze your current mood using your camera.</p>
          </button>
          <button className="feature-button" onClick={() => setView('humanoid')}>
            <span className="emoji">🤖</span>
            <h3>Talk to Mindy</h3>
            <p>Have a voice conversation with our AI companion.</p>
          </button>
          <button className="feature-button" onClick={() => setView('journal')}>
            <span className="emoji">📔</span>
            <h3>AI Journal</h3>
            <p>Reflect on your day and get gentle insights.</p>
          </button>
        </div>
        
        <div className="dashboard-footer">
          <button className="footer-button" onClick={() => setView('pastReports')}>
            📊 View Previous Insights
          </button>
          <button className="footer-button logout-button" onClick={handleLogout}>
            🔒 Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  const renderView = () => {
    switch(view) {
      case 'checkup':
        return <AiCheckup onComplete={() => setView('main')} />;
      case 'mood':
        return <MoodAnalysis onComplete={() => setView('main')} />;
      case 'humanoid':
        return <Humanoid onComplete={() => setView('main')} />;
      case 'pastReports':
        return <PastReports onComplete={() => setView('main')} />;
      case 'journal':
        return <Journal onComplete={() => setView('main')} />;
      default:
        return renderMainView();
    }
  }

  return <div>{renderView()}</div>;
}

export default Dashboard;
