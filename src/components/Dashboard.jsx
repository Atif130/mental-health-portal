import React, { useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import Checkup from './Checkup';
import MoodAnalysis from './MoodAnalysis'; // Naya component import karein

function Dashboard() {
  const [view, setView] = useState('main'); // 'main', 'checkup', ya 'mood'

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  const renderMainView = () => (
    <div>
      <h1>Student Dashboard</h1>
      <p>Welcome, student! Select an option to continue.</p>

      <button onClick={() => setView('checkup')}>
        1. Mental Health Checkup
      </button>
      <button disabled>2. Talk to Humanoid (Coming Soon)</button>
      <button onClick={() => setView('mood')}>
        3. Mood Analysis Using Face
      </button>

      <hr />
      <button onClick={handleLogout}>Logout</button>
    </div>
  );

  // Main logic to switch between views
  const renderView = () => {
    switch(view) {
      case 'checkup':
        return <Checkup onComplete={() => setView('main')} />;
      case 'mood':
        return <MoodAnalysis onComplete={() => setView('main')} />;
      default:
        return renderMainView();
    }
  }

  return <div>{renderView()}</div>;
}

export default Dashboard;