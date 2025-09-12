import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

// These questions are inspired by standard screeners like the PHQ-4.
const questions = [
  { id: 1, text: 'Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?', options: [{ text: 'Not at all', score: 0 }, { text: 'Several days', score: 1 }, { text: 'More than half the days', score: 2 }, { text: 'Nearly every day', score: 3 }] },
  { id: 2, text: 'Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?', options: [{ text: 'Not at all', score: 0 }, { text: 'Several days', score: 1 }, { text: 'More than half the days', score: 2 }, { text: 'Nearly every day', score: 3 }] },
  { id: 3, text: 'Over the last 2 weeks, how often have you been bothered by having little interest or pleasure in doing things?', options: [{ text: 'Not at all', score: 0 }, { text: 'Several days', score: 1 }, { text: 'More than half the days', score: 2 }, { text: 'Nearly every day', score: 3 }] },
  { id: 4, text: 'Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?', options: [{ text: 'Not at all', score: 0 }, { text: 'Several days', score: 1 }, { text: 'More than half the days', score: 2 }, { text: 'Nearly every day', score: 3 }] },
];

function Checkup({ onComplete }) {
  const [answers, setAnswers] = useState({});

  const handleAnswerChange = (questionId, score) => {
    setAnswers(prev => ({ ...prev, [questionId]: score }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(answers).length !== questions.length) {
      alert('Please answer all questions.');
      return;
    }

    let totalScore = 0;
    for (const questionId in answers) {
      totalScore += answers[questionId];
    }

    const report = {
      score: totalScore,
      answers: answers,
      createdAt: new Date().toISOString(),
    };

    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        mentalHealthReport: report,
      });

      // Show suggestions based on score
      let suggestion = '';
      if (totalScore <= 2) {
        suggestion = "Your mental health appears to be in a good state. Keep up the great work with your self-care routines!";
      } else if (totalScore <= 5) {
        suggestion = "You might be experiencing mild distress. It could be helpful to focus on stress-relief activities like mindfulness, exercise, or talking to a friend.";
      } else if (totalScore <= 8) {
        suggestion = "Your score indicates moderate distress. Consider reaching out to a school counselor or a trusted adult to talk about how you're feeling. Here are some games that might help you relax: [Game Links].";
      } else {
        suggestion = "Your score suggests significant distress. It is highly recommended that you speak with a mental health professional or a school counselor very soon. Your well-being is a priority.";
      }

      alert(`Your checkup is complete! Your score is ${totalScore}.\n\nSuggestion: ${suggestion}`);
      onComplete(); // Go back to the dashboard
    } catch (error) {
      console.error("Error saving report: ", error);
      alert("Could not save your report. Please try again.");
    }
  };

  return (
    <div>
      <h2>Mental Health Checkup</h2>
      <form onSubmit={handleSubmit}>
        {questions.map((q, index) => (
          <div key={q.id}>
            <p>{index + 1}. {q.text}</p>
            {q.options.map(opt => (
              <label key={opt.score}>
                <input
                  type="radio"
                  name={`question-${q.id}`}
                  onChange={() => handleAnswerChange(q.id, opt.score)}
                  required
                /> {opt.text}
              </label>
            ))}
          </div>
        ))}
        <button type="submit">Submit My Answers</button>
      </form>
    </div>
  );
}

export default Checkup;
