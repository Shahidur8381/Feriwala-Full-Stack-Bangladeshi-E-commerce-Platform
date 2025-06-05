import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SellerLogin from '../components/SellerLogin';
import { isLoggedIn } from '../utils/auths';

const SellerLoginPage: React.FC = () => {
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (isLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

  const handleLoginSuccess = () => {
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
      <h1>Seller Login</h1>
      <SellerLogin onLoginSuccess={handleLoginSuccess} />
      <p style={{ marginTop: '1rem' }}>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
};

export default SellerLoginPage;