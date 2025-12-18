import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminHome.css';

const AdminHome = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="admin-home-container">
      <header className="admin-header">
        <h1>Prehome Admin Portal</h1>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </header>

      <div className="selection-grid">
        <div className="selection-card" onClick={() => navigate('/manage-blogs')}>
          <div className="card-icon">📝</div>
          <h2>Blog Management</h2>
          <p>Publish New website blog.</p>
        </div>

        <div className="selection-card" onClick={() => navigate('/leads-dashboard')}>
          <div className="card-icon">📊</div>
          <h2>Leads Tracking</h2>
          <p>View waitlist, inquiries, and expert sessions.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;