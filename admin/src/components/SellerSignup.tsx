import React, { useState } from 'react';
import { validateEmail, validatePassword } from '../utils/validations';

export default function SellerSignup() {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '',
    shopName: '',
    shopDetails: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { name, email, password, shopName, shopDetails } = form;

    if (!name || !email || !password || !shopName) {
      setMessage('Name, email, password, and shop name are required');
      return;
    }

    if (!validateEmail(email)) {
      setMessage('Invalid email format');
      return;
    }

    if (!validatePassword(password)) {
      setMessage('Password must be at least 8 chars and include uppercase, lowercase, digit, and special char');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/sellers/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, shopName, shopDetails }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');

      setMessage('✅ Signup successful! Please login.');
      setForm({ name: '', email: '', password: '', shopName: '', shopDetails: '' });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 20 }}>
      <h2>Seller Signup</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: 5 }}>Name</label>
          <input 
            id="name" 
            name="name" 
            placeholder="Your Name" 
            value={form.name} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>
        
        <div style={{ marginBottom: 10 }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 5 }}>Email</label>
          <input 
            id="email" 
            name="email" 
            placeholder="Email Address" 
            value={form.email} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>
        
        <div style={{ marginBottom: 10 }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 5 }}>Password</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            placeholder="Password" 
            value={form.password} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>
        
        <div style={{ marginBottom: 10 }}>
          <label htmlFor="shopName" style={{ display: 'block', marginBottom: 5 }}>Shop Name</label>
          <input 
            id="shopName" 
            name="shopName" 
            placeholder="Your Shop Name" 
            value={form.shopName} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>
        
        <div style={{ marginBottom: 15 }}>
          <label htmlFor="shopDetails" style={{ display: 'block', marginBottom: 5 }}>Shop Details</label>
          <textarea 
            id="shopDetails" 
            name="shopDetails" 
            placeholder="Description of your shop" 
            value={form.shopDetails} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '100px' }} 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Signing up...' : 'Signup'}
        </button>
      </form>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginTop: '15px', 
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
