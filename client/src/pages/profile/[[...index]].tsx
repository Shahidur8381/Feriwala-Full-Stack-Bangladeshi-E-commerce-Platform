import React, { useState, useEffect } from 'react';
import { useUser, UserProfile } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ReviewForm from '../../components/ReviewForm';
import { getOrderStatus, getStatusBadgeClasses, getStatusProgress } from '../../utils/orderStatus';

interface Order {
  orderId: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: number;
  productId: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

const ProfilePage: React.FC = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedReviewProduct, setSelectedReviewProduct] = useState<{
    orderId: string;
    productId: number;
    productTitle: string;
  } | null>(null);
  // Redirect if not signed in
  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Fetch user orders
  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      fetchOrders(user.primaryEmailAddress.emailAddress);
    }
  }, [user]);
  const fetchOrders = async (email: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/customer/${email}`);
      if (response.ok) {
        const ordersData = await response.json();
        // Fetch order items for each order
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order: Order) => {
            try {
              const itemsResponse = await fetch(`http://localhost:5000/api/orders/${order.orderId}/items`);
              if (itemsResponse.ok) {
                const items = await itemsResponse.json();
                return { ...order, items };
              }
              return order;
            } catch (error) {
              console.error('Error fetching order items:', error);
              return order;
            }
          })
        );
        setOrders(ordersWithItems);
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleReviewClick = (orderId: string, productId: number, productTitle: string) => {
    setSelectedReviewProduct({ orderId, productId, productTitle });
    setShowReviewForm(true);
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setSelectedReviewProduct(null);
    // Optionally refresh orders to update any review status
  };

  const handleReviewCancel = () => {
    setShowReviewForm(false);
    setSelectedReviewProduct(null);
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-32 h-32 rounded-full overflow-hidden">
              <img 
                src={user.imageUrl} 
                alt={user.fullName || 'Profile'} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">{user.fullName}</h1>
              <p className="text-gray-600 mb-4">{user.primaryEmailAddress?.emailAddress}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Account Information</h2>
                  <p><span className="font-medium">User ID:</span> {user.id}</p>
                  <p><span className="font-medium">Created:</span> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clerk's built-in profile management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Manage Account</h2>
          <UserProfile routing="path" path="/profile" />
        </div>        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Order History</h2>
          {loadingOrders ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>You haven't placed any orders yet.</p>
              <button 
                onClick={() => router.push('/products')}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Start Shopping
              </button>
            </div>          ) : (            <div className="space-y-6">
              {orders.map(order => {
                const statusInfo = getOrderStatus(order.status);
                const progress = getStatusProgress(order.status);
                
                return (
                  <div key={order.orderId} className="border rounded-lg p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-lg">Order #{order.orderId.substring(0, 8)}...</h3>
                        <p className="text-sm text-gray-600">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-lg font-semibold text-gray-800">Total: ${order.total.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <span className={getStatusBadgeClasses(order.status)}>
                          <span className="mr-1">{statusInfo.icon}</span>
                          {statusInfo.label}
                        </span>
                        <div className="mt-2 space-y-1">
                          <button
                            onClick={() => router.push(`/orders/${order.orderId}`)}
                            className="block text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Details
                          </button>
                          {order.status === 'unpaid' && (
                            <button
                              onClick={() => router.push(`/payment/${order.orderId}`)}
                              className="block bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              Pay Now
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Order Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Order Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-4">{statusInfo.description}</p>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Order Items:</h4>
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                                  <img 
                                    src={item.image 
                                      ? `http://localhost:5000${item.image}` 
                                      : '/imageWhenNoImage/NoImage.jpg'} 
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{item.title}</p>
                                  <p className="text-xs text-gray-600">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                                </div>
                              </div>
                              
                              {/* Review button for delivered orders */}
                              {order.status === 'delivered' && (
                                <button
                                  onClick={() => handleReviewClick(order.orderId, item.productId, item.title)}
                                  className="bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600"
                                >
                                  Write Review
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>          )}
        </div>

        {/* Review Form Modal */}
        {showReviewForm && selectedReviewProduct && (
          <ReviewForm
            orderId={selectedReviewProduct.orderId}
            productId={selectedReviewProduct.productId}
            productTitle={selectedReviewProduct.productTitle}
            onReviewSubmitted={handleReviewSubmitted}
            onCancel={handleReviewCancel}
          />
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
