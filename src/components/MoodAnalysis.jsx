import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import './Feature.css';

// A friendly mascot SVG
const Mascot = () => (
    <div className="mascot-container" style={{width: '80px', height: '80px'}}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g><circle cx="50" cy="50" r="45" fill="#c7d2fe"/><circle cx="35" cy="45" r="5" fill="white"/><circle cx="65" cy="45" r="5" fill="white"/><circle cx="35" cy="45" r="2" fill="black"/><circle cx="65" cy="45" r="2" fill="black"/><path d="M 35 65 Q 50 75 65 65" stroke="white" strokeWidth="3" fill="none" /></g>
        </svg>
    </div>
);

// Countdown Circle Component
const ProgressRing = ({ radius, stroke, progress }) => { /* ... (This component is the same) ... */ };

function MoodAnalysis({ onComplete }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null); // Ref to hold the stream
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState('');
    const [countdown, setCountdown] = useState(5);
    const analysisInterval = useRef(null);
    const countdownInterval = useRef(null);

    const stopWebcam = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    useEffect(() => {
        const start = async () => {
            setLoading(true);
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceExpressionNet.loadFromUri('/models'),
            ]);
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing webcam: ", err);
            } finally {
                setLoading(false);
            }
        };
        start();

        return () => stopWebcam(); // Cleanup on unmount
    }, []);

    const handleVideoPlay = () => {
        const moods = [];
        
        countdownInterval.current = setInterval(() => {
            setCountdown(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);

        analysisInterval.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.paused === false) {
                const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
                if (detections) {
                    const dominantMood = Object.keys(detections.expressions).reduce((a, b) => detections.expressions[a] > detections.expressions[b] ? a : b);
                    moods.push(dominantMood);
                }
            }
        }, 500);

        setTimeout(() => {
            clearInterval(analysisInterval.current);
            clearInterval(countdownInterval.current);
            stopWebcam(); // Call the robust stop function
            analyzeMoods(moods);
        }, 5000);
    };

    const analyzeMoods = (moods) => {
        if (moods.length === 0) {
            setResult({ mood: 'unknown', emoji: '🤔' });
            return;
        }
        const moodCounts = moods.reduce((acc, mood) => ({...acc, [mood]: (acc[mood] || 0) + 1}), {});
        const dominantMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b);
        
        const moodEmojis = { happy: '😄', sad: '😢', angry: '😠', neutral: '😐', surprised: '😮', fearful: '😨', disgusted: '🤢' };
        setResult({ mood: dominantMood, emoji: moodEmojis[dominantMood] || '😊' });
        
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        updateDoc(userDocRef, {
            moodAnalysisReport: { mood: dominantMood, createdAt: new Date().toISOString() }
        });
    };

    const progress = (countdown / 5) * 100;

    return (
        <div className="feature-container">
            <div className="feature-card">
                <Mascot />
                {!result ? (
                    <>
                        <h2>Mood Mirror</h2>
                        <p className="status-text">{loading ? "Loading AI Models..." : "Look into the camera to begin!"}</p>
                        <div className="video-container">
                            <video ref={videoRef} onPlay={handleVideoPlay} autoPlay muted className="video-feed" />
                            {!loading && <ProgressRing radius={120} stroke={8} progress={progress} />}
                            {!loading && <div className="countdown-text">{countdown > 0 ? countdown : 'Done!'}</div>}
                        </div>
                    </>
                ) : (
                    <div className="result-display">
                        <h2>Analysis Complete!</h2>
                        <div className="result-emoji">{result.emoji}</div>
                        <p className="result-text">Your dominant mood seems to be: <strong>{result.mood}</strong></p>
                        <button onClick={onComplete} className="form-button" style={{marginTop: '20px'}}>Back to Dashboard</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MoodAnalysis;