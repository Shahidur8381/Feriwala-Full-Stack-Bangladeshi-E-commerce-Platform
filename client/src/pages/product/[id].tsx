import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '../../components/Layout';
import axios from 'axios';
import { Product } from '../../services/api';
import Link from 'next/link';

const ProductDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDiscountValid, setIsDiscountValid] = useState(false);
  const [remainingTime, setRemainingTime] = useState<{
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/products/${id}`);
          setProduct(response.data);
          
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

  // Calculate average rating
  const ratingValues = Object.values(ratingObj);
  const averageRating = ratingValues.length > 0 
    ? ratingValues.reduce((sum: number, val: any) => sum + Number(val), 0) / ratingValues.length 
    : 0;

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
                <span>{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-gray-500">{Object.keys(reviewsObj).length} reviews</span>
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
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Shop Information</h3>
              <Link href={`/shop/${product.seller_id}`} className="text-blue-600 hover:underline">
                <p className="font-medium">{shopname || 'Shop Name'}</p>
              </Link>
              <p className="text-gray-700">{shopdetails || 'Shop Details'}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Delivery Information</h3>
              <p>Inside City: ${product.deliverycharge_inside}</p>
              <p>Outside City: ${product.deliverycharge_outside}</p>
            </div>

            <div className="flex space-x-4">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Add to Cart
              </button>
              <button className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50">
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetailsPage;