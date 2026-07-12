import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

const PaymentFailedPage: React.FC = () => {
  const router = useRouter();
  const { orderId, reason } = router.query;

  const reasonMessages: Record<string, string> = {
    payment_failed: 'Your payment was declined. Please try again.',
    validation_failed: 'Payment validation failed. Contact support if money was deducted.',
    invalid_status: 'The payment status was invalid. Please try again.',
    server_error: 'A server error occurred. Please try again or contact support.',
  };

  const message = reason ? reasonMessages[reason as string] || 'Payment was not completed.' : 'Payment was not completed.';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-10 shadow-lg">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-red-700 mb-3">Payment Failed</h1>
            <p className="text-red-600 mb-6">{message}</p>
            {orderId && (
              <p className="text-sm text-gray-500 mb-6">
                Order ID: <span className="font-mono font-semibold">#{(orderId as string).slice(-8)}</span>
              </p>
            )}
            <div className="space-y-3">
              {orderId && (
                <button
                  onClick={() => router.push(`/payment/${orderId}`)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Try Again
                </button>
              )}
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

export default PaymentFailedPage;
