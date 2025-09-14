import React, { useState } from 'react';
import './Form.css'; // Reuse the student form styles

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (username === 'Atifadmin' && password === 'Stemrobo') {
      onLogin();
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="form-card">
      <h2>Admin Login 🛡️</h2>
      <form onSubmit={handleAdminLogin}>
        <input 
          type="text" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          placeholder="Username" 
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
        {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
        <button type="submit" className="form-button">Login as Admin</button>
      </form>
    </div>
  );
}

export default AdminLogin;