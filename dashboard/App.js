import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import Dashboard from './components/dashboard';
import Donors from './components/donors';
import Inventory from './components/inventory';
import Hospitals from './components/hospitals';
import Requests from './components/requests';
import BloodDrive from './components/blooddrive';
import './App.css';


function App() {
  return (
    <Router>
      <div className="app">
        {/* Sidebar */}
        <div className="sidebar">
          <h1>Blood Bank</h1>
          <nav>
            <ul>
              <li>
                <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/donors" className={({ isActive }) => isActive ? 'active' : ''}>
                  Donors
                </NavLink>
              </li>
              <li>
                <NavLink to="/inventory" className={({ isActive }) => isActive ? 'active' : ''}>
                  Inventory
                </NavLink>
              </li>
              <li>
                <NavLink to="/hospitals" className={({ isActive }) => isActive ? 'active' : ''}>
                  Hospitals
                </NavLink>
              </li>
              <li>
                <NavLink to="/requests" className={({ isActive }) => isActive ? 'active' : ''}>
                  Requests
                </NavLink>
              </li>
              <li>
                <NavLink to="/blooddrive" className={({ isActive }) => isActive ? 'active' : ''}>
                  Blood Drives
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/donors" element={<Donors />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/hospitals" element={<Hospitals />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/blooddrive" element={<BloodDrive />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
