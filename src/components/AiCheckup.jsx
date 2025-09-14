import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './Feature.css';

// IMPORTANT: Yahan apni NAYI, DEDICATED API Key daalein
const API_KEY = 'YOUR_API_KEY_HERE';

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// A friendly mascot SVG
const Mascot = () => (
    <div className="mascot-container">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g><circle cx="50" cy="50" r="45" fill="#c7d2fe"/><circle cx="35" cy="45" r="5" fill="white"/><circle cx="65" cy="45" r="5" fill="white"/><circle cx="35" cy="45" r="2" fill="black"/><circle cx="65" cy="45" r="2" fill="black"/><path d="M 35 65 Q 50 75 65 65" stroke="white" strokeWidth="3" fill="none" /></g>
        </svg>
    </div>
);

function AiCheckup({ onComplete }) {
  const [studentData, setStudentData] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [finalReport, setFinalReport] = useState(null);
  const [error, setError] = useState('');

  // Fetch student data (like class) to send to the AI
  useEffect(() => {
    const fetchStudentData = async () => {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setStudentData(docSnap.data());
      } else {
        setError("Could not find student data.");
        setLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  // Start the checkup once student data is loaded
  useEffect(() => {
    if (studentData) {
      startCheckup();
    }
  }, [studentData]);

  const parseJsonResponse = (text) => {
    try {
        const jsonString = text.match(/```json\n([\s\S]*?)\n```/)[1];
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Failed to parse JSON:", error, "Raw text:", text);
        setError("The AI gave an unexpected response. Please try again.");
        return null;
    }
  };

  const startCheckup = async () => {
    setLoading(true);
    setError('');
    const prompt = `You are a friendly and empathetic school counselor. Start a 10-question mental health checkup for a student in class ${studentData.className}. Please provide ONLY the first multiple-choice question. Format your response as a single JSON object like this: {"question": "Your question here?", "options": [{"text": "Option A", "score": 0}, {"text": "Option B", "score": 1}, ...]}. Do not add any text outside the JSON block.`;
    
    try {
      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();
      const parsedResponse = parseJsonResponse(responseText);

      if(parsedResponse) {
          setCurrentQuestion(parsedResponse);
          setConversation([{ role: 'model', parts: [{ text: JSON.stringify(parsedResponse) }] }]);
      }
    } catch (e) {
      console.error(e);
      setError("The AI model seems to be busy. Please try again.");
    }
    setLoading(false);
  };

  const handleNextQuestion = async (selectedOption) => {
    setLoading(true);
    setError('');

    const updatedAnswers = [...userAnswers, { question: currentQuestion.question, answer: selectedOption.text, score: selectedOption.score }];
    setUserAnswers(updatedAnswers);
    
    const updatedConversation = [
        ...conversation,
        { role: 'user', parts: [{ text: `My answer is: ${selectedOption.text} (score: ${selectedOption.score})` }] }
    ];

    try {
      if (updatedAnswers.length < 10) {
        const prompt = `This is question ${updatedAnswers.length + 1} of 10. The conversation so far is: ${JSON.stringify(updatedConversation)}. Based on this, please provide the next multiple-choice question in the same JSON format as before. Do not add any other text outside the JSON block.`;
        
        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();
        const parsedResponse = parseJsonResponse(responseText);

        if (parsedResponse) {
          setCurrentQuestion(parsedResponse);
          setConversation([...updatedConversation, { role: 'model', parts: [{ text: JSON.stringify(parsedResponse) }] }]);
        }
      } else {
        const prompt = `The 10-question checkup is complete. Here are the user's answers: ${JSON.stringify(updatedAnswers)}. Please analyze these answers. Calculate the total score. Based on the score and answer content, provide a final analysis. Format your response as a single JSON object with three keys: {"score": TOTAL_SCORE, "analysis": "Your detailed analysis here...", "suggestions": "A list of actionable suggestions and remedies here."}. Do not add any text outside the JSON block.`;
        
        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();
        const report = parseJsonResponse(responseText);

        if (report) {
          setFinalReport(report);
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userDocRef, {
              reports: arrayUnion({ ...report, createdAt: new Date().toISOString() })
          });
        }
        setCurrentQuestion(null);
      }
    } catch (e) {
      console.error(e);
      setError("The AI model seems to be busy. Please try again.");
    }
    setLoading(false);
  };
  
  const progress = (userAnswers.length / 10) * 100;

  if (loading && !currentQuestion) {
    return (
      <div className="feature-container">
        <div className="feature-card">
          <Mascot />
          <h2>{finalReport ? 'Generating Your Report...' : 'Starting Checkup...'}</h2>
          <p>{finalReport ? 'AI is analyzing your answers...' : 'AI is preparing the first question...'}</p>
        </div>
      </div>
    );
  }

  if (finalReport) {
    return (
      <div className="feature-container">
        <div className="feature-card report-card">
          <Mascot />
          <h2>Checkup Complete!</h2>
          <h3>Your Score: {finalReport.score}</h3>
          <h4>AI Analysis:</h4>
          <p>{finalReport.analysis}</p>
          <h4>Here are some suggestions:</h4>
          <p>{finalReport.suggestions}</p>
          <h4>Relax with these games:</h4>
          <ul className="games-list">
            <li><a href="https://tetris.com/play-tetris" target="_blank" rel="noopener noreferrer">Play Tetris 🕹️</a></li>
            <li><a href="https://www.sudoku.com/" target="_blank" rel="noopener noreferrer">Play Sudoku 🧠</a></li>
            <li><a href="https://www.jigsawplanet.com/" target="_blank" rel="noopener noreferrer">Online Puzzles 🧩</a></li>
          </ul>
          <button onClick={onComplete} className="form-button" style={{marginTop: '20px'}}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-container">
      <div className="feature-card">
        <Mascot />
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        
        {currentQuestion ? (
          <div>
            <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="progress-text">Question {userAnswers.length + 1} of 10</p>
            <h3 className="question-text">{currentQuestion.question}</h3>
            {loading ? <p>AI is thinking...</p> : (
              <div className="options-grid">
                {currentQuestion.options.map((opt, index) => (
                  <button key={index} onClick={() => handleNextQuestion(opt)} className="option-button">
                    {opt.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : !error && <p>AI is preparing your checkup...</p>}
        <button onClick={onComplete} style={{marginTop: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}}>Back to Dashboard</button>
      </div>
    </div>
  );
}

export default AiCheckup;