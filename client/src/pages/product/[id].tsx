import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '../../components/Layout';
import axios from 'axios';
import { Product } from '../../services/api';
import Link from 'next/link';
import { useCart } from '../../contexts/CartContext';
import { useUser } from '@clerk/nextjs';
import { FaStar } from 'react-icons/fa';
import { formatSold } from '../../utils/formatSold';

interface Review {
  id: number;
  productId: number;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
  customerName: string;
}

interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
}

interface ReviewForm {
  rating: number;
  comment: string;
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

const ProductDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCart();
  const { user } = useUser();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>({
    totalReviews: 0,
    averageRating: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0
  });
  const [canReview, setCanReview] = useState({ canReview: false, hasOrdered: false, hasReviewed: false });
  const [isDiscountValid, setIsDiscountValid] = useState(false);
  const [remainingTime, setRemainingTime] = useState<{
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Review form states
  const [reviewForm, setReviewForm] = useState<ReviewForm>({ rating: 0, comment: '' });
  const [existingReview, setExistingReview] = useState<ExistingReview | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);

  // Function to refresh product data
  const refreshProductData = async () => {
    if (id) {
      try {
        const response = await axios.get(`http://localhost:5000/api/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        console.error('Error refreshing product data:', error);
      }
    }
  };

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/products/${id}`);
          setProduct(response.data);
          
          // Fetch reviews and review summary
          const [reviewsResponse, summaryResponse] = await Promise.all([
            axios.get(`http://localhost:5000/api/reviews/product/${id}`),
            axios.get(`http://localhost:5000/api/reviews/product/${id}/summary`)
          ]);
          
          setReviews(reviewsResponse.data);
          setReviewSummary(summaryResponse.data);

          // Check discount validity
          if (response.data.discount > 0 && response.data.discount_validity) {
            const validityDate = new Date(response.data.discount_validity);
            const today = new Date();
            
            // Check if discount is still valid
            const isValid = validityDate > today;
            setIsDiscountValid(isValid);
            
            // Calculate remaining time
            if (isValid) {
              const updateRemainingTime = () => {
                const now = new Date();
                const diffTime = validityDate.getTime() - now.getTime();
                
                if (diffTime <= 0) {
                  setIsDiscountValid(false);
                  return;
                }
                
                // Calculate time components
                const seconds = Math.floor((diffTime / 1000) % 60);
                const minutes = Math.floor((diffTime / (1000 * 60)) % 60);
                const hours = Math.floor((diffTime / (1000 * 60 * 60)) % 24);
                const days = Math.floor((diffTime / (1000 * 60 * 60 * 24)) % 30);
                const months = Math.floor((diffTime / (1000 * 60 * 60 * 24 * 30)) % 12);
                const years = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30 * 12));
                
                setRemainingTime({ years, months, days, hours, minutes, seconds });
              };
              
              // Initial update
              updateRemainingTime();
              
              // Update every second
              const timer = setInterval(updateRemainingTime, 1000);
              
              // Cleanup timer on unmount
              return () => clearInterval(timer);
            }
          }
        } catch (error) {
          console.error('Error fetching product details:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [id]);
  // Separate useEffect for user-related data fetching
  useEffect(() => {
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    if (id && userEmail) {
      const fetchUserData = async () => {
        try {
          // Check if user can review
          const canReviewResponse = await axios.get(
            `http://localhost:5000/api/reviews/can-review/${id}/${userEmail}`
          );
          setCanReview(canReviewResponse.data);

          // If user has reviewed, fetch existing review
          if (canReviewResponse.data.hasReviewed) {
            const existingReviewResponse = await axios.get(
              `http://localhost:5000/api/reviews/user/${userEmail}/product/${id}`
            );
            if (existingReviewResponse.data) {
              setExistingReview(existingReviewResponse.data);
            }
          }
        } catch (error) {
          console.error('Error fetching user review data:', error);
        }
      };

      fetchUserData();
    }
  }, [id, user?.emailAddresses?.[0]?.emailAddress]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <p>The product you are looking for does not exist or has been removed.</p>
          <button 
            onClick={() => router.push('/')} 
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </Layout>
    );
  }

  // Parse JSON strings - handle both string and object formats
  let ratingObj = {};
  let reviewsObj = {};
  let shopname = '';
  let shopdetails = '';

  try {
    // Handle rating - could be JSON string or already an object
    if (typeof product.rating === 'string') {
      ratingObj = JSON.parse(product.rating || '{}');
    } else if (product.rating) {
      ratingObj = product.rating;
    }

    // Handle reviews - could be JSON string or already an object
    if (typeof product.reviews === 'string') {
      reviewsObj = JSON.parse(product.reviews || '{}');
    } else if (product.reviews) {
      reviewsObj = product.reviews;
    }

    // Handle shopname - could be JSON string or plain string
    if (typeof product.shopname === 'string') {
      try {
        const parsed = JSON.parse(product.shopname);
        shopname = typeof parsed === 'string' ? parsed : product.shopname;
      } catch {
        shopname = product.shopname; // Use as is if not valid JSON
      }
    }

    // Handle shopdetails - could be JSON string or plain string
    if (typeof product.shopdetails === 'string') {
      try {
        const parsed = JSON.parse(product.shopdetails);
        shopdetails = typeof parsed === 'string' ? parsed : product.shopdetails;
      } catch {
        shopdetails = product.shopdetails; // Use as is if not valid JSON
      }
    }
  } catch (error) {
    console.error('Error parsing product data:', error);
  }
  // Calculate average rating - use database value if available, otherwise legacy
  const ratingValues = Object.values(ratingObj);
  const legacyRating = ratingValues.length > 0 
    ? ratingValues.reduce((sum: number, val: any) => sum + Number(val), 0) / ratingValues.length 
    : 0;
  const averageRating = reviewSummary.averageRating > 0 ? reviewSummary.averageRating : legacyRating;

  // Determine the price to display based on discount validity
  const displayPrice = product.discount > 0 && isDiscountValid ? product.final_price : product.price;
  // Format remaining time as string
  const formatRemainingTime = () => {
    const { years, months, days, hours, minutes, seconds } = remainingTime;
    
    let timeString = '';
    
    if (years > 0) timeString += `${years} year${years !== 1 ? 's' : ''} `;
    if (months > 0) timeString += `${months} month${months !== 1 ? 's' : ''} `;
    if (days > 0) timeString += `${days} day${days !== 1 ? 's' : ''} `;
    if (hours > 0) timeString += `${hours} hour${hours !== 1 ? 's' : ''} `;
    if (minutes > 0) timeString += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
    if (seconds > 0) timeString += `${seconds} second${seconds !== 1 ? 's' : ''}`;
    
    return timeString.trim();
  };
  const handleReviewSubmit = async () => {
    if (!reviewForm.rating || !reviewForm.comment.trim()) {
      alert('Please provide both rating and comment');
      return;
    }

    setSubmittingReview(true);
    try {
      let response;
      
      if (isEditingReview && existingReview) {
        // Update existing review
        response = await fetch(`http://localhost:5000/api/reviews/${existingReview.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rating: reviewForm.rating,
            comment: reviewForm.comment,
            customerEmail: user?.emailAddresses[0]?.emailAddress
          }),
        });      } else {
        // Submit new review - need to find an order ID for this product
        try {
          const ordersResponse = await fetch(`http://localhost:5000/api/orders/user/${user?.emailAddresses[0]?.emailAddress}`);
          
          if (!ordersResponse.ok) {
            throw new Error(`Failed to fetch orders: ${ordersResponse.status} ${ordersResponse.statusText}`);
          }
          
          const orders = await ordersResponse.json();
          
          // Find an order that contains this product
          let orderId = null;
          for (const order of orders) {
            if (order.items?.some((item: any) => item.id === parseInt(id as string))) {
              orderId = order.orderId;
              break;
            }
          }

          if (!orderId) {
            alert('You must purchase this product before reviewing it.');
            return;
          }

          response = await fetch('http://localhost:5000/api/reviews', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: parseInt(id as string),
              rating: reviewForm.rating,
              comment: reviewForm.comment,
              orderId: orderId,
              customerEmail: user?.emailAddresses[0]?.emailAddress
            }),
          });
        } catch (ordersError) {
          console.error('Error fetching orders:', ordersError);
          alert('Failed to verify purchase history. Please try again.');
          return;
        }
      }

