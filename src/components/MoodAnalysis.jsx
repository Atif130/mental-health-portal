import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

function MoodAnalysis({ onComplete }) {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState('');
  let moodInterval;

  // Step 1: Models load karna
  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      ]);
      startWebcam();
    };
    loadModels();
  }, []);

  // Step 2: Webcam start karna
  const startWebcam = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setLoading(false);
        }
      })
      .catch(err => console.error("Error accessing webcam: ", err));
  };

  // Step 3: Analysis shuru karna jab video play hone lage
  const handleVideoPlay = () => {
    const moods = [];
    moodInterval = setInterval(async () => {
      if (videoRef.current) {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
        if (detections.length > 0) {
          const expressions = detections[0].expressions;
          const dominantMood = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
          moods.push(dominantMood);
        }
      }
    }, 500); // Har aadhe second mein check karega

    // 10 second ke baad analysis ko rokein
    setTimeout(() => {
      clearInterval(moodInterval);
      stopWebcam();
      analyzeMoods(moods);
    }, 10000); // 10 seconds
  };

  // Step 4: collected moods ko analyze karein aur result save karein
  const analyzeMoods = (moods) => {
    if (moods.length === 0) {
      setResult("Could not detect a face. Please try again.");
      return;
    }

    const moodCounts = moods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {});

    const dominantMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b);
    setResult(`Your dominant mood appears to be: ${dominantMood}`);

    // Save to Firestore
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    updateDoc(userDocRef, {
      moodAnalysisReport: {
        mood: dominantMood,
        createdAt: new Date().toISOString(),
      }
    });
  };

  // Step 5: Webcam band karna
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };


  return (
    <div>
      <h2>Mood Analysis</h2>
      {loading && <p>Loading AI Models...</p>}
      <video ref={videoRef} onPlay={handleVideoPlay} autoPlay muted style={{ width: '100%', maxWidth: '500px' }} />
      {!loading && !result && <p>Please look into the camera. Analyzing for 10 seconds...</p>}
      {result && (
        <div>
          <h3>Analysis Complete</h3>
          <p>{result}</p>
          <button onClick={onComplete}>Back to Dashboard</button>
        </div>
      )}
    </div>
  );
}

export default MoodAnalysis;