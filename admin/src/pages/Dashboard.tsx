import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from '../utils/auths';
import { FaEdit, FaTrash, FaCog, FaPlus, FaTools, FaSave, FaTimes, FaChartLine, FaBoxOpen, FaTag, FaShoppingCart } from "react-icons/fa";

interface Product {
  id: number;
  title: string;
  price: number;
  stock: number;
  image: string;
  discount?: number;
  final_price?: number;
  category: string;
  description: string;
  seller_id: number;
}

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempTitle, setTempTitle] = useState("");
  const [tempPrice, setTempPrice] = useState(0);
  const [tempStock, setTempStock] = useState(0);
  const [tempDescription, setTempDescription] = useState("");
  const [currentSellerId, setCurrentSellerId] = useState<number | null>(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    categories: 0,
    averagePrice: 0
  });
  
  const navigate = useNavigate();
  const token = getToken();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    //notification
    
   
    //notification
    const fetchSellerProfile = async () => {
      try {
        const profileRes = await axios.get(
          "http://localhost:5000/api/sellers/profile", 
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setCurrentSellerId(profileRes.data.seller.id);
      } catch (err) {
        console.error('Error fetching seller profile:', err);
      }
    };

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(
          "http://localhost:5000/api/products/my-products", 
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        const productsData = response.data;
        setProducts(productsData);
        
        // Calculate stats
        if (productsData.length > 0) {
          const totalStock = productsData.reduce((sum: number, product: Product) => sum + (product.stock || 0), 0);
          const totalPrice = productsData.reduce((sum: number, product: Product) => sum + product.price, 0);
          const categories = new Set(productsData.map((product: Product) => product.category)).size;
          
          setStats({
            totalProducts: productsData.length,
            totalStock,
            categories,
            averagePrice: totalPrice / productsData.length
          });
        }
      } catch (err) {
        setError('Failed to load products. Please try again.');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProfile();
    fetchProducts();
  }, [navigate, token]);

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setTempTitle(product.title);
    setTempPrice(product.price);
    setTempStock(product.stock);
    setTempDescription(product.description);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveInlineEdit = async (id: number) => {
    try {
      const updatedProduct = {
        title: tempTitle,
        price: tempPrice,
        stock: tempStock,
        description: tempDescription,
        sold: 0
      };
      
      const response = await axios.put(
        `http://localhost:5000/api/products/${id}`, 
        updatedProduct,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      setProducts(products.map(p => 
        p.id === id ? {...p, ...response.data.product} : p
      ));
      
      cancelEditing();
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'toast toast-success';
      successMessage.textContent = 'Product updated successfully!';
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (error) {
      console.error("Failed to update product", error);
      
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'toast toast-error';
      errorMessage.textContent = `Failed to update product: ${(error as any).response?.data?.error || (error as Error).message}`;
      document.body.appendChild(errorMessage);
      
      setTimeout(() => {
        document.body.removeChild(errorMessage);
      }, 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(
          `http://localhost:5000/api/products/${id}`, 
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setProducts(products.filter(p => p.id !== id));
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'toast toast-success';
        successMessage.textContent = 'Product deleted successfully!';
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 3000);
      } catch (error) {
        console.error("Failed to delete product", error);
        
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'toast toast-error';
        errorMessage.textContent = `Failed to delete product: ${(error as any).response?.data?.error || (error as Error).message}`;
        document.body.appendChild(errorMessage);
        
        setTimeout(() => {
          document.body.removeChild(errorMessage);
        }, 3000);
      }
    }
  };

  const isOwner = (product: Product) => {
    return currentSellerId !== null && product.seller_id === currentSellerId;
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Seller Dashboard</h1>
        <p>Welcome to your product management dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <FaBoxOpen />
          </div>
          <div className="stat-content">
            <h3>{stats.totalProducts}</h3>
            <p>Total Products</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaShoppingCart />
          </div>
          <div className="stat-content">
            <h3>{stats.totalStock}</h3>
            <p>Items in Stock</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaTag />
          </div>
          <div className="stat-content">
            <h3>{stats.categories}</h3>
            <p>Categories</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <h3>${stats.averagePrice.toFixed(2)}</h3>
            <p>Average Price</p>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button
          onClick={() => navigate("/add-product")}
          className="btn btn-primary"
        >
          <FaPlus className="icon" />
          Add New Product
        </button>
        <button
          onClick={() => navigate("/manage-products")}
          className="btn btn-secondary"
        >
          <FaTools className="icon" />
          Manage Products
        </button>
      </div>

      <div className="products-section">
        <h2>Your Products</h2>
        
        {loading ? (
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p>Loading your products...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products found</p>
            <button
              onClick={() => navigate("/add-product")}
              className="btn btn-primary"
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div 
                key={product.id}
                className={`product-card ${editingId === product.id ? 'editing' : ''}`}
              >
                {editingId === product.id ? (
                  <div className="edit-form">
                    <div className="form-group">
                      <label>Title:</label>
                      <input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        required
                        className="form-control"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Price ($):</label>
                      <input
                        type="number"
                        value={tempPrice}
                        min={0}
                        step={0.01}
                        onChange={(e) => setTempPrice(parseFloat(e.target.value))}
                        required
                        className="form-control"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Stock:</label>
                      <input
                        type="number"
                        value={tempStock}
                        min={0}
                        onChange={(e) => setTempStock(parseInt(e.target.value))}
                        required
                        className="form-control"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Description:</label>
                      <textarea
                        value={tempDescription}
                        onChange={(e) => setTempDescription(e.target.value)}
                        rows={3}
                        className="form-control"
                      />
                    </div>
                    
                    <div className="form-actions">
                      <button
                        onClick={() => saveInlineEdit(product.id)}
                        className="btn btn-success"
                      >
                        <FaSave className="icon" />
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="btn btn-light"
                      >
                        <FaTimes className="icon" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="product-image">
                      <img 
                        src={`http://localhost:5000${product.image}`} 
                        alt={product.title} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                        }}
                      />
                    </div>
                    
                    <div className="product-details">
                      <h3>{product.title}</h3>
                      
                      <div className="detail-row">
                        <span className="label">Price:</span>
                        <span className="value">
                          ${product.price.toFixed(2)}
                          {product.discount && product.discount > 0 && (
                            <span className="discount">
                              (-{product.discount}%)
                            </span>
                          )}
                        </span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="label">Stock:</span>
                        <span className="value">{product.stock} units</span>
                      </div>
                      
                      <div className="detail-row description">
                        <span className="label">Description:</span>
                        <p>{product.description}</p>
                      </div>
                      
                      <div className="detail-row">
                        <span className="label">Category:</span>
                        <span className="category-tag">
                          {product.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="product-actions">
                      {isOwner(product) ? (
                        <>
                          <button
                            onClick={() => startEditing(product)}
                            className="btn btn-warning"
                          >
                            <FaEdit className="icon" />
                            Quick Edit
                          </button>
                          
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="btn btn-danger"
                          >
                            <FaTrash className="icon" />
                            Delete
                          </button>
                          
                          <button
                            onClick={() => navigate(`/edit/${product.id}`)}
                            className="btn btn-info"
                          >
                            <FaCog className="icon" />
                            Advanced
                          </button>
                        </>
                      ) : (
                        <div className="not-owned">
                          <p>You don't own this product</p>
                          <button
                            onClick={() => navigate(`/product/${product.id}`)}
                            className="btn btn-primary"
                          >
                            View Product
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .dashboard-container {
          padding: var(--spacing-lg);
        }
        
        .dashboard-header {
          margin-bottom: var(--spacing-xl);
          text-align: center;
        }
        
        .dashboard-header h1 {
          font-size: var(--font-size-xxl);
          margin-bottom: var(--spacing-xs);
          color: var(--dark);
        }
        
        .dashboard-header p {
          font-size: var(--font-size-lg);
          color: var(--gray-dark);
        }
        
        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }
        
        .stat-card {
          background-color: var(--white);
          border-radius: var(--border-radius-md);
          padding: var(--spacing-md);
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-md);
        }
        
        .stat-icon {
          font-size: 2.5rem;
          color: var(--primary);
          margin-right: var(--spacing-md);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          background-color: rgba(52, 152, 219, 0.1);
          border-radius: 50%;
        }
        
        .stat-content h3 {
          font-size: var(--font-size-xl);
          margin-bottom: 0;
          color: var(--dark);
        }
        
        .stat-content p {
          margin: 0;
          color: var(--gray-dark);
        }
        
        .action-buttons {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
          flex-wrap: wrap;
        }
        
        .products-section h2 {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-lg);
          color: var(--dark);
          border-bottom: 2px solid var(--light);
          padding-bottom: var(--spacing-sm);
        }
        
        .loading-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: var(--spacing-xl) 0;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 5px solid rgba(0,0,0,0.1);
          border-left-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--spacing-md);
        }
        
        .error-message {
          background-color: #ffebee;
          color: var(--danger);
          padding: var(--spacing-md);
          border-radius: var(--border-radius-md);
          margin: var(--spacing-md) 0;
          text-align: center;
        }
        
        .empty-state {
          text-align: center;
          padding: var(--spacing-xl);
          background-color: var(--gray-light);
          border-radius: var(--border-radius-md);
          margin: var(--spacing-md) 0;
        }
        
        .empty-state p {
          font-size: var(--font-size-lg);
          margin-bottom: var(--spacing-md);
          color: var(--gray-dark);
        }
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--spacing-lg);
          margin-top: var(--spacing-md);
        }
        
        .product-card {
          border: 1px solid var(--light);
          border-radius: var(--border-radius-md);
          overflow: hidden;
          background-color: var(--white);
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-sm);
        }
        
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-md);
        }
        
        .product-card.editing {
          transform: translateY(0);
          box-shadow: 0 0 0 3px var(--primary);
        }
        
        .product-image {
          height: 200px;
          overflow: hidden;
          background-color: var(--gray-light);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background-color: var(--gray-light);
        }
        
        .product-details {
          padding: var(--spacing-md);
        }
        
        .product-details h3 {
          margin: 0 0 var(--spacing-md);
          font-size: var(--font-size-lg);
          color: var(--dark);
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--spacing-sm);
        }
        
        .label {
          font-weight: 600;
          color: var(--gray-dark);
        }
        
        .value {
          color: var(--dark);
          text-align: right;
        }
        
        .discount {
          color: var(--secondary);
          margin-left: var(--spacing-xs);
          font-weight: 600;
        }
        
        .description p {
          color: var(--gray-dark);
          margin: var(--spacing-xs) 0 0;
          font-size: 0.95rem;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .category-tag {
          background-color: rgba(52, 152, 219, 0.1);
          color: var(--primary);
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.85rem;
        }
        
        .product-actions {
          padding: var(--spacing-md);
          background-color: var(--gray-light);
          border-top: 1px solid var(--light);
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }
        
        .form-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-sm);
        }
        
        .not-owned {
          text-align: center;
          padding: var(--spacing-sm);
          width: 100%;
        }
        
        .not-owned p {
          color: var(--danger);
          font-weight: 600;
          margin-bottom: var(--spacing-sm);
        }
        
        .icon {
          font-size: 0.9rem;
          margin-right: var(--spacing-xs);
        }
        
        .toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 15px 25px;
          border-radius: 4px;
          color: white;
          font-weight: bold;
          z-index: 1000;
          animation: slideIn 0.3s, fadeOut 0.5s 2.5s;
          max-width: 350px;
        }
        
        .toast-success {
          background-color: var(--secondary);
        }
        
        .toast-error {
          background-color: var(--danger);
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .products-grid {
            grid-template-columns: 1fr;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
            justify-content: center;
          }
          
          .product-actions {
            flex-direction: column;
          }
          
          .stats-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 576px) {
          .stats-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
