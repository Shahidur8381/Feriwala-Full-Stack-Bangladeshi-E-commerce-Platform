import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

const PaymentSuccessPage: React.FC = () => {
  const router = useRouter();
  const { orderId } = router.query;

  useEffect(() => {
    // Auto-redirect to order details after 5 seconds
    if (orderId) {
      const timer = setTimeout(() => {
        router.push(`/orders/${orderId}`);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [orderId, router]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-10 shadow-lg">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-3">Payment Successful!</h1>
            <p className="text-green-600 mb-2">Your payment has been confirmed and your order is now paid.</p>
            {orderId && (
              <p className="text-sm text-gray-500 mb-6">
                Order ID: <span className="font-mono font-semibold">#{(orderId as string).slice(-8)}</span>
              </p>
            )}
            <p className="text-xs text-gray-400 mb-6">Redirecting to order details in 5 seconds…</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/orders/${orderId}`)}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                View Order Details
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition"
              >
                Go to My Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSuccessPage;
