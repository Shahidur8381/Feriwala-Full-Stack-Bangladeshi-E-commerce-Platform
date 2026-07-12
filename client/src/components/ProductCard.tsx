import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '../services/api';
import axios from 'axios';
import { formatSold } from '../utils/formatSold';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isDiscountValid, setIsDiscountValid] = useState(false);
  const [reviewSummary, setReviewSummary] = useState({ totalReviews: 0, averageRating: 0 });
  const [remainingTime, setRemainingTime] = useState<{
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Fetch review summary for this product
    const fetchReviewSummary = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/product/${product.id}/summary`);
        setReviewSummary({
          totalReviews: Number(response.data.totalReviews) || 0,
          averageRating: Number(response.data.averageRating) || 0
        });
      } catch (error) {
        console.error('Error fetching review summary:', error);
      }
    };

    fetchReviewSummary();    // Check discount validity
    if (product.discount > 0 && product.discount_validity) {
      const validityDate = new Date(product.discount_validity);
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
  }, [product]);
  // Parse the rating object - fallback to database values
  const ratingObj = JSON.parse(product.rating || '{}');
  const ratingValues = Object.values(ratingObj);
  const legacyRating = ratingValues.length > 0 
    ? ratingValues.reduce((sum: number, val: any) => sum + Number(val), 0) / ratingValues.length 
    : 0;
  
  // Use database rating if available, otherwise fallback to legacy rating
  const averageRating = Number(reviewSummary.averageRating) > 0 ? Number(reviewSummary.averageRating) : legacyRating;
  const totalReviews = Number(reviewSummary.totalReviews);

  // Create a valid image URL or use a fallback
  const imageUrl = product.image 
    ? (product.image.startsWith('http') ? product.image : `${process.env.NEXT_PUBLIC_API_URL}${product.image}`)
    : '/imageWhenNoImage/NoImage.jpg';

  // Determine the price to display based on discount validity
  const displayPrice = product.discount > 0 && isDiscountValid ? product.final_price : product.price;

  // Format remaining time as string
  const formatRemainingTime = () => {
    const { years, months, days, hours, minutes, seconds } = remainingTime;
    const parts = [];
    
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} min`);
    if (seconds > 0) parts.push(`${seconds} sec`);
    
    // If less than a day, show hours, minutes and seconds
    if (years === 0 && months === 0 && days === 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    
    // If less than a month, show days and hours
    if (years === 0 && months === 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    
    // If less than a year, show months and days
    if (years === 0) {
      return `${months}m ${days}d`;
    }
    
    // Show years, months and days
    return `${years}y ${months}m ${days}d`;
  };

  return (
    <Link href={`/product/${product.id}`}>
      <div className="fw-card group cursor-pointer h-full flex flex-col">
        <div className="relative h-48 w-full overflow-hidden">
          <Image 
            src={imageUrl} 
            alt={product.title}
            fill={true}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            style={{ objectFit: 'cover' }}
            className="group-hover:scale-105 transition-transform duration-500"
            priority={false}
          />
          {product.discount > 0 && isDiscountValid && (
            <div className="fw-badge-discount">
              -{product.discount}%
            </div>
          )}
        </div>
        
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="text-sm font-semibold truncate text-gray-800 group-hover:text-green-700 transition-colors">{product.title}</h3>
          
          <div className="flex justify-between items-center mt-2">
            <div>
              {product.discount > 0 && isDiscountValid ? (
                <>
                  <span className="fw-price-old text-xs mr-1">৳{product.price}</span>
                  <span className="fw-price text-base">৳{product.final_price}</span>
                </>
              ) : (
                <span className="fw-price text-base">৳{product.price}</span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-yellow-500 text-xs">★</span>
              <span className="text-xs font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-gray-400 text-[10px]">({totalReviews})</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-1.5 truncate">{product.shopname}</p>
          
          <div className="flex justify-between items-center mt-auto pt-2 text-[10px] text-gray-400">
            <span>{formatSold(product.sold)}</span>
            <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>
          
          {product.discount > 0 && isDiscountValid && (
            <p className="text-[10px] text-red-500 mt-1 font-medium">
              ⏰ {formatRemainingTime()}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;