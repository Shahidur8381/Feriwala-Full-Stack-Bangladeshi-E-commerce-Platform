import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import Layout from '../../components/Layout';

interface PaymentData {
  paymentMethod: string;
  paymentAccount: string;
  transactionId: string;
}

interface Order {
  orderId: string;
  total: number;
  deliveryCharge: number;
  customerName: string;
  status: string;
}

const PaymentPage: React.FC = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const { isLoaded, isSignedIn, user } = useUser();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    paymentMethod: '',
    paymentAccount: '',
    transactionId: ''
  });

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Fetch order details
  useEffect(() => {
    if (orderId && user?.primaryEmailAddress?.emailAddress) {
      fetchOrder(orderId as string, user.primaryEmailAddress.emailAddress);
    }
  }, [orderId, user]);

  const fetchOrder = async (orderIdParam: string, email: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderIdParam}`);
      if (response.ok) {
        const orderData = await response.json();
        
        // Verify the order belongs to the current user
        if (orderData.customerEmail !== email) {
          router.push('/profile');
          return;
        }
        
        // Check if order is eligible for payment
        if (orderData.status !== 'unpaid') {
          router.push(`/orders/${orderIdParam}`);
          return;
        }
        
        setOrder(orderData);
      } else {
        console.error('Failed to fetch order');
        router.push('/profile');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      router.push('/profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PaymentData, value: string) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentData.paymentMethod || !paymentData.paymentAccount || !paymentData.transactionId) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Payment information submitted successfully! Your order status has been updated to pending.');
        router.push(`/orders/${orderId}`);
      } else {
        const error = await response.json();
        alert(`Payment submission failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Failed to submit payment information. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isSignedIn || !order) {
    return null;
  }

  const paymentMethods = [
    { value: 'bkash', label: 'bKash', icon: '📱' },
    { value: 'nagad', label: 'Nagad', icon: '💳' },
    { value: 'rocket', label: 'Rocket', icon: '🚀' },
    { value: 'upay', label: 'Upay', icon: '💰' },
    { value: 'visa', label: 'Visa Card', icon: '💳' },
    { value: 'mastercard', label: 'Mastercard', icon: '💳' }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4">Complete Payment</h1>
            <div className="border-l-4 border-blue-500 pl-4 mb-4">
              <p className="text-sm text-gray-600">Order ID: {order.orderId}</p>
              <p className="text-lg font-semibold">
                Total Amount: <span className="text-green-600">${order.total.toFixed(2)}</span>
              </p>
              {order.deliveryCharge > 0 && (
                <p className="text-sm text-gray-600">
                  (Including delivery charge: ${order.deliveryCharge.toFixed(2)})
                </p>
              )}
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Payment Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {paymentMethods.map(method => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => handleInputChange('paymentMethod', method.value)}
                      className={`p-3 border rounded-lg text-center transition-all ${
                        paymentData.paymentMethod === method.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">{method.icon}</div>
                      <div className="text-sm font-medium">{method.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Number / Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {paymentData.paymentMethod === 'visa' || paymentData.paymentMethod === 'mastercard'
                    ? 'Card Number'
                    : 'Mobile Number'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentData.paymentAccount}
                  onChange={(e) => handleInputChange('paymentAccount', e.target.value)}
                  placeholder={
                    paymentData.paymentMethod === 'visa' || paymentData.paymentMethod === 'mastercard'
                      ? 'Enter your card number'
                      : 'Enter your mobile number'
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentData.transactionId}
                  onChange={(e) => handleInputChange('transactionId', e.target.value)}
                  placeholder="Enter transaction ID from your payment"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  You will receive this ID after completing the payment through your chosen method
                </p>
              </div>

              {/* Payment Instructions */}
              {paymentData.paymentMethod && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-2">Payment Instructions:</h3>
                  <div className="text-sm text-yellow-700">
                    {paymentData.paymentMethod === 'bkash' && (
                      <div>
                        <p>1. Dial *247# or open bKash app</p>
                        <p>2. Select "Send Money"</p>
                        <p>3. Enter merchant number: 01XXXXXXXXX</p>
                        <p>4. Enter amount: ${order.total.toFixed(2)}</p>
                        <p>5. Enter reference: Order-{order.orderId.substring(0, 8)}</p>
                        <p>6. Complete the payment and enter the transaction ID below</p>
                      </div>
                    )}
                    {paymentData.paymentMethod === 'nagad' && (
                      <div>
                        <p>1. Dial *167# or open Nagad app</p>
                        <p>2. Select "Send Money"</p>
                        <p>3. Enter merchant number: 01XXXXXXXXX</p>
                        <p>4. Enter amount: ${order.total.toFixed(2)}</p>
                        <p>5. Complete the payment and enter the transaction ID below</p>
                      </div>
                    )}
                    {(paymentData.paymentMethod === 'rocket' || paymentData.paymentMethod === 'upay') && (
                      <div>
                        <p>1. Open your {paymentData.paymentMethod} app</p>
                        <p>2. Select "Send Money"</p>
                        <p>3. Enter merchant number: 01XXXXXXXXX</p>
                        <p>4. Enter amount: ${order.total.toFixed(2)}</p>
                        <p>5. Complete the payment and enter the transaction ID below</p>
                      </div>
                    )}
                    {(paymentData.paymentMethod === 'visa' || paymentData.paymentMethod === 'mastercard') && (
                      <div>
                        <p>1. Use your card for online payment</p>
                        <p>2. Amount: ${order.total.toFixed(2)}</p>
                        <p>3. After successful payment, enter the transaction reference number</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || !paymentData.paymentMethod || !paymentData.paymentAccount || !paymentData.transactionId}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Payment Info'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentPage;
