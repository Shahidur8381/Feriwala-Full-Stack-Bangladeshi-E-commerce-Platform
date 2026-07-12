import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../contexts/AuthContext';
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
  const [sslLoading, setSslLoading] = useState(false);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderIdParam}`);
      if (response.ok) {
        const orderData = await response.json();
        if (orderData.customerEmail !== email) {
          router.push('/profile');
          return;
        }
        if (orderData.status !== 'unpaid') {
          router.push(`/orders/${orderIdParam}`);
          return;
        }
        setOrder(orderData);
      } else {
        router.push('/profile');
      }
    } catch (error) {
      router.push('/profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PaymentData, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  // ── SSLCommerz payment gateway ─────────────────────────────────────────────
  const handleSSLCommerzPayment = async () => {
    if (!orderId) return;
    setSslLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/ssl-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        // Redirect to SSLCommerz payment page
        window.location.href = data.url;
      } else {
        alert(`Failed to initiate payment gateway: ${data.error || 'Unknown error'}`);
        setSslLoading(false);
      }
    } catch (error) {
      alert('Failed to connect to payment gateway. Please try again.');
      setSslLoading(false);
    }
  };

  // ── Manual payment submission ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData.paymentMethod || !paymentData.paymentAccount || !paymentData.transactionId) {
      alert('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      if (response.ok) {
        alert('Payment information submitted successfully! Your order status has been updated to pending.');
        router.push(`/orders/${orderId}`);
      } else {
        const error = await response.json();
        alert(`Payment submission failed: ${error.error}`);
      }
    } catch (error) {
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

  if (!isSignedIn || !order) return null;

  const paymentMethods = [
    { value: 'bkash', label: 'bKash', icon: <span className="text-pink-500 font-bold text-lg">bKash</span> },
    { value: 'nagad', label: 'Nagad', icon: <span className="text-orange-500 font-bold text-lg">Nagad</span> },
    { value: 'rocket', label: 'Rocket', icon: <span className="text-purple-600 font-bold text-lg">Rocket</span> },
    { value: 'upay', label: 'Upay', icon: <span className="text-blue-600 font-bold text-lg">Upay</span> },
    { value: 'visa', label: 'Visa', icon: <span className="text-blue-800 font-bold text-lg italic">VISA</span> },
    { value: 'mastercard', label: 'Mastercard', icon: <span className="text-red-500 font-bold text-lg">MC</span> }
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
                Total Amount: <span className="text-green-600">৳{Number(order.total).toFixed(2)}</span>
              </p>
              {order.deliveryCharge > 0 && (
                <p className="text-sm text-gray-600">
                  (Including delivery charge: ৳{Number(order.deliveryCharge).toFixed(2)})
                </p>
              )}
            </div>
          </div>

          {/* ── SSLCommerz Payment Gateway ── */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">🔒</div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Pay Online (Recommended)</h2>
                <p className="text-sm text-gray-500">Secure payment via SSLCommerz Gateway</p>
              </div>
              <span className="ml-auto bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">SECURE</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Pay instantly using your card, mobile banking (bKash, Nagad, Rocket), or net banking.
              Your order will be confirmed automatically upon successful payment.
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {['bKash', 'Nagad', 'Rocket', 'Visa', 'Mastercard', 'DBBL'].map(m => (
                <span key={m} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border">{m}</span>
              ))}
            </div>
            <button
              id="ssl-pay-btn"
              onClick={handleSSLCommerzPayment}
              disabled={sslLoading}
              className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold rounded-xl text-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-md"
            >
              {sslLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Connecting to Gateway…
                </>
              ) : (
                <>
                  🔒 Pay ৳{Number(order.total).toFixed(2)} via SSLCommerz
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-sm text-gray-400 font-medium">OR PAY MANUALLY</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Manual Payment Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">Manual Payment</h2>
            <p className="text-sm text-gray-500 mb-6">
              Send money via mobile banking and enter your transaction details below.
              Your order will remain <strong>pending</strong> until manually verified by our team.
            </p>

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

              {/* Account Number */}
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
                        <p>4. Enter amount: ৳{Number(order.total).toFixed(2)}</p>
                        <p>5. Enter reference: Order-{order.orderId.substring(0, 8)}</p>
                        <p>6. Complete the payment and enter the transaction ID below</p>
                      </div>
                    )}
                    {paymentData.paymentMethod === 'nagad' && (
                      <div>
                        <p>1. Dial *167# or open Nagad app</p>
                        <p>2. Select "Send Money"</p>
                        <p>3. Enter merchant number: 01XXXXXXXXX</p>
                        <p>4. Enter amount: ৳{Number(order.total).toFixed(2)}</p>
                        <p>5. Complete the payment and enter the transaction ID below</p>
                      </div>
                    )}
                    {(paymentData.paymentMethod === 'rocket' || paymentData.paymentMethod === 'upay') && (
                      <div>
                        <p>1. Open your {paymentData.paymentMethod} app</p>
                        <p>2. Select "Send Money"</p>
                        <p>3. Enter merchant number: 01XXXXXXXXX</p>
                        <p>4. Enter amount: ৳{Number(order.total).toFixed(2)}</p>
                        <p>5. Complete the payment and enter the transaction ID below</p>
                      </div>
                    )}
                    {(paymentData.paymentMethod === 'visa' || paymentData.paymentMethod === 'mastercard') && (
                      <div>
                        <p>1. Use your card for online payment</p>
                        <p>2. Amount: ৳{Number(order.total).toFixed(2)}</p>
                        <p>3. After successful payment, enter the transaction reference number</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit */}
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
