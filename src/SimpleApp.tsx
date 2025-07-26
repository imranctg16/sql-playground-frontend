import React from 'react';

function SimpleApp() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>SQL Playground</h1>
      <p>API Test: {window.location.origin.replace('3001', '8001')}/api/health</p>
      <button onClick={() => {
        fetch('http://localhost:8001/api/health')
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