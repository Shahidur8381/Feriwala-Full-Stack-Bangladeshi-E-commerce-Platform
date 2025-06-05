import React from 'react';
import SellerProfile from '../components/SellerProfile';

const SellerProfilePage: React.FC = () => {
  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
      <h1>Seller Profile</h1>
      <SellerProfile />
    </div>
  );
};

export default SellerProfilePage;