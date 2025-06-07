import React, { useState, useEffect } from 'react';
import './App.css';

interface TokenData {
  id: number;
  token: string;
  created_at: string;
  is_active: boolean;
}

function App() {
  const [currentToken, setCurrentToken] = useState<string>('');
  const [tokenHistory, setTokenHistory] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Generate a 32-digit random token
  const generateToken = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Fetch current active token from database
  const fetchCurrentToken = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/seller-admin/token');
      if (response.ok) {
        const data = await response.json();
        setCurrentToken(data.token || '');
      }
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };

  // Fetch token history
  const fetchTokenHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/seller-admin/tokens/history');
      if (response.ok) {
        const data = await response.json();
        setTokenHistory(data);
      }
    } catch (error) {
      console.error('Error fetching token history:', error);
    }
  };

  // Generate and save new token
  const handleGenerateToken = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const newToken = generateToken();
      
      const response = await fetch('http://localhost:5000/api/seller-admin/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: newToken }),
      });

      if (response.ok) {
        setCurrentToken(newToken);
        setMessage('New token generated successfully!');
        fetchTokenHistory(); // Refresh history
      } else {
        throw new Error('Failed to save token');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      setMessage('Error generating token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Copy token to clipboard
  const copyToClipboard = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setMessage('Token copied to clipboard!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      setMessage('Error copying to clipboard');
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCurrentToken();
    fetchTokenHistory();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <header>
          <h1>🔐 Seller Admin Token Generator</h1>
          <p>Generate secure 32-digit tokens for seller registration access</p>
        </header>

        <main>
          {/* Current Active Token */}
          <section className="current-token-section">
            <h2>Current Active Token</h2>
            {currentToken ? (
              <div className="token-display">
                <div className="token-value">
                  <code>{currentToken}</code>
                  <button 
                    onClick={() => copyToClipboard(currentToken)}
                    className="copy-btn"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>
            ) : (
              <p className="no-token">No active token found. Generate one below.</p>
            )}
          </section>

          {/* Generate New Token */}
          <section className="generate-section">
            <button 
              onClick={handleGenerateToken}
              disabled={loading}
              className="generate-btn"
            >
              {loading ? 'Generating...' : 'Generate New Token'}
            </button>
            
            {message && (
              <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}
          </section>

          {/* Token History */}
          <section className="history-section">
            <h2>Token History</h2>
            {tokenHistory.length > 0 ? (
              <div className="token-history">
                {tokenHistory.map((tokenData) => (
                  <div key={tokenData.id} className={`token-item ${tokenData.is_active ? 'active' : 'inactive'}`}>
                    <div className="token-info">
                      <code>{tokenData.token}</code>
                      <span className="token-meta">
                        Created: {new Date(tokenData.created_at).toLocaleString()}
                        {tokenData.is_active && <span className="active-badge">Active</span>}
                      </span>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(tokenData.token)}
                      className="copy-btn small"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-history">No token history available.</p>
            )}
          </section>
        </main>

        <footer>
          <p>⚠️ Keep these tokens secure. Only share with authorized personnel.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
