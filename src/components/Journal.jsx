import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './Feature.css'; // Uses our feature styles


// IMPORTANT: Yahan wahi API Key daalein
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;


const genAI = new GoogleGenerativeAI(API_KEY);
// ✅ Updated model name - changed from "gemini-1.5-flash-latest" to "gemini-2.5-flash"
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


// Friendly Mascot
const Mascot = () => (
    <div className="mascot-container" style={{width: '80px', height: '80px'}}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g><circle cx="50" cy="50" r="45" fill="#c7d2fe"/><circle cx="35" cy="45" r="5" fill="white"/><circle cx="65" cy="45" r="5" fill="white"/><circle cx="35" cy="45" r="2" fill="black"/><circle cx="65" cy="45" r="2" fill="black"/><path d="M 35 65 Q 50 75 65 65" stroke="white" strokeWidth="3" fill="none" /></g>
        </svg>
    </div>
);


function Journal({ onComplete }) {
  const [entry, setEntry] = useState('');
  const [pastEntries, setPastEntries] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);


  // This is your working code to fetch entries
  useEffect(() => {
    const journalCollectionRef = collection(db, 'users', auth.currentUser.uid, 'journals');
    const q = query(journalCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPastEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);


  // This is your working code to save an entry
  const handleSaveEntry = async () => {
    if (entry.trim() === '') return;
    setLoading(true);
    try {
      const journalCollectionRef = collection(db, 'users', auth.currentUser.uid, 'journals');
      await addDoc(journalCollectionRef, {
        text: entry,
        createdAt: new Date(),
      });
      setEntry('');
    } catch (error) {
      console.error("Error saving entry:", error);
    } finally {
      setLoading(false);
    }
  };


  // This is your working code to analyze an entry
  const handleAnalyzeEntry = async (entryText) => {
    setLoading(true);
    setAnalysis('');
    const prompt = `You are a compassionate psychologist. Analyze the following journal entry written by a student. Identify the key emotions (e.g., sadness, anxiety, happiness, frustration), recurring themes, and potential positive or negative patterns. Provide a gentle, supportive, and insightful summary in 3-4 sentences. Do not give medical advice. The entry is: "${entryText}"`;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAnalysis(`AI Insight ✨: ${response.text()}`);
    } catch (error) {
      console.error("Error analyzing entry:", error);
      setAnalysis("Could not analyze this entry at the moment.");
    } finally {
      setLoading(false);
    }
  };


  // This is the new, redesigned display
  return (
    <div className="feature-container">
      <div className="feature-card journal-layout">
        
        {/* Left Side - Writing Area */}
        <div className="journal-writing-section">
          <div style={{textAlign: 'center', marginBottom: '20px'}}>
            <Mascot />
            <h2>What's on your mind?</h2>
          </div>
          <textarea 
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Write about your day, your feelings, anything..."
            className="journal-textarea"
          ></textarea>
          <button onClick={handleSaveEntry} disabled={loading || entry.trim() === ''} className="form-button" style={{marginTop: '15px'}}>
            {loading ? 'Saving...' : 'Save Today\'s Entry'}
          </button>
          {analysis && <div className="analysis-box"><p>{analysis}</p></div>}
        </div>
        
        {/* Right Side - Past Entries */}
        <div className="journal-past-entries">
          <h3>Your Past Entries</h3>
          {pastEntries.length > 0 ? pastEntries.map(pastEntry => (
            <div key={pastEntry.id} className="past-entry-card" onClick={() => handleAnalyzeEntry(pastEntry.text)}>
              <p className="entry-date"><strong>{new Date(pastEntry.createdAt.toDate()).toLocaleDateString()}</strong></p>
              <p>{pastEntry.text}</p>
            </div>
          )) : <p>Your past entries will appear here.</p>}
        </div>

      </div>
      
      {/* Back Button positioned in lower right corner */}
      <button 
        onClick={onComplete} 
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#6b7280',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '50px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#4b5563';
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#6b7280';
          e.target.style.transform = 'translateY(0px)';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}
      >
        &larr; Back
      </button>
    </div>
  );
}


export default Journal;
