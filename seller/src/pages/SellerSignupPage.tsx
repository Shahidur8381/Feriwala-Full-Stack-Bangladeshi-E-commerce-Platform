import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SellerSignup from '../components/SellerSignup';
import TokenVerificationModal from '../components/TokenVerificationModal';
import { isLoggedIn } from '../utils/auths';

const SellerSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (isLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

  const handleSignupClick = () => {
    if (!isTokenVerified) {
      setShowTokenModal(true);
    }
  };

  const handleTokenVerified = () => {
    setIsTokenVerified(true);
    setShowTokenModal(false);
  };

  const handleCloseModal = () => {
    setShowTokenModal(false);
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
      <h1>Seller Signup</h1>
      
      {!isTokenVerified ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ 
            background: '#f8f9fa', 
            border: '2px solid #e9ecef', 
            borderRadius: '12px', 
            padding: '2rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
            <h2 style={{ color: '#495057', marginBottom: '1rem' }}>Access Verification Required</h2>
            <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
              To create a seller account, you need a valid access token from the administrator.
            </p>
            <button 
              onClick={handleSignupClick}
              style={{
                background: 'linear-gradient(135deg, #007bff, #0056b3)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Enter Access Token
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '1.5rem',
            color: '#155724'
          }}>
            ✅ Access token verified. You can now create your seller account.
          </div>
          <SellerSignup />
        </>
      )}
      
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>

      <TokenVerificationModal
        isOpen={showTokenModal}
        onTokenVerified={handleTokenVerified}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default SellerSignupPage;