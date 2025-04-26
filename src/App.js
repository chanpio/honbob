import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LunchAvailabilityForm from './pages/LunchAvailabilityForm';
import UserAvailabilityView from './pages/UserAvailabilityView';
import LunchAppointmentFinal from './pages/LunchAppointmentFinal';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<LunchAvailabilityForm />} />
          <Route path="/users" element={<UserAvailabilityView />} />
          <Route path="/final" element={<LunchAppointmentFinal />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;