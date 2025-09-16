import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './Feature.css';

// IMPORTANT: Yahan wahi API Key daalein
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// A fixed, standard set of 10 questions inspired by the PHQ-9 & GAD-7 screeners.
const questions = [
  { id: 1, text: 'Feeling nervous, anxious, or on edge?', options: [{ text: 'Not at all', score: 0 }, { text: 'Several days', score: 1 }, { text: 'More than half the days', score: 2 }, { text: 'Nearly every day', score: 3 }] },
  { id: 2, text: 'Not being able to stop or control worrying?', options: [{ text: 'Not at all', score: 0 }, { text: 'Several days', score: 1 }, { text: 'More than half the days', score: 2 }, { text: 'Nearly every day', score: 3 }] },
  { id: 3, text: 'Little interest or pleasure in doing things?', options: [{ text: 'Not at all', score: 0 }, { text: 'Several days', score: 1 }, { text: 'More than half the days', score: 2 }, { text: 'Nearly every day', score: 3 }] },
  { id: 4, text: 'Feeling down, depressed, or hopeless?', options: [{ text: 'Not at all', score: 0 }, { text: 'Several days', score: 1 }, { text: 'More than half the days', score: 2 }, { text: 'Nearly every day', score: 3 }] },
  { id: 5, text: 'Trouble falling or staying asleep, or sleeping too much?', options: [{ text: 'Not at all', score: 0 }, { text: 'Several days', score: 1 }, { text: 'More than half the days', score: 2 }, { text: 'Nearly every day', score: 3 }] },
  { id: 6, text: 'Feeling tired or having little energy?', options: [{ text: 'Not at all', score: 0 }, { text: 'Several days', score: 1 }, { text: 'More than half the days', score: 2 }, { text: 'Nearly every day', score: 3 }] },
  { id: 7, text: 'Poor appetite or overeating?', options: [{ text: 'Not at all', score: 0 }, { text: 'Several days', score: 1 }, { text: 'More than half the days', score: 2 }, { text: 'Nearly every day', score: 3 }] },
  { id: 8, text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down?', options: [{ text: 'Not at all', score: 0 }, { text: 'Several days', score: 1 }, { text: 'More than half the days', score: 2 }, { text: 'Nearly every day', score: 3 }] },
  { id: 9, text: 'Trouble concentrating on things, such as reading or watching TV?', options: [{ text: 'Not at all', score: 0 }, { text: 'Several days', score: 1 }, { text: 'More than half the days', score: 2 }, { text: 'Nearly every day', score: 3 }] },
  { id: 10, text: 'Feeling afraid, as if something awful might happen?', options: [{ text: 'Not at all', score: 0 }, { text: 'Several days', score: 1 }, { text: 'More than half the days', score: 2 }, { text: 'Nearly every day', score: 3 }] },
];

const Mascot = () => (
    <div className="mascot-container">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g><circle cx="50" cy="50" r="45" fill="#c7d2fe"/><circle cx="35" cy="45" r="5" fill="white"/><circle cx="65" cy="45" r="5" fill="white"/><circle cx="35" cy="45" r="2" fill="black"/><circle cx="65" cy="45" r="2" fill="black"/><path d="M 35 65 Q 50 75 65 65" stroke="white" strokeWidth="3" fill="none" /></g>
        </svg>
    </div>
);

function AiCheckup({ onComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [finalReport, setFinalReport] = useState(null);
  const [error, setError] = useState('');

  const parseJsonResponse = (text) => {
    try {
      const match = text.match(/```json\n([\s\S]*?)\n```/);
      if (match && match[1]) { return JSON.parse(match[1]); }
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON from AI response:", text, e);
      return null;
    }
  };

  const handleAnswer = (selectedOption) => {
    const updatedAnswers = [...userAnswers, { question: questions[currentQuestionIndex].text, answer: selectedOption.text, score: selectedOption.score }];
    setUserAnswers(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      generateFinalReport(updatedAnswers);
    }
  };
  
  const generateFinalReport = async (answers) => {
    setLoading(true);
    setError('');

    const totalScore = answers.reduce((sum, ans) => sum + ans.score, 0);
    const scores = answers.map(ans => ans.score);
    
    const prompt = `You are a friendly and empathetic school counselor. A student has completed a 10-question mental health checkup. Their total score is ${totalScore} (out of 30), and their individual scores for the 10 questions were: ${scores.join(', ')}.

    Based on this total score and the pattern of scores, perform the following actions:
    1. Provide a detailed, supportive, and personalized analysis of the student's potential state.
    2. Provide a list of actionable suggestions and remedies for the student.
    
    Format your response as a single JSON object with three keys: {"score": ${totalScore}, "analysis": "Your detailed analysis here...", "suggestions": "Your list of suggestions here."}. Do not add any text outside this JSON block.`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();
      const report = parseJsonResponse(responseText); 

      if (report) {
        setFinalReport(report);
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, {
            reports: arrayUnion({ ...report, createdAt: new Date().toISOString() })
        });
      } else {
        setError("The AI gave a response in an unexpected format. Please try again.");
      }
    } catch (e) {
      console.error(e);
      if (e.message && e.message.includes('429')) {
        setError("You have exceeded your free API quota for the minute. Please wait and try again.");
      } else {
        setError("An error occurred while generating the report. Please try again later.");
      }
    } finally {
        setLoading(false);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (loading) {
    return (
      <div className="feature-container">
        <div className="feature-card">
          <Mascot />
          <h2>Generating Your Report...</h2>
          <p>Our AI is analyzing your answers. This won't take long!</p>
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

  const currentQuestion = questions[currentQuestionIndex];
  return (
    <div className="feature-container">
      <div className="feature-card">
        <Mascot />
        <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <h3 className="question-text">{currentQuestion.text}</h3>
        <div className="options-grid">
            {currentQuestion.options.map((opt, index) => (
              <button key={index} onClick={() => handleAnswer(opt)} className="option-button">
                {opt.text}
              </button>
            ))}
        </div>
        <button onClick={onComplete} style={{marginTop: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}}>Back to Dashboard</button>
      </div>
    </div>
  );
}

export default AiCheckup;
