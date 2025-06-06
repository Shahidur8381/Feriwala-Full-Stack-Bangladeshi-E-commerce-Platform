import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

interface OrderItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
}

interface Review {
  id?: number;
  productId: number;
  rating: number;
  comment: string;
  isEdit?: boolean;
}

interface ExistingReview {
  id: number;
  productId: number;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
  customerName: string;
}

const OrderDetailsPage: React.FC = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const { orderId } = router.query;  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<{ [key: number]: Review }>({});
  const [existingReviews, setExistingReviews] = useState<{ [key: number]: ExistingReview }>({});
  const [submittingReview, setSubmittingReview] = useState<number | null>(null);

  // Redirect if not signed in
  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (orderId && typeof orderId === 'string') {
      fetchOrder(orderId);
    }
  }, [orderId]);
  const fetchOrder = async (orderIdParam: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderIdParam}`);
      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);

        // Fetch existing reviews for products in this order
        if (user?.emailAddresses?.[0]?.emailAddress) {
          const reviewPromises = orderData.items.map(async (item: OrderItem) => {
            try {
              const reviewResponse = await fetch(`http://localhost:5000/api/reviews/user/${user.emailAddresses[0].emailAddress}/product/${item.id}`);
              if (reviewResponse.ok) {
                const reviewData = await reviewResponse.json();
                return { productId: item.id, review: reviewData };
              }
            } catch (error) {
              console.error('Error fetching review for product', item.id, error);
            }
            return { productId: item.id, review: null };
          });

          const reviewResults = await Promise.all(reviewPromises);
          const existingReviewsMap: { [key: number]: ExistingReview } = {};
          
          reviewResults.forEach(({ productId, review }) => {
            if (review) {
              existingReviewsMap[productId] = review;
            }
          });
          
          setExistingReviews(existingReviewsMap);
        }
      } else {
        console.error('Order not found');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleReviewChange = (productId: number, field: keyof Review, value: number | string) => {
    setReviews(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        productId,
        [field]: value,
        isEdit: !!existingReviews[productId]
      }
    }));
  };
  const submitReview = async (productId: number) => {
    const review = reviews[productId];
    const existingReview = existingReviews[productId];
    
    if (!review || !review.rating || !review.comment) {
      alert('Please provide both rating and comment');
      return;
    }

    setSubmittingReview(productId);
    try {
      let response;
      
      if (existingReview) {
        // Update existing review
        response = await fetch(`http://localhost:5000/api/reviews/${existingReview.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rating: review.rating,
            comment: review.comment,
            customerEmail: user?.emailAddresses[0]?.emailAddress
          }),
        });
      } else {
        // Create new review
        response = await fetch('http://localhost:5000/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: review.productId,
            rating: review.rating,
            comment: review.comment,
            orderId: order?.orderId,
            customerEmail: user?.emailAddresses[0]?.emailAddress
          }),
        });
      }

      if (response.ok) {
        const result = await response.json();
        alert(existingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
        
        // Update existing reviews state
        if (existingReview) {
          setExistingReviews(prev => ({
            ...prev,
            [productId]: {
              ...existingReview,
              rating: review.rating,
              comment: review.comment
            }
          }));
        } else {
          // For new review, refetch the review data
          const newReviewResponse = await fetch(`http://localhost:5000/api/reviews/user/${user?.emailAddresses[0]?.emailAddress}/product/${productId}`);
          if (newReviewResponse.ok) {
            const newReviewData = await newReviewResponse.json();
            if (newReviewData) {
              setExistingReviews(prev => ({
                ...prev,
                [productId]: newReviewData
              }));
            }
          }
        }
        
        // Clear the review form
        setReviews(prev => {
          const updated = { ...prev };
          delete updated[productId];
          return updated;
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      alert(`Failed to ${existingReview ? 'update' : 'submit'} review: ${errorMessage}`);
    } finally {
      setSubmittingReview(null);
    }
  };

  const startEditReview = (productId: number) => {
    const existingReview = existingReviews[productId];
    if (existingReview) {
      setReviews(prev => ({
        ...prev,
        [productId]: {
          productId,
          rating: existingReview.rating,
          comment: existingReview.comment,
          isEdit: true
        }
      }));
    }
  };

  const cancelEdit = (productId: number) => {
    setReviews(prev => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  };

  const renderStarRating = (productId: number) => {
    const currentRating = reviews[productId]?.rating || 0;
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => handleReviewChange(productId, 'rating', i)}
          className={`text-xl ${i <= currentRating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
        >
          <FaStar />
        </button>
      );
    }
    
    return <div className="flex space-x-1">{stars}</div>;
  };

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

  if (loading) {
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

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <button 
              onClick={() => router.push('/profile')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              View Profile
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Order #{order.orderId}</h1>
              <p className="text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {order.status}
              </span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <p><strong>Name:</strong> {order.customerName}</p>
              <p><strong>Email:</strong> {order.customerEmail}</p>
              <p><strong>Phone:</strong> {order.customerPhone}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Delivery Address</h3>
              <p>{order.customerAddress}</p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-4 mb-4">
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
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-gray-600">Price: ${item.price}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>                  {/* Review Section */}
                  {(order.status === 'delivered' || order.status === 'confirmed') && (
                    <div className="border-t pt-4">
                      {existingReviews[item.id] && !reviews[item.id] ? (
                        // Show existing review
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-green-800">Your Review:</h5>
                            <button
                              onClick={() => startEditReview(item.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              Edit Review
                            </button>
                          </div>
                          <div className="flex items-center mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaStar
                                key={star}
                                className={`text-lg ${
                                  star <= existingReviews[item.id].rating
                                    ? 'text-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-sm text-gray-600">
                              {new Date(existingReviews[item.id].createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{existingReviews[item.id].comment}</p>
                        </div>
                      ) : (
                        // Show review form (new or edit)
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium">
                              {existingReviews[item.id] ? 'Edit your review:' : 'Rate this product:'}
                            </h5>
                            {reviews[item.id] && existingReviews[item.id] && (
                              <button
                                onClick={() => cancelEdit(item.id)}
                                className="text-gray-600 hover:text-gray-800 text-sm underline"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                              {renderStarRating(item.id)}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                              <textarea
                                value={reviews[item.id]?.comment || ''}
                                onChange={(e) => handleReviewChange(item.id, 'comment', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Share your experience with this product..."
                              />                            </div>
                            <button
                              onClick={() => submitReview(item.id)}
                              disabled={submittingReview === item.id}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {submittingReview === item.id ? 'Submitting...' : 'Submit Review'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Order Total */}
          <div className="border-t pt-4 mt-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount</span>
              <span className="text-xl font-bold text-blue-600">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button 
            onClick={() => router.push('/products')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mr-4"
          >
            Continue Shopping
          </button>
          <button 
            onClick={() => router.push('/profile')}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            View Profile
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetailsPage;
