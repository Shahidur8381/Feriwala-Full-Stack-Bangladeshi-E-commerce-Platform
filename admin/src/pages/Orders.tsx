import React, { useState, useEffect } from "react";
import axios from "axios";
import { getToken } from "../utils/auths";
import { FaEye, FaCheck, FaTruck, FaBox, FaShippingFast } from "react-icons/fa";

interface Order {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail: string;
  deliveryLocation: string;
  deliveryCharge: number;
  total: number;
  status: string;
  createdAt: string;
  items: string;
  paymentMethod?: string;
  paymentAccount?: string;
  transactionId?: string;
  paymentStatus?: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const statusOptions = [
    { value: 'unpaid', label: 'Unpaid', color: '#dc3545' },
    { value: 'pending', label: 'Pending', color: '#ffc107' },
    { value: 'paid', label: 'Paid', color: '#28a745' },
    { value: 'ready_to_ship', label: 'Ready to Ship', color: '#17a2b8' },
    { value: 'shipped', label: 'Shipped', color: '#6f42c1' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: '#fd7e14' },
    { value: 'delivered', label: 'Delivered', color: '#20c997' }
  ];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await axios.get("http://localhost:5000/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      alert("Failed to fetch orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      const token = getToken();
      await axios.patch(
        `http://localhost:5000/api/admin/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchOrders();
      alert("Order status updated successfully!");
    } catch (error) {
      console.error("Failed to update order status", error);
      alert("Failed to update order status. Please try again.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : '#6c757d';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <FaCheck />;
      case 'ready_to_ship':
        return <FaBox />;
      case 'shipped':
        return <FaTruck />;
      case 'out_for_delivery':
        return <FaShippingFast />;
      case 'delivered':
        return <FaCheck />;
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>Order Management</h1>
        <div className="order-stats">
          <div className="stat-card">
            <h3>{orders.length}</h3>
            <p>Total Orders</p>
          </div>
          <div className="stat-card">
            <h3>{orders.filter(o => o.status === 'pending').length}</h3>
            <p>Pending Orders</p>
          </div>
          <div className="stat-card">
            <h3>{orders.filter(o => o.status === 'delivered').length}</h3>
            <p>Delivered</p>
          </div>
        </div>
      </div>

      <div className="orders-controls">
        <div className="filter-section">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Orders</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.orderId}>
                  <td className="order-id">#{order.orderId.slice(-8)}</td>
                  <td>
                    <div className="customer-info">
                      <strong>{order.customerName}</strong>
                      <br />
                      <small>{order.customerPhone}</small>
                    </div>
                  </td>
                  <td className="items-cell">
                    <div className="items-preview">
                      {order.items ? order.items.substring(0, 50) + (order.items.length > 50 ? '...' : '') : 'No items'}
                    </div>
                  </td>
                  <td className="total">৳{order.total}</td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusIcon(order.status)}
                      {statusOptions.find(s => s.value === order.status)?.label || order.status}
                    </span>
                  </td>
                  <td>
                    {order.paymentMethod ? (
                      <div className="payment-info">
                        <strong>{order.paymentMethod.toUpperCase()}</strong>
                        <br />
                        <small>{order.transactionId}</small>
                      </div>
                    ) : (
                      <span className="no-payment">No payment info</span>
                    )}
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowModal(true);
                        }}
                        className="btn btn-sm btn-info"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                        disabled={updatingStatus === order.orderId}
                        className="status-select"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="no-orders">
              {statusFilter === 'all' ? 'No orders found.' : `No ${statusOptions.find(s => s.value === statusFilter)?.label.toLowerCase()} orders found.`}
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details - #{selectedOrder.orderId.slice(-8)}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="order-details-grid">
                <div className="detail-section">
                  <h3>Customer Information</h3>
                  <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                  <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                  <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                  <p><strong>Address:</strong> {selectedOrder.customerAddress}</p>
                  <p><strong>Delivery Location:</strong> {selectedOrder.deliveryLocation}</p>
                </div>

                <div className="detail-section">
                  <h3>Order Information</h3>
                  <p><strong>Order ID:</strong> {selectedOrder.orderId}</p>
                  <p><strong>Status:</strong> 
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                    >
                      {statusOptions.find(s => s.value === selectedOrder.status)?.label || selectedOrder.status}
                    </span>
                  </p>
                  <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  <p><strong>Delivery Charge:</strong> ৳{selectedOrder.deliveryCharge}</p>
                  <p><strong>Total:</strong> ৳{selectedOrder.total}</p>
                </div>

                {selectedOrder.paymentMethod && (
                  <div className="detail-section">
                    <h3>Payment Information</h3>
                    <p><strong>Method:</strong> {selectedOrder.paymentMethod.toUpperCase()}</p>
                    <p><strong>Account:</strong> {selectedOrder.paymentAccount}</p>
                    <p><strong>Transaction ID:</strong> {selectedOrder.transactionId}</p>
                    <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus || 'N/A'}</p>
                  </div>
                )}

                <div className="detail-section full-width">
                  <h3>Items Ordered</h3>
                  <p>{selectedOrder.items}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .orders-page {
          padding: 20px;
        }

        .page-header {
          margin-bottom: 30px;
        }

        .page-header h1 {
          margin-bottom: 20px;
          color: #333;
        }

        .order-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
          min-width: 120px;
        }

        .stat-card h3 {
          margin: 0 0 5px 0;
          font-size: 2rem;
          color: #007bff;
        }

        .stat-card p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .orders-controls {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .filter-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-section label {
          font-weight: 500;
        }

        .form-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .orders-table-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow-x: auto;
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
        }

        .orders-table th {
          background: #f8f9fa;
          padding: 15px 10px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #dee2e6;
          white-space: nowrap;
        }

        .orders-table td {
          padding: 15px 10px;
          border-bottom: 1px solid #dee2e6;
          vertical-align: top;
        }

        .orders-table tr:hover {
          background: #f8f9fa;
        }

        .order-id {
          font-family: monospace;
          font-weight: 600;
          color: #007bff;
        }

        .customer-info strong {
          color: #333;
        }

        .customer-info small {
          color: #666;
        }

        .items-cell {
          max-width: 200px;
        }

        .items-preview {
          font-size: 0.9rem;
          color: #666;
        }

        .total {
          font-weight: 600;
          color: #28a745;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .payment-info strong {
          color: #333;
        }

        .payment-info small {
          color: #666;
          font-family: monospace;
        }

        .no-payment {
          color: #999;
          font-style: italic;
        }

        .action-buttons {
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .btn {
          border: none;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.85rem;
        }

        .btn-sm {
          padding: 4px 8px;
          font-size: 0.8rem;
        }

        .btn-info {
          background: #17a2b8;
          color: white;
        }

        .btn-info:hover {
          background: #138496;
        }

        .status-select {
          padding: 4px 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.8rem;
          max-width: 120px;
        }

        .no-orders {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
        }

        .modal-header h2 {
          margin: 0;
          color: #333;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: #333;
        }

        .modal-body {
          padding: 20px;
        }

        .order-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .detail-section {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
        }

        .detail-section.full-width {
          grid-column: 1 / -1;
        }

        .detail-section h3 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 1.1rem;
          border-bottom: 2px solid #007bff;
          padding-bottom: 5px;
        }

        .detail-section p {
          margin: 8px 0;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .orders-page {
            padding: 10px;
          }

          .order-stats {
            flex-direction: column;
          }

          .orders-table {
            font-size: 0.9rem;
          }

          .orders-table th,
          .orders-table td {
            padding: 10px 5px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .order-details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Orders;
