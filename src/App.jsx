import React, { useState, useEffect } from 'react';
import { auth } from './firebase'; // Firebase se auth import karein
import { onAuthStateChanged } from 'firebase/auth'; // Yeh jaasoos (spy) hai
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null); // Shuru mein user null (logged-out) hai
  const [isRegistering, setIsRegistering] = useState(false); // Login/Register toggle

  // Yeh useEffect ek jaasoos (spy) set karta hai jo hamesha dekhta rehta hai
  // ki user logged-in hai ya nahi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Agar user login karta hai to uski info yahan aa jati hai
    });

    // Cleanup function (jab component band ho to spy ko hata do)
    return () => unsubscribe();
  }, []);

  if (user) {
    // Agar user logged-in hai, to Dashboard dikhao
    return <Dashboard />;
  }

  // Agar user logged-in nahi hai, to Login ya Register form dikhao
  return (
    <div>
      <h1>Welcome to the Mental Health Portal</h1>
      {isRegistering ? (
        <Register />
      ) : (
        <Login />
      )}
      <button onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
      </button>
    </div>
  );
}

export default App;