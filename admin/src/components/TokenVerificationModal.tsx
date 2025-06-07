import React, { useState } from 'react';

interface TokenVerificationModalProps {
  isOpen: boolean;
  onTokenVerified: () => void;
  onClose: () => void;
}

const TokenVerificationModal: React.FC<TokenVerificationModalProps> = ({
  isOpen,
  onTokenVerified,
  onClose
}) => {
  const [token, setToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError('Please enter a token');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/seller-admin/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.trim() }),
      });

      const result = await response.json();

      if (result.valid) {
        onTokenVerified();
        setToken('');
        setError('');
      } else {
        setError(result.message || 'Invalid token');
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      setError('Failed to verify token. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setToken('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>🔐 Access Verification Required</h2>
          <button 
            onClick={handleClose}
            className="close-btn"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <p className="verification-text">
            To access the seller registration page, you need a valid access token.
            Please enter the 32-digit token provided by the administrator.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="token">Access Token:</label>
              <input
                type="text"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter 32-digit access token"
                maxLength={32}
                className={`form-control ${error ? 'error' : ''}`}
                disabled={isVerifying}
              />
              {error && <div className="error-message">{error}</div>}
            </div>
            
            <div className="modal-actions">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary"
                disabled={isVerifying}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isVerifying || !token.trim()}
              >
                {isVerifying ? 'Verifying...' : 'Verify Token'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          animation: modalSlideIn 0.3s ease-out;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 0 24px;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 20px;
        }
        
        .modal-header h2 {
          margin: 0;
          color: #1f2937;
          font-size: 1.5rem;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          transition: color 0.2s;
        }
        
        .close-btn:hover {
          color: #374151;
        }
        
        .modal-body {
          padding: 0 24px 24px 24px;
        }
        
        .verification-text {
          color: #6b7280;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
        }
        
        .form-control {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Courier New', monospace;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        
        .form-control:focus {
          outline: none;
          border-color: #3b82f6;
        }
        
        .form-control.error {
          border-color: #ef4444;
        }
        
        .form-control:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #ef4444;
          font-size: 14px;
          margin-top: 8px;
        }
        
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }
        
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .btn-secondary {
          background-color: #f3f4f6;
          color: #374151;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background-color: #e5e7eb;
        }
        
        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default TokenVerificationModal;
