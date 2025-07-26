import React from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

function SimpleApp() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>SQL Playground</h1>
      <p>API Test: {window.location.origin.replace('3001', '8001')}/api/health</p>
      <button onClick={() => {
        fetch(`${API_BASE_URL}/health`)
          .then(r => r.json())
          .then(d => alert(JSON.stringify(d)))
          .catch(e => alert('Error: ' + e.message));
      }}>
        Test API
      </button>
    </div>
  );
}

export default SimpleApp;