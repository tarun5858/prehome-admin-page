import React, { useState, useEffect, useCallback } from 'react';
import './LeadsDashboard.css';
import { useNavigate } from "react-router-dom";

const ALL_FIELD_LABELS = {
  waitlist_leads: {
    name: "Name",
    email: "Email",
    phone: "Phone",
    selectedLocation: "Location",
    selectedLayout: "Layout",
    source: "Source",
    createdAt: "Date Submitted",
  },
  general_inquiries: {
    name: "Name",
    contact: "Phone/Contact",
    location: "Client Location",
    message: "Message",
    createdAt: "Date Submitted",
  },
  expert_session_bookings: {
    name: "Name",
    contact: "Email/Contact",
    date: "Session Date",
    time: "Session Time",
    createdAt: "Date Submitted",
  },
};

const LeadsDashboard = () => {
  const [activeCollection, setActiveCollection] = useState('waitlist_leads');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Use your actual backend URL here
  const API_BASE_URL = 'https://prehome-admin-page.onrender.com'; 

  const fetchLeads = useCallback(async (collection) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/data/${collection}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setLeads(data.leads);
      } else {
        setError(data.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error. Please check if backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads(activeCollection);
  }, [activeCollection, fetchLeads]);

  const labels = ALL_FIELD_LABELS[activeCollection];
  const fields = Object.keys(labels);

  const navigate = useNavigate();

  return (
    <div className="leads-dashboard-container">
      <h1>Website Leads Dashboard</h1>
<div className="row " style={{display:"flex", justifyContent:"flex-end"}}>
      <button style={{cursor: "pointer",
              padding: "15px 30px",
              fontSize: "1.1rem",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",}} onClick={() => navigate('/admin-home')}> Back to Dashboard</button>
        </div>
      <div className="dashboard-controls">
        {Object.keys(ALL_FIELD_LABELS).map((key) => (
          <button
            key={key}
            className={activeCollection === key ? 'active' : ''}
            onClick={() => setActiveCollection(key)}
          >
            {key.replace(/_/g, ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {loading && <p className="status-msg">Loading leads data...</p>}
      {error && <p className="status-msg error">{error}</p>}
      
      {!loading && !error && (
        <div className="table-responsive">
          <table className="leads-table">
            <thead>
              <tr>
                {fields.map(f => <th key={f}>{labels[f]}</th>)}
              </tr>
            </thead>
            <tbody>
              {leads.length > 0 ? (
                leads.map((lead, index) => (
                  <tr key={lead._id || index}>
                    {fields.map(f => (
                      <td key={f}>
                        {f === 'createdAt' 
                          ? new Date(lead[f]).toLocaleString() 
                          : lead[f] || 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={fields.length} style={{ textAlign: 'center' }}>
                    No leads found in this collection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeadsDashboard;