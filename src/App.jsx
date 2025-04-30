import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/authentication/Login'; // Import Login component
import Profile from './components/profile/Profile'; // Import Profile component

function App() {
  return (
    <Routes>
      <Route path="/" element={<h1>Welcome to HelloWorld!</h1>} />
      <Route path="/login" element={<Login />} /> {/* Route for Login */}
      <Route path="/profile" element={<Profile />} /> {/* Route for Profile */}
    </Routes>
  );
}

export default App;