import React, { useState } from 'react';
import { validateEmail, validatePassword } from '../utils/validations';
import { supabase } from '../utils/supabase';

export default function SellerSignup() {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '',
    shopName: '',
    shopDetails: '',
    token: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { name, email, password, shopName, shopDetails, token } = form;

    if (!name || !email || !password || !shopName || !token) {
      setMessage('Name, email, password, shop name, and registration token are required');
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
      // 0. Verify the seller admin token
      const tokenRes = await fetch(`${import.meta.env.VITE_API_URL}/api/seller-admin/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData.message || 'Invalid or expired registration token');
      }

      // 1. Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) throw new Error(error.message);

      if (!data.session) {
        setMessage('✅ Signup successful! Please check your email for a confirmation link before logging in.');
        setIsSuccess(true);
        return;
      }

      // 2. Sync profile with backend
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sellers/sync-profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session.access_token}`
        },
        body: JSON.stringify({ name, shopName, shopDetails }),
      });

      const backendData = await res.json();
      if (!res.ok) throw new Error(backendData.error || 'Failed to create seller profile');

      setMessage('✅ Signup and profile creation successful! You can now login.');
      setIsSuccess(true);
      setForm({ name: '', email: '', password: '', shopName: '', shopDetails: '', token: '' });
      await supabase.auth.signOut(); // Sign out so they can log in via the login page
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 20 }}>
      <h2>Seller Signup</h2>
      {message && (
        <div style={{ padding: 10, marginBottom: 15, borderRadius: 5, backgroundColor: isSuccess ? '#d4edda' : '#f8d7da', color: isSuccess ? '#155724' : '#721c24' }}>
          {message}
        </div>
      )}
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
            placeholder="Shop Name" 
            value={form.shopName} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label htmlFor="shopDetails" style={{ display: 'block', marginBottom: 5 }}>Shop Details (Optional)</label>
          <textarea 
            id="shopDetails" 
            name="shopDetails" 
            placeholder="Describe your shop..." 
            value={form.shopDetails} 
            onChange={handleChange} 
            rows={3}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label htmlFor="token" style={{ display: 'block', marginBottom: 5 }}>Registration Token</label>
          <input 
            id="token" 
            name="token" 
            placeholder="32-character registration token" 
            value={form.token} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
          <small style={{ color: '#666', display: 'block', marginTop: 5 }}>
            You must obtain a registration token from the Seller Admin panel.
          </small>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Creating Account...' : 'Sign Up as Seller'}
        </button>
      </form>
    </div>
  );
}
