import React, { useState } from 'react';
import { auth } from './firebase.js'; // Make sure to provide the correct path to your firebase config

const Registration = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegistration = async () => {
    try {
      await auth.createUserWithEmailAndPassword(email, password);
      console.log('User registered successfully!');
      // Add any additional logic here (e.g., redirect to login page)
    } catch (error) {
      console.error('Error registering user:', error.message);
    }
  };

  return (
    <div id="registration-form" className="form-container">
      <h2>REGISTRACIJA V RAZREDNI ČASOPIS</h2>
      <input type="text" placeholder="Uporabniško ime" value={username} onChange={(e) => setUsername(e.target.value)} required /><br />
      <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required /><br />
      <input type="password" placeholder="Geslo" value={password} onChange={(e) => setPassword(e.target.value)} required /><br />
      <button className="blob-btn" onClick={handleRegistration()} id="registracijaBtn">
        <span className="blob-btn__inner">
          <span className="blob-btn__blobs">
            <span className="blob-btn__blob"></span>
            <span className="blob-btn__blob"></span>
            <span className="blob-btn__blob"></span>
            <span className="blob-btn__blob"></span>
          </span>
        </span>
        Registracija
      </button>
    </div>
  );
};

export default Registration;
