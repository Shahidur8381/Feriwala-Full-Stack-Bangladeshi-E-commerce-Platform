import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useCart } from '../contexts/CartContext';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import Image from 'next/image';

interface OrderData {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail: string;
  items: any[];
  total: number;
}

const CheckoutPage: React.FC = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerEmail: ''
  });

  // Redirect if not signed in
  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Pre-fill user data when user is loaded
  React.useEffect(() => {
    if (user) {
      setOrderData({
        customerName: user.fullName || '',
        customerPhone: user.phoneNumbers?.[0]?.phoneNumber || '',
        customerAddress: '',
        customerEmail: user.primaryEmailAddress?.emailAddress || ''
      });
    }
  }, [user]);

  // Redirect if cart is empty
  React.useEffect(() => {
    if (isLoaded && cartItems.length === 0) {
      router.push('/cart');
    }
  }, [isLoaded, cartItems.length, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <button 
              onClick={() => router.push('/products')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlaceOrder = async () => {
    // Validate required fields
    if (!orderData.customerName || !orderData.customerPhone || !orderData.customerAddress) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const order: OrderData = {
        ...orderData,
        items: cartItems.map(item => ({
          id: item.id,
          title: item.title,
          price: item.discount > 0 && new Date(item.discount_validity) > new Date() 
            ? item.final_price 
            : item.price,
          quantity: item.quantity,
          image: item.image
        })),
        total: cartTotal
      };

      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });

      if (response.ok) {
        const result = await response.json();
        clearCart();
        router.push(`/orders/${result.orderId}`);
      } else {
        throw new Error('Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={orderData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={orderData.customerEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={orderData.customerPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address *
                </label>
                <textarea
                  name="customerAddress"
                  value={orderData.customerAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your complete delivery address"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cartItems.map(item => {
                const itemPrice = item.discount > 0 && new Date(item.discount_validity) > new Date() 
                  ? item.final_price 
                  : item.price;
                const itemTotal = itemPrice * item.quantity;
                
                return (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="h-16 w-16 relative flex-shrink-0">
                      <Image 
                        src={item.image 
                          ? `http://localhost:5000${item.image}` 
                          : '/imageWhenNoImage/NoImage.jpg'} 
                        alt={item.title}
                        fill={true}
                        sizes="64px"
                        style={{ objectFit: 'cover' }}
                        className="rounded-md"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{item.title}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">${itemTotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-blue-600">${cartTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={handlePlaceOrder}
              disabled={isLoading}
              className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
