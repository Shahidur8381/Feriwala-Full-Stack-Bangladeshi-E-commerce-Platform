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
  deliveryLocation: 'inside_dhaka' | 'outside_dhaka';
  deliveryCharge: number;
  items: any[];
  total: number;
}

const CheckoutPage: React.FC = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { isLoaded, isSignedIn, user } = useUser();  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string>('');

  const [orderData, setOrderData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerEmail: '',
    deliveryLocation: 'inside_dhaka' as 'inside_dhaka' | 'outside_dhaka'
  });

  // Delivery charges
  const DELIVERY_CHARGES = {
    inside_dhaka: 60,
    outside_dhaka: 120
  };

  const deliveryCharge = DELIVERY_CHARGES[orderData.deliveryLocation];
  const totalWithDelivery = cartTotal + deliveryCharge;

  // Redirect if not signed in
  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Pre-fill user data when user is loaded
  React.useEffect(() => {
    if (user) {      setOrderData({
        customerName: user.fullName || '',
        customerPhone: user.phoneNumbers?.[0]?.phoneNumber || '',
        customerAddress: '',
        customerEmail: user.primaryEmailAddress?.emailAddress || '',
        deliveryLocation: 'inside_dhaka'
      });
    }
  }, [user]);
  // Redirect if cart is empty (but not if order was just placed)
  React.useEffect(() => {
    if (isLoaded && cartItems.length === 0 && !orderPlaced) {
      router.push('/cart');
    }
  }, [isLoaded, cartItems.length, orderPlaced, router]);

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

  if (cartItems.length === 0 && !orderPlaced) {
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    
    try {      const order: OrderData = {
        ...orderData,
        deliveryCharge,
        items: cartItems.map(item => ({
          id: item.id,
          title: item.title,
          price: item.discount > 0 && new Date(item.discount_validity) > new Date() 
            ? item.final_price 
            : item.price,
          quantity: item.quantity,
          image: item.image
        })),
        total: totalWithDelivery
      };

      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });      if (response.ok) {
        const result = await response.json();
        clearCart();
        // Set order placed state instead of immediate redirect
        setOrderPlaced(true);
        setPlacedOrderId(result.orderId);
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
        {orderPlaced ? (
          /* Order Success UI */
          <div className="max-w-md mx-auto text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-green-800 mb-2">Order Placed Successfully!</h1>
              <p className="text-green-600 mb-4">
                Your order has been placed successfully. 
                <br />
                Order ID: <span className="font-mono font-semibold">#{placedOrderId.slice(-8)}</span>
              </p>
              <p className="text-gray-600 mb-6">
                Click the button below to proceed with payment for your order.
              </p>
              <button
                onClick={() => router.push(`/payment/${placedOrderId}`)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold mb-4 w-full"
              >
                Pay Now
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View in My Orders
              </button>
            </div>
          </div>
        ) : (
          /* Regular Checkout UI */
          <>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Location *
                </label>
                <select
                  name="deliveryLocation"
                  value={orderData.deliveryLocation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="inside_dhaka">Inside Khulna (৳60)</option>
                  <option value="outside_dhaka">Outside Khulna (৳120)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Delivery charge: ৳{deliveryCharge}
                </p>
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
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge ({orderData.deliveryLocation === 'inside_dhaka' ? 'Inside Khulna' : 'Outside Khulna'})</span>
                <span>৳{deliveryCharge}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total</span>
                <span className="text-blue-600">${totalWithDelivery.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={handlePlaceOrder}
              disabled={isLoading}
              className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Placing Order...' : 'Place Order'}            </button>
          </div>
        </div>
        </>
        )}
      </div>
    </Layout>
  );
};

export default CheckoutPage;
