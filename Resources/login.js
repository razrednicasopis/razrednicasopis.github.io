import React, { useState } from 'react';
import { auth } from './firebase.js'; // Make sure to provide the correct path to your firebase config

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
      console.log('Prijava uspešna.');
      // Add any additional logic here (e.g., redirect to dashboard)
    } catch (error) {
      console.error('Neuspešna prijava:', error.message);
    }
  };

  return (
    <div id="login-form" className="form-container">
      <h2>PRIJAVA V RAZREDNI ČASOPIS</h2>
      <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required /><br />
      <input type="password" placeholder="Geslo" value={password} onChange={(e) => setPassword(e.target.value)} required /><br />
      <button className="blob-btn" onClick={handleLogin} id="prijavaBtn">
        <span className="blob-btn__inner">
          <span className="blob-btn__blobs">
            <span className="blob-btn__blob"></span>
            <span className="blob-btn__blob"></span>
            <span className="blob-btn__blob"></span>
            <span className="blob-btn__blob"></span>
          </span>
        </span>
        Prijava
      </button>
    </div>
  );
};

export default Login;
