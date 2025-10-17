// AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './Admin.css';

// --- CONFIG: change API key if needed ---
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ---------- Helper components ----------

// Card used in grid view
const StudentCard = ({ student, onClick }) => {
  const latestReport = student.reports && student.reports.length > 0
    ? [...student.reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null;

  const getScoreClass = (score) => {
    if (score === null || score === undefined) return 'pill-gray';
    if (score <= 10) return 'pill-green';
    if (score <= 20) return 'pill-amber';
    return 'pill-red';
  };

  const moodEmojis = { happy: '😄', sad: '😢', angry: '😠', neutral: '😐', surprised: '😮', fearful: '😨', disgusted: '🤢' };
  const lastMood = student.moodAnalysisReport?.mood;

  return (
    <div className="student-card" onClick={onClick} role="button" tabIndex={0}>
      <h3 className="student-name">{student.name}</h3>
      <p className="student-email">{student.email}</p>
      <div className="card-footer">
        <span className={`data-pill ${getScoreClass(latestReport?.score)}`}>
          Score: {latestReport?.score ?? 'N/A'}
        </span>
        <span className="data-pill pill-gray">
          {lastMood ? `${moodEmojis[lastMood] || ''} ${lastMood}` : 'Mood: N/A'}
        </span>
      </div>
    </div>
  );
};

// Detailed view (merged from both old and new versions)
const StudentDetailView = ({ student, onBack }) => {
  const [suggestion, setSuggestion] = useState('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  const latestReport = student.reports && student.reports.length > 0
    ? [...student.reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null;

  const moodEmojis = { happy: '😄', sad: '😢', angry: '😠', neutral: '😐', surprised: '😮', fearful: '😨', disgusted: '🤢' };
  const lastMood = student.moodAnalysisReport?.mood;

  const generateSuggestion = async () => {
    setIsLoadingSuggestion(true);
    setSuggestion('');

    const prompt = `
You are a supportive and friendly school counselor writing a message for a student.
Write a kind, encouraging, and helpful message directly TO THE STUDENT named ${student.name}.
- Start the message with "Here are a few thoughts and suggestions based on your recent check-in:".
- Do NOT include a subject line or "Hello ${student.name}" greeting.
- Keep the tone positive and supportive.
- End the message by gently encouraging them to speak to a trusted person if they need to.

Confidential Report:
- Mental Health Score: ${latestReport?.score ?? 'Not Available'} (out of 30).
- Last Detected Mood: ${student.moodAnalysisReport?.mood ?? 'Not Available'}.
`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      setSuggestion(text);
    } catch (error) {
      console.error("Error generating suggestion:", error);
      setSuggestion("Could not generate a suggestion at this time. Please try again later.");
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const createEmailBody = () => {
    return `Hello ${student.name},
Here is a summary of your recent report from the Mental Health Portal. An admin has reviewed it and we've included some helpful, AI-powered thoughts below.
---
YOUR REPORT SUMMARY
- Mental Health Checkup Score: ${latestReport?.score ?? 'N/A'}
- Recent Mood Analysis: ${student.moodAnalysisReport?.mood ?? 'N/A'}
---
${suggestion || 'No AI suggestion generated yet.'}

Please remember, this is a tool to help you understand your feelings. Your well-being is our top priority.
Best regards,
The Admin Team`;
  };

  const handleEmailWithDesktop = () => {
    if (!suggestion) { alert("Please generate AI suggestions first."); return; }
    const subject = `Your Mental Health Report from the Portal`;
    const body = createEmailBody();
    const mailtoLink = `mailto:${student.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleEmailWithGmail = () => {
    if (!suggestion) { alert("Please generate AI suggestions first."); return; }
    const subject = `Your Mental Health Report from the Portal`;
    const body = createEmailBody();
    const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${student.email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailLink, '_blank');
  };

  return (
    <div className="detail-view">
      <button className="footer-button" onClick={onBack} style={{ marginBottom: 16 }}>&larr; Back to List</button>
      <h2>Report: {student.name}</h2>

      <div className="detail-grid">
        <div className="detail-left">
          <h4>Details</h4>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>ID:</strong> {student.studentId ?? 'N/A'}</p>
          <p><strong>Contact:</strong> {student.contactNumber ?? 'N/A'}</p>
        </div>

        <div className="detail-right">
          <div className="report-widget">
            <h3>Latest Score</h3>
            <p className="score">{latestReport?.score ?? 'N/A'}</p>
          </div>

          <div className="report-widget">
            <h3>Last Mood</h3>
            <p className="mood">{lastMood ? `${moodEmojis[lastMood] || ''} ${lastMood}` : 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="admin-actions">
        <h3>Admin Actions</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={generateSuggestion} disabled={isLoadingSuggestion}>
            {isLoadingSuggestion ? 'Generating...' : '🤖 Generate AI Suggestions'}
          </button>
          {/* <button onClick={handleEmailWithDesktop} disabled={!suggestion}>📧 Email (Desktop)</button> */}
          <button onClick={handleEmailWithGmail} disabled={!suggestion}>🌐 Email (Gmail)</button>
        </div>

        {suggestion && (
          <div className="suggestion-box" style={{ marginTop: 12 }}>
            <h4>AI-Powered Suggestion:</h4>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{suggestion}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Main Admin Dashboard ----------

function AdminDashboard({ onLogout }) {
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllStudents(userList);
      setFilteredStudents(userList);
    } catch (error) {
      console.error("Error fetching students: ", error);
      alert("Could not fetch data. Please check Firestore rules and network.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) { setFilteredStudents(allStudents); return; }
    const results = allStudents.filter(student =>
      (student.name || '').toLowerCase().includes(q) ||
      (student.email || '').toLowerCase().includes(q) ||
      (student.studentId || '').toLowerCase().includes(q)
    );
    setFilteredStudents(results);
  }, [searchTerm, allStudents]);

  const handleBack = () => {
    setSelectedStudent(null);
    fetchStudents(); // refresh data on back
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-card">
        {selectedStudent ? (
          <StudentDetailView student={selectedStudent} onBack={handleBack} />
        ) : (
          <>
            <div className="admin-header" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>Mission Control 🚀</h2>

              <div style={{ flex: 1, minWidth: 200 }}>
                <input
                  type="text"
                  placeholder="Search by name & email..."
                  className="search-bar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>Grid</button>
                <button className={`view-toggle ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>Table</button>
                <button className="footer-button logout-button" onClick={onLogout}>Logout</button>
              </div>
            </div>

            {loading ? (<p>Loading data...</p>) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="student-grid">
                    {filteredStudents.length === 0 ? (<p>No students found.</p>) : filteredStudents.map(student => (
                      <StudentCard key={student.id} student={student} onClick={() => setSelectedStudent(student)} />
                    ))}
                  </div>
                ) : (
                  <div className="table-wrapper">
                    {filteredStudents.length === 0 ? (<p>No students found.</p>) : (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Latest Score</th>
                            <th>Last Mood Detected</th>
                            <th>Contact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map(student => {
                            const latestReport = student.reports && student.reports.length > 0
                              ? [...student.reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
                              : null;
                            return (
                              <tr key={student.id} onClick={() => setSelectedStudent(student)} style={{ cursor: 'pointer' }}>
                                <td>{student.name}</td>
                                <td>{student.email}</td>
                                <td>{latestReport?.score ?? 'N/A'}</td>
                                <td>{student.moodAnalysisReport?.mood ?? 'N/A'}</td>
                                <td>{student.contactNumber ?? 'N/A'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
