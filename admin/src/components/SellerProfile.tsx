import React, { useEffect, useState, useCallback } from 'react';
import { validateEmail, validatePassword } from '../utils/validations';
import { getToken } from '../utils/auths';

interface SellerData {
  id: number;
  name: string;
  email: string;
  shopName?: string;
  shopDetails?: string;
}

interface ProfileResponse {
  seller: SellerData;
}

const API_BASE = 'http://localhost:5000';


export default function SellerProfile() {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '',
    shopName: '',
    shopDetails: ''
  });

  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const token = getToken();

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sellers/profile`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Fetch profile error:', errorData);
        throw new Error(errorData?.error || 'Failed to fetch profile');
      }
      

      const data: ProfileResponse = await res.json();
      setForm(prev => ({
        ...prev,
        name: data.seller.name,
        email: data.seller.email,
        shopName: data.seller.shopName || '',
        shopDetails: data.seller.shopDetails || ''
      }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to load profile');
      setIsSuccess(false);
    } finally {
      setFetchLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [fetchProfile, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { name, email, password, shopName, shopDetails } = form;

    if (!name || !email || !shopName) {
      setMessage('Name, email, and shop name are required');
      setIsSuccess(false);
      return;
    }

    if (!validateEmail(email)) {
      setMessage('Invalid email format');
      setIsSuccess(false);
      return;
    }

    if (password && !validatePassword(password)) {
      setMessage('Password must be at least 8 chars and include uppercase, lowercase, digit, and special char');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    try {
      const sellerBody: Partial<SellerData> = { name, email, shopName, shopDetails };
      if (password) {
        (sellerBody as any).password = password; // Add password only if provided
      }

      const body = { seller: sellerBody };

      const res = await fetch(`${API_BASE}/api/sellers/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setMessage('✅ Profile updated successfully');
      setIsSuccess(true);
      setForm(prev => ({ ...prev, password: '' }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'An error occurred');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <div>Loading profile...</div>;

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate>
        {message && (
          <div style={{ 
            padding: '10px', 
            marginBottom: '15px', 
            backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
            color: isSuccess ? '#155724' : '#721c24',
            borderRadius: '4px'
          }}>
            {message}
          </div>
        )}

        {/* Form Fields */}
        {[
          { label: 'Name', type: 'text', name: 'name' },
          { label: 'Email', type: 'email', name: 'email' },
          { label: 'Password (leave blank to keep current)', type: 'password', name: 'password' },
          { label: 'Shop Name', type: 'text', name: 'shopName' },
        ].map(({ label, type, name }) => (
          <div key={name} style={{ marginBottom: '15px' }}>
            <label htmlFor={name} style={{ display: 'block', marginBottom: '5px' }}>{label}</label>
            <input
              type={type}
              id={name}
              name={name}
              value={form[name as keyof typeof form]}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              aria-label={label}
            />
          </div>
        ))}

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="shopDetails" style={{ display: 'block', marginBottom: '5px' }}>Shop Details</label>
          <textarea
            id="shopDetails"
            name="shopDetails"
            value={form.shopDetails}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '100px' }}
            aria-label="Shop Details"
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
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}
