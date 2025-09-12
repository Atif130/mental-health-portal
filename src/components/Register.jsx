import React, { useState } from 'react';
import { auth, db } from '../firebase'; // Apni firebase.js file se import
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';

function Register() {
  // Har input field ke liye ek memory box (state)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault(); // Form ko page refresh karne se rokein
    try {
      // Firebase mein naya user banayein email aur password se
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Bachi hui details ko Firestore database mein save karein
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        studentId: studentId,
        className: className,
        section: section,
      });

      alert('Registration successful!');
    } catch (error) {
      console.error("Error registering user: ", error);
      alert(error.message);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required /><br/>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required /><br/>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required /><br/>
        <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Student ID" required /><br/>
        <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Class" required /><br/>
        <input type="text" value={section} onChange={(e) => setSection(e.target.value)} placeholder="Section" required /><br/>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;