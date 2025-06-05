import React, { useState } from 'react';
import { setToken } from '../utils/auths';
import { FaSignInAlt, FaSpinner } from 'react-icons/fa';

interface SellerLoginProps {
  onLoginSuccess?: () => void;
}

export default function SellerLogin({ onLoginSuccess }: SellerLoginProps) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { email, password } = form;
    if (!email || !password) {
      setMessage('Email and password are required');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/sellers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setToken(data.token);
      setMessage('Login successful');
      setIsSuccess(true);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'An error occurred');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="card">
        <div className="card-header text-center">
          <h2>Seller Login</h2>
        </div>
        
        <div className="card-body">
          {message && (
            <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'} mb-3`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="icon-spin mr-2" />
                  Logging in...
                </>
              ) : (
                <>
                  <FaSignInAlt className="mr-2" />
                  Login
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      
      <style>{`
        .login-container {
          max-width: 400px;
          margin: 40px auto;
        }
        
        .icon-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
