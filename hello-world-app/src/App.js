import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Import routing components
import Home from './pages/Home'; // Import Home page
import ProfilePage from './pages/ProfilePage'; // Import Profile page
import EventCreationPage from './pages/EventCreationPage'; // Import Event Creation page
import EventDetailsPage from './pages/EventDetailsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/create-event" element={<EventCreationPage />} />
        <Route path="/event/:eventId" element={<EventDetailsPage />} /> {/* Dynamic route for event details */}
      </Routes>
    </Router>
  );
}

export default App;