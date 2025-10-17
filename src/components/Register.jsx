import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import './Form.css'; // Import the new CSS file

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        contactNumber
      });
    } catch (error) {
      console.error("Error registering user: ", error);
      alert(error.message);
    }
  };

  return (
    <div className="form-card">
      <h2>Create Your Account 📝</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          className="form-input"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="form-input"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="form-input"
          required
        />
        <input
          type="tel"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          placeholder="Contact Number"
          className="form-input"
          required
        />
        <button type="submit" className="form-button">Register</button>
      </form>
    </div>
  );
}

export default Register;
