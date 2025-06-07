import React from "react";
import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import ManageProduct from "./pages/ManageProduct";
import Orders from "./pages/Orders";
import SellerLoginPage from "./pages/SellerLoginPage";
import SellerSignupPage from "./pages/SellerSignupPage";
import SellerProfilePage from "./pages/SellerProfilePage";
import { isLoggedIn, logout } from "./utils/auths";
import { FaHome, FaPlus, FaTasks, FaUser, FaSignOutAlt, FaClipboardList } from "react-icons/fa";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {isLoggedIn() && (
        <nav className="main-nav">
          <div className="nav-brand">
            <h1>Feriwala Admin</h1>
          </div>
          
          <div className="nav-links">
            <Link to="/" className="nav-link">
              <FaHome className="nav-icon" />
              <span>Dashboard</span>
            </Link>
            <Link to="/add-product" className="nav-link">
              <FaPlus className="nav-icon" />
              <span>Add Product</span>
            </Link>
            <Link to="/manage-products" className="nav-link">
              <FaTasks className="nav-icon" />
              <span>Manage Products</span>
            </Link>
            <Link to="/orders" className="nav-link">
              <FaClipboardList className="nav-icon" />
              <span>Orders</span>
            </Link>
            <Link to="/profile" className="nav-link">
              <FaUser className="nav-icon" />
              <span>Profile</span>
            </Link>
          </div>
          
          <button 
            onClick={handleLogout}
            className="btn btn-danger logout-btn"
          >
            <FaSignOutAlt className="nav-icon" />
            <span>Logout</span>
          </button>
        </nav>
      )}

      <div className="content-container">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/add-product" element={
            <ProtectedRoute>
              <AddProduct />
            </ProtectedRoute>
          } />
          <Route path="/manage-products" element={
            <ProtectedRoute>
              <ManageProduct />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/edit/:id" element={
            <ProtectedRoute>
              <EditProduct />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <SellerProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<SellerLoginPage />} />
          <Route path="/signup" element={<SellerSignupPage />} />
        </Routes>
      </div>
      
      <style>{`
        .app-container {
          display: flex;
          min-height: 100vh;
        }
        
        .main-nav {
          width: 250px;
          background-color: var(--dark);
          color: var(--white);
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          overflow-y: auto;
        }
        
        .nav-brand {
          padding: var(--spacing-md) 0;
          margin-bottom: var(--spacing-lg);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .nav-brand h1 {
          font-size: var(--font-size-lg);
          color: var(--white);
          margin: 0;
        }
        
        .nav-links {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          flex-grow: 1;
        }
        
        .nav-link {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          color: var(--light);
          text-decoration: none;
          border-radius: var(--border-radius-sm);
          transition: all var(--transition-fast);
        }
        
        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--white);
        }
        
        .nav-icon {
          font-size: 1.2rem;
        }
        
        .logout-btn {
          margin-top: auto;
          width: 100%;
        }
        
        .content-container {
          flex-grow: 1;
          padding: var(--spacing-lg);
          margin-left: 250px;
          background-color: var(--gray-light);
        }
        
        @media (max-width: 768px) {
          .app-container {
            flex-direction: column;
          }
          
          .main-nav {
            width: 100%;
            height: auto;
            position: relative;
            padding: var(--spacing-sm);
          }
          
          .nav-brand {
            margin-bottom: var(--spacing-sm);
            padding: var(--spacing-sm) 0;
          }
          
          .nav-links {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: var(--spacing-sm);
          }
          
          .nav-link {
            white-space: nowrap;
          }
          
          .logout-btn {
            width: auto;
            margin-top: 0;
          }
          
          .content-container {
            margin-left: 0;
            padding: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
};

export default App;