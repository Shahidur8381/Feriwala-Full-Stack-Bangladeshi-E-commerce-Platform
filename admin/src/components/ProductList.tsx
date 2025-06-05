import React from "react";
import { FaEdit, FaTrash, FaTag, FaBox, FaTruck } from "react-icons/fa";

interface Product {
  id: number;
  title: string;
  price: number;
  discount?: number;
  final_price?: number;
  category: string;
  brand?: string;
  stock?: number;
  image?: string;
  deliverycharge_inside?: number;
  deliverycharge_outside?: number;
  shopname?: string;
  shopdetails?: string;
}

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
}

const ProductList: React.FC<Props> = ({ products, onEdit, onDelete }) => {
  return (
    <div className="product-list">
      {products.map((product) => (
        <div key={product.id} className="card product-card mb-3">
          <div className="card-body">
            <div className="d-flex">
              {product.image && (
                <div className="product-image">
                  <img 
                    src={`http://localhost:5000${product.image}`} 
                    alt={product.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                    }}
                  />
                </div>
              )}
              
              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                
                <div className="product-details">
                  <div className="detail-item">
                    <span className="detail-label">Price:</span> 
                    <span className="detail-value">${product.price.toFixed(2)}</span>
                    
                    {(product.discount || 0) > 0 && (
                      <span className="discount-badge">
                        {product.discount}% OFF
                      </span>
                    )}
                  </div>
                  
                  {(product.discount || 0) > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Final Price:</span> 
                      <span className="detail-value final-price">
                        ${product.final_price?.toFixed(2) || 
                          (product.price - (product.price * (product.discount || 0)) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div className="detail-item">
                    <span className="detail-label"><FaTag className="icon" /> Category:</span> 
                    <span className="detail-value">{product.category}</span>
                    
                    {product.brand && (
                      <span className="detail-value">
                        <span className="detail-divider">|</span> 
                        <span className="detail-label">Brand:</span> {product.brand}
                      </span>
                    )}
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label"><FaBox className="icon" /> Stock:</span> 
                    <span className="detail-value">{product.stock || 0} units</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label"><FaTruck className="icon" /> Delivery:</span> 
                    <span className="detail-value">
                      Inside: ${product.deliverycharge_inside?.toFixed(2) || "0.00"} | 
                      Outside: ${product.deliverycharge_outside?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="product-actions mt-3">
              <button 
                onClick={() => onEdit(product)}
                className="btn btn-warning"
              >
                <FaEdit className="icon" /> Edit
              </button>
              <button 
                onClick={() => onDelete(product.id)}
                className="btn btn-danger ml-2"
              >
                <FaTrash className="icon" /> Delete
              </button>
            </div>
          </div>
        </div>
      ))}
      
      <style >{`
        .product-list {
          margin-top: var(--spacing-md);
        }
        
        .product-card {
          transition: transform var(--transition-fast);
        }
        
        .product-card:hover {
          transform: translateY(-5px);
        }
        
        .product-image {
          width: 120px;
          height: 120px;
          border-radius: var(--border-radius-sm);
          overflow: hidden;
          margin-right: var(--spacing-md);
          background-color: var(--gray-light);
        }
        
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .product-info {
          flex: 1;
        }
        
        .product-title {
          margin: 0 0 var(--spacing-sm);
          color: var(--dark);
        }
        
        .product-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }
        
        .detail-item {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
        }
        
        .detail-label {
          font-weight: 600;
          color: var(--gray-dark);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .detail-value {
          color: var(--dark);
        }
        
        .detail-divider {
          margin: 0 var(--spacing-xs);
          color: var(--gray);
        }
        
        .discount-badge {
          background-color: var(--secondary);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          margin-left: var(--spacing-sm);
        }
        
        .final-price {
          font-weight: 600;
          color: var(--secondary-dark);
        }
        
        .product-actions {
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid var(--gray-light);
          padding-top: var(--spacing-sm);
        }
        
        .icon {
          font-size: 0.9rem;
        }
        
        @media (max-width: 576px) {
          .product-image {
            width: 80px;
            height: 80px;
          }
          
          .product-actions {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductList;