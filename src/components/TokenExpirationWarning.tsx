import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface TokenExpirationWarningProps {
  expiresAt: string | null;
}

const TokenExpirationWarning: React.FC<TokenExpirationWarningProps> = ({ expiresAt }) => {
  const { user, token } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!expiresAt || !token) return;

    const checkExpiration = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const timeDiff = expiry - now;
      
      // Show warning if token expires within 30 minutes
      const thirtyMinutes = 30 * 60 * 1000;
      
      if (timeDiff <= thirtyMinutes && timeDiff > 0) {
        setShowWarning(true);
        const minutes = Math.floor(timeDiff / (60 * 1000));
        const seconds = Math.floor((timeDiff % (60 * 1000)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setShowWarning(false);
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, token]);

  const handleExtendSession = async () => {
    try {
      // Token will be automatically refreshed by the interceptor
      // Just make a simple API call to trigger refresh
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8001/api'}/check-token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setShowWarning(false);
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  };

  if (!showWarning) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)',
      border: '1px solid #f59e0b',
      borderRadius: '12px',
      padding: '16px 20px',
      boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.2), 0 10px 10px -5px rgba(245, 158, 11, 0.1)',
      fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
      zIndex: 9999,
      maxWidth: '350px',
      color: '#92400e',
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '18px' }}>⏰</span>
        <strong style={{ fontSize: '14px', color: '#78350f' }}>
          Session Expiring Soon
        </strong>
      </div>
      
      <div style={{ 
        fontSize: '13px', 
        marginBottom: '12px',
        color: '#92400e',
        lineHeight: '1.4',
      }}>
        Your session will expire in <strong>{timeLeft}</strong>. 
        Click "Extend Session" to continue working.
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={() => setShowWarning(false)}
          style={{
            background: 'transparent',
            border: '1px solid #d97706',
            color: '#92400e',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          Dismiss
        </button>
        <button
          onClick={handleExtendSession}
          style={{
            background: '#f59e0b',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          Extend Session
        </button>
      </div>
    </div>
  );
};

export default TokenExpirationWarning;