import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './Feature.css'; // Uses the same base styles

// IMPORTANT: Yahan apni nayi waali API Key daalein
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
 
// A friendly robot face component
const RobotFace = ({ mouthShape }) => {
  const mouths = {
    closed: <path d="M 35 68 Q 50 72 65 68" stroke="#6366f1" strokeWidth="4" fill="none" />,
    openSlight: <path d="M 38 68 Q 50 75 62 68" stroke="#6366f1" strokeWidth="4" fill="none" />,
    openWide: <ellipse cx="50" cy="72" rx="15" ry="5" fill="#6366f1" />
  };

  return (
    <svg viewBox="0 0 100 100" className="robot-face">
      <defs>
        <radialGradient id="grad-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{stopColor: '#dbeafe', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#bfdbfe', stopOpacity: 1}} />
        </radialGradient>
      </defs>
      {/* Head */}
      <circle cx="50" cy="50" r="48" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="4" />
      {/* Eyes with glow */}
      <circle cx="35" cy="45" r="10" fill="url(#grad-glow)" />
      <circle cx="65" cy="45" r="10" fill="url(#grad-glow)" />
      <circle cx="35" cy="45" r="8" fill="white" />
      <circle cx="65" cy="45" r="8" fill="white" />
      <circle cx="35" cy="45" r="4" fill="#4338ca" />
      <circle cx="65" cy="45" r="4" fill="#4338ca" />
      {/* Mouth */}
      {mouths[mouthShape] || mouths.closed}
    </svg>
  );
};


function Humanoid({ onComplete }) {
  const [lastUserText, setLastUserText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Click the mic and say something!');
  const [mouthShape, setMouthShape] = useState('closed');
  
  const modelRef = useRef(null);
  const lipSyncInterval = useRef(null);

  // Initialize the AI model only once
  useEffect(() => {
    const genAI = new GoogleGenerativeAI(API_KEY);
    modelRef.current = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }, []);

  // Lip-sync animation effect
  useEffect(() => {
    if (isSpeaking) {
      lipSyncInterval.current = setInterval(() => {
        const shapes = ['openSlight', 'openWide', 'closed', 'openSlight'];
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        setMouthShape(randomShape);
      }, 200);
    } else {
      clearInterval(lipSyncInterval.current);
      setMouthShape('closed');
    }
    return () => clearInterval(lipSyncInterval.current);
  }, [isSpeaking]);

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  const handleListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatusMessage("Sorry, your browser doesn't support speech recognition.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';

    setIsListening(true);
    setStatusMessage('Listening...');
    recognition.start();

    recognition.onresult = async (event) => {
      const userText = event.results[0][0].transcript;
      setLastUserText(userText);
      setTimeout(() => setLastUserText(''), 4000);

      setStatusMessage('Thinking...');
      try {
        const result = await modelRef.current.generateContent(userText);
        const response = await result.response;
        const aiText = response.text();
        speak(aiText);
      } catch (error) {
        console.error("Error with Generative AI:", error);
        speak("Sorry, I'm having a bit of trouble right now.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setStatusMessage('Click the mic to talk');
    };
  };

  return (
    <div className="feature-container">
      <div className="feature-card">
        <button onClick={onComplete} className="back-button-feature">&larr;</button>
        <div className="humanoid-container">
          <div className="robot-container">
            <RobotFace mouthShape={mouthShape} />
          </div>

          <div className="mic-container">
            <div className={`user-speech-bubble ${lastUserText ? 'visible' : ''}`}>
              {lastUserText}
            </div>

            <button 
              className={`mic-button ${isListening ? 'listening' : ''}`}
              onClick={handleListen}
              disabled={isSpeaking || isListening}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
              </svg>
            </button>

            {/* 🔴 Interrupt Button */}
            <button 
              onClick={() => {
                speechSynthesis.cancel();
                setIsSpeaking(false);
                setStatusMessage('Interrupted. You can ask another question now.');
              }}
              className="interrupt-button"
              style={{
                marginTop: '10px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              ⛔ Stop
            </button>

            <p style={{marginTop: '15px', color: '#4a5568', fontWeight: '500'}}>{statusMessage}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Humanoid;