      if (response?.ok) {
        alert(isEditingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
        
        // Refresh reviews and summary
        const [reviewsResponse, summaryResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/reviews/product/${id}`),
          axios.get(`http://localhost:5000/api/reviews/product/${id}/summary`)
        ]);
        
        setReviews(reviewsResponse.data);
        setReviewSummary(summaryResponse.data);
        
        // Reset form and state
        setReviewForm({ rating: 0, comment: '' });
        setShowReviewForm(false);
        setIsEditingReview(false);
        
        // Update canReview state
        setCanReview(prev => ({ ...prev, hasReviewed: true, canReview: false }));
        
        // Fetch updated existing review
        if (!isEditingReview) {
          const newReviewResponse = await axios.get(
            `http://localhost:5000/api/reviews/user/${user?.emailAddresses[0]?.emailAddress}/product/${id}`
          );
          if (newReviewResponse.data) {
            setExistingReview(newReviewResponse.data);
          }
        } else if (existingReview) {
          setExistingReview({
            ...existingReview,
            rating: reviewForm.rating,
            comment: reviewForm.comment
          });
        }      } else {
        let errorMessage = 'Failed to submit review';
        try {
          const errorData = await response?.json();
          errorMessage = errorData?.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON (e.g., HTML error page), get text
          try {
            const errorText = await response?.text();
            if (errorText?.includes('<!DOCTYPE')) {
              errorMessage = 'Server error - please check if the server is running correctly';
            } else {
              errorMessage = errorText || errorMessage;
            }
          } catch (textError) {
            console.error('Error parsing response:', parseError, textError);
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      alert(`Failed to ${isEditingReview ? 'update' : 'submit'} review: ${errorMessage}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  const startEditReview = () => {
    if (existingReview) {
      setReviewForm({
        rating: existingReview.rating,
        comment: existingReview.comment
      });
      setIsEditingReview(true);
      setShowReviewForm(true);
    }
  };

  const startNewReview = () => {
    setReviewForm({ rating: 0, comment: '' });
    setIsEditingReview(false);
    setShowReviewForm(true);
  };

  const cancelReview = () => {
    setReviewForm({ rating: 0, comment: '' });
    setShowReviewForm(false);
    setIsEditingReview(false);
  };  const handleBuyNow = () => {
    if (!product) return;
    
    // Check if requested quantity is available
    if (quantity > product.stock) {
      alert(`Only ${product.stock} items available in stock.`);
      return;
    }
    
    if (product.stock === 0) {
      alert('This product is out of stock.');
      return;
    }
    
    try {
      // Add to cart first
      addToCart(product, quantity);
      
      // Show success feedback
      alert(`${quantity} ${product.title} added to cart. Redirecting to checkout...`);
      
      // Redirect to checkout
      router.push('/checkout');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const renderStarRating = () => {
    return (
      <div className="flex items-center mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`text-2xl cursor-pointer mr-1 ${
              star <= reviewForm.rating ? 'text-yellow-500' : 'text-gray-300'
            }`}
            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
          />
        ))}
        <span className="ml-2 text-gray-600">
          {reviewForm.rating > 0 ? `${reviewForm.rating} star${reviewForm.rating !== 1 ? 's' : ''}` : 'Click to rate'}
        </span>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="relative h-96 rounded-lg overflow-hidden">
            <Image 
              src={product.image 
                ? `http://localhost:5000${product.image}` 
                : '/imageWhenNoImage/NoImage.jpg'} 
              alt={product.title}
              fill={true}
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
              priority={true}
            />
          </div>

          {/* Product Details */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <div className="flex items-center mb-4">
              <div className="flex items-center mr-4">
                <span className="text-yellow-500 mr-1">★</span>
                <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-gray-500">({reviewSummary.totalReviews} reviews)</span>
            </div>

            {/* Category and Brand - New Section */}
            <div className="mb-4 flex flex-wrap gap-2">
              <Link href={`/search?category=${encodeURIComponent(product.category)}`} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">
                Category: {product.category}
              </Link>
              <Link href={`/search?brand=${encodeURIComponent(product.brand)}`} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">
                Brand: {product.brand}
              </Link>
            </div>

            <div className="mb-6">
              {product.discount > 0 && isDiscountValid ? (
                <div>
                  <span className="text-gray-500 line-through mr-2">${product.price}</span>
                  <span className="text-2xl font-bold text-blue-600">${product.final_price}</span>
                  <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                    {product.discount}% OFF
                  </span>
                  {isDiscountValid && (
                    <div className="mt-2 text-sm text-red-600">
                      Offer ends in {formatRemainingTime()}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-2xl font-bold text-blue-600">${product.price}</span>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{product.description}</p>
            </div>            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Shop Information</h3>
              <Link href={`/shop/${product.seller_id}`} className="text-blue-600 hover:underline">
                <p className="font-medium">{shopname || 'Shop Name'}</p>
              </Link>
              <p className="text-gray-700">{shopdetails || 'Shop Details'}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Product Stats</h3>
              <div className="flex space-x-6 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Stock:</span> {product.stock} available
                </div>                <div>
                  <span className="font-medium">Sold:</span> {formatSold(product.sold)}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Delivery Information</h3>
              <p>Inside City: ${product.deliverycharge_inside}</p>
              <p>Outside City: ${product.deliverycharge_outside}</p>
            </div>            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div className="flex items-center">
                <button 
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="bg-gray-200 px-3 py-1 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <input 
                  type="number" 
                  min="1" 
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => {
                    const newQuantity = Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1));
                    setQuantity(newQuantity);
                  }}
                  className="w-16 text-center border-t border-b border-gray-300 py-1"
                />
                <button 
                  onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                  disabled={quantity >= product.stock}
                  className="bg-gray-200 px-3 py-1 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              {quantity > product.stock && (
                <p className="text-red-500 text-sm mt-1">
                  Only {product.stock} items available
                </p>
              )}
            </div>            <div className="flex space-x-4">
              <button 
                onClick={() => {
                  if (product.stock === 0) {
                    alert('This product is out of stock.');
                    return;
                  }
                  if (quantity > product.stock) {
                    alert(`Only ${product.stock} items available in stock.`);
                    return;
                  }
                  try {
                    addToCart(product, quantity);
                    alert(`${quantity} ${product.title} added to cart`);
                  } catch (error) {
                    console.error('Error adding to cart:', error);
                    alert('Failed to add item to cart. Please try again.');
                  }
                }}
                disabled={product.stock === 0}
                className={`px-6 py-2 rounded-lg ${
                  product.stock === 0 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button 
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className={`px-6 py-2 rounded-lg ${
                  product.stock === 0 
                    ? 'border border-gray-400 text-gray-400 cursor-not-allowed' 
                    : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                }`}
              >
                {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          
          {/* Review Summary */}
          {reviewSummary.totalReviews > 0 && (
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="flex items-center mb-4">
                <div className="text-4xl font-bold text-blue-600 mr-4">
                  {reviewSummary.averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-xl ${
                          star <= Math.round(reviewSummary.averageRating)
                            ? 'text-yellow-500'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    Based on {reviewSummary.totalReviews} reviews
                  </div>
                </div>
              </div>
              
              {/* Rating Breakdown */}
              <div className="space-y-2">
                {[
                  { stars: 5, count: reviewSummary.fiveStars },
                  { stars: 4, count: reviewSummary.fourStars },
                  { stars: 3, count: reviewSummary.threeStars },
                  { stars: 2, count: reviewSummary.twoStars },
                  { stars: 1, count: reviewSummary.oneStar },
                ].map(({ stars, count }) => (
                  <div key={stars} className="flex items-center text-sm">
                    <span className="w-8">{stars}★</span>
                    <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{
                          width: `${reviewSummary.totalReviews > 0 ? (count / reviewSummary.totalReviews) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <span className="w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}          {/* Individual Reviews */}
          <div className="space-y-6">            {/* Review Prompt for Eligible Users */}
            {user && (
              <div className="bg-blue-50 p-4 rounded-lg">
                {canReview.canReview && !canReview.hasReviewed ? (
                  <div>
                    <p className="text-blue-800 font-medium mb-2">
                      You can review this product!
                    </p>
                    {!showReviewForm ? (
                      <button
                        onClick={startNewReview}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Write a Review
                      </button>
                    ) : (
                      <button
                        onClick={cancelReview}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
                      >
                        Cancel Review
                      </button>
                    )}
                  </div>
                ) : canReview.hasReviewed && existingReview ? (
                  <div>
                    <p className="text-green-800 font-medium mb-2">
                      ✓ Your Review
                    </p>
                    <div className="bg-white p-3 rounded border mb-3">
                      <div className="flex items-center mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-sm ${
                              star <= existingReview.rating ? 'text-yellow-500' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-2 text-gray-600 text-sm">
                          {new Date(existingReview.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{existingReview.comment}</p>
                    </div>
                    {!showReviewForm ? (
                      <button
                        onClick={startEditReview}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Edit Review
                      </button>
                    ) : (
                      <button
                        onClick={cancelReview}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                ) : canReview.hasOrdered ? (
                  <p className="text-gray-600">
                    You have purchased this product but already submitted a review.
                  </p>
                ) : (
                  <p className="text-gray-600">
                    Purchase this product to leave a review.
                  </p>
                )}
              </div>
            )}

            {/* Review Form */}
            {showReviewForm && (
              <div className="bg-white border border-gray-200 p-6 rounded-lg mt-4">
                <h3 className="text-lg font-semibold mb-4">
                  {isEditingReview ? 'Edit Your Review' : 'Write a Review'}
                </h3>
                
                {/* Star Rating */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating *
                  </label>
                  {renderStarRating()}
                </div>

                {/* Comment */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review *
                  </label>
                  <textarea
                    rows={4}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Share your experience with this product..."
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleReviewSubmit}
                    disabled={submittingReview || !reviewForm.rating || !reviewForm.comment.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submittingReview 
                      ? (isEditingReview ? 'Updating...' : 'Submitting...') 
                      : (isEditingReview ? 'Update Review' : 'Submit Review')
                    }
                  </button>
                  <button
                    onClick={cancelReview}
                    disabled={submittingReview}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 disabled:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6">
                  <div className="flex items-center mb-2">
                    <div className="flex items-center mr-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${
                            star <= review.rating ? 'text-yellow-500' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="font-medium text-gray-800">{review.customerName}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No reviews yet. Be the first to review this product!</p>
              </div>
            )}          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetailsPage;