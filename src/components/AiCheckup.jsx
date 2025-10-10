import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import './Feature.css';

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

// Pre-written content bank for analysis and suggestions based on score ranges
const reportContent = {
    low: {
        analysis: "Your responses suggest that you are in a good state of mental well-being. You seem to be handling daily stressors effectively. Keep prioritizing your self-care routines!",
        suggestions: [
            "Continue your healthy habits! Regular exercise and a balanced diet can help maintain your positive state.",
            "Explore a new hobby or creative outlet to further boost your mood and creativity.",
            "Practice gratitude journaling. Writing down three things you're thankful for each day can enhance your sense of well-being.",
            "Connect with friends and loved ones. Strong social ties are a key component of happiness.",
            "Spend some time in nature. Even a short walk outdoors can be refreshing and reduce stress."
        ]
    },
    mild: {
        analysis: "Your score indicates that you might be experiencing some mild stress or emotional distress. While generally manageable, it's a good idea to pay attention to these feelings and practice some self-care.",
        suggestions: [
            "Try a 5-minute guided meditation. Apps like Calm or Headspace can be great, or find one on YouTube.",
            "Talk about what's on your mind with a friend or family member you trust.",
            "Make sure you are getting enough sleep. Aim for 7-9 hours per night to help your mind rest and recover.",
            "Engage in a physical activity you enjoy, like dancing, jogging, or cycling, to release endorphins.",
            "Take short breaks throughout the day to stretch, breathe deeply, or step away from your screen."
        ]
    },
    moderate: {
        analysis: "Your responses suggest a moderate level of emotional distress. It's important to address these feelings. This is a good time to be proactive about your mental health and seek out supportive resources.",
        suggestions: [
            "It could be very helpful to schedule a conversation with a school counselor to talk through what you're experiencing.",
            "Create a structured daily routine. This can provide a sense of stability and control when things feel overwhelming.",
            "Limit your exposure to social media and the news for a day or two to reduce external stressors.",
            "Try a calming activity like drawing, listening to soothing music, or taking a warm bath.",
            "Write down your worries in a journal. Simply getting them out of your head and onto paper can provide relief."
        ]
    },
    high: {
        analysis: "Your score indicates a significant level of distress. It is highly recommended that you speak with a trusted adult, school counselor, or a mental health professional soon. Your well-being is a priority, and getting support is a sign of strength.",
        suggestions: [
            "Please reach out to a school counselor or a trusted teacher as soon as possible. They are there to help you.",
            "If you need to talk to someone immediately, consider calling a helpline. They offer free, confidential support.",
            "Focus on small, simple tasks. Don't pressure yourself to do everything at once. One small step is enough for today.",
            "Be kind to yourself. Allow yourself to rest and don't feel guilty about taking time for yourself.",
            "Remember that you are not alone, and help is available. Talking to someone is the first and most important step."
        ]
    }
};

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

  const handleAnswer = (selectedOption) => {
    const updatedAnswers = [...userAnswers, { question: questions[currentQuestionIndex].text, answer: selectedOption.text, score: selectedOption.score }];
    setUserAnswers(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      generateFinalReport(updatedAnswers);
    }
  };
  
  const generateFinalReport = (answers) => {
    setLoading(true);

    // This setTimeout simulates the AI "thinking" for 2.5 seconds
    setTimeout(() => {
      const totalScore = answers.reduce((sum, ans) => sum + ans.score, 0);
      let resultCategory;

      if (totalScore <= 9) {
        resultCategory = 'low';
      } else if (totalScore <= 16) {
        resultCategory = 'mild';
      } else if (totalScore <= 23) {
        resultCategory = 'moderate';
      } else {
        resultCategory = 'high';
      }

      const content = reportContent[resultCategory];
      // Get a random suggestion from the list for the determined category
      const randomSuggestion = content.suggestions[Math.floor(Math.random() * content.suggestions.length)];

      const report = {
        score: totalScore,
        analysis: content.analysis,
        suggestions: randomSuggestion,
      };

      setFinalReport(report);
      
      // Save the generated report to Firebase
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      updateDoc(userDocRef, {
          reports: arrayUnion({ ...report, createdAt: new Date().toISOString() })
      });

      setLoading(false);
    }, 2500); // 2.5 second delay for the "AI thinking" illusion
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
