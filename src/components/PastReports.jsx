import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './Feature.css'; // Import our shared styles

// Friendly Mascot for the empty state
const Mascot = () => (
    <div className="mascot-container" style={{width: '80px', height: '80px'}}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g><circle cx="50" cy="50" r="45" fill="#c7d2fe"/><circle cx="35" cy="45" r="5" fill="white"/><circle cx="65" cy="45" r="5" fill="white"/><circle cx="35" cy="45" r="2" fill="black"/><circle cx="65" cy="45" r="2" fill="black"/><path d="M 35 65 Q 50 60 65 65" stroke="white" strokeWidth="3" fill="none" /></g>
        </svg>
    </div>
);


function PastReports({ onComplete }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().reports && docSnap.data().reports.length > 0) {
          const sortedReports = docSnap.data().reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setReports(sortedReports);
        } else {
          setError("No past reports found. Take a checkup to see your progress here!");
        }
      } catch (e) {
        setError("Could not fetch reports.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Function to get color class based on score
  const getScoreClass = (score) => {
    if (score <= 10) return 'score-low'; // Low distress
    if (score <= 20) return 'score-medium'; // Medium distress
    return 'score-high'; // High distress
  };

  if (loading) {
    return (
        <div className="feature-container">
            <div className="feature-card">
                <h2>Loading Past Reports...</h2>
            </div>
        </div>
    );
  }

  return (
    <div className="feature-container">
        <div className="feature-card">
            <button onClick={onComplete} className="back-button-feature">&larr;</button>
            <h2>Your Progress Timeline 📜</h2>
            
            {error ? (
                <div className="empty-reports-container">
                    <Mascot />
                    <p style={{marginTop: '20px', fontWeight: '500', color: '#475569'}}>{error}</p>
                </div>
            ) : (
                <div className="report-history-list">
                    {reports.map((report, index) => (
                        <div key={index} className="report-card-item">
                            <div className="report-card-header">
                                <h3>{new Date(report.createdAt).toLocaleDateString()}</h3>
                                <div className={`report-score ${getScoreClass(report.score)}`}>
                                    Score: {report.score}
                                </div>
                            </div>
                            <details className="report-details">
                                <summary>Show AI Analysis & Suggestions</summary>
                                <p>
                                    <strong>Analysis:</strong> {report.analysis}
                                    <br/><br/>
                                    <strong>Suggestions:</strong> {report.suggestions}
                                </p>
                            </details>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}

export default PastReports;