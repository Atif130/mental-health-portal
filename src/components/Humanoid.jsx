import React, { useState, useEffect } from 'react';

// IMPORTANT: Replace this with your actual Render backend URL
const BACKEND_URL = 'https://mental-health-portal-3z8c.onrender.com'; 

// For browser compatibility
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-IN';

function Humanoid({ onComplete }) {
  const [transcript, setTranscript] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Click the button and start talking.');

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setStatusMessage('Click the button and start talking.');
    };
    speechSynthesis.speak(utterance);
  };

  const handleListen = () => {
    if (isListening) {
      recognition.stop();
      setIsListening(false);
      setStatusMessage('Click the button and start talking.');
      return;
    }

    setIsListening(true);
    setStatusMessage('Listening...');
    recognition.start();

    recognition.onresult = async (event) => {
      const userText = event.results[0][0].transcript;
      setTranscript(prev => [...prev, { type: 'user', text: userText }]);
      setIsListening(false);
      setStatusMessage('Thinking...');

      // Send to backend
      try {
        const response = await fetch(`${BACKEND_URL}/ask-ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userText }),
        });

        if (!response.ok) {
          throw new Error('Something went wrong with the AI response.');
        }

        const data = await response.json();
        const aiText = data.reply;

        setTranscript(prev => [...prev, { type: 'ai', text: aiText }]);
        speak(aiText);

      } catch (error) {
        console.error("Error fetching AI response:", error);
        const errorText = "Sorry, I'm having trouble connecting to my brain right now.";
        setTranscript(prev => [...prev, { type: 'ai', text: errorText }]);
        speak(errorText);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setStatusMessage('Sorry, I couldn\'t hear that. Please try again.');
    };
  };

  return (
    <div>
      <h2>Talk to Humanoid</h2>
      <div className="transcript-box" style={{ height: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
        {transcript.map((entry, index) => (
          <p key={index} style={{ textAlign: entry.type === 'user' ? 'right' : 'left' }}>
            <strong>{entry.type === 'user' ? 'You' : 'AI'}:</strong> {entry.text}
          </p>
        ))}
      </div>
      <p>{statusMessage}</p>
      <button onClick={handleListen} disabled={isSpeaking || isListening}>
        {isListening ? 'Listening...' : 'Start Talking'}
      </button>
      <button onClick={onComplete} disabled={isSpeaking || isListening}>Back to Dashboard</button>
    </div>
  );
}

export default Humanoid;