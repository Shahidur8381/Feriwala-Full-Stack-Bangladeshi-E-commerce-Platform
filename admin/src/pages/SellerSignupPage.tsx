import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SellerSignup from '../components/SellerSignup';
import { isLoggedIn } from '../utils/auths';

const SellerSignupPage: React.FC = () => {
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (isLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
      <h1>Seller Signup</h1>
      <SellerSignup />
      <p style={{ marginTop: '1rem' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default SellerSignupPage;