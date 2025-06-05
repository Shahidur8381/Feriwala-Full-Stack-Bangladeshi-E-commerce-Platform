import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '../services/api';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
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
    // Check discount validity
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

  // Parse the rating object
  const ratingObj = JSON.parse(product.rating || '{}');
  const ratingValues = Object.values(ratingObj);
  const averageRating = ratingValues.length > 0 
    ? ratingValues.reduce((sum: number, val: any) => sum + Number(val), 0) / ratingValues.length 
    : 0;

  // Create a valid image URL or use a fallback
  const imageUrl = product.image 
    ? `http://localhost:5000${product.image}` 
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
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="relative h-48 w-full">
          <Image 
            src={imageUrl} 
            alt={product.title}
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            priority={false}
          />
          {product.discount > 0 && isDiscountValid && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
              {product.discount}% OFF
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold truncate">{product.title}</h3>
          
          <div className="flex justify-between items-center mt-2">
            <div>
              {product.discount > 0 && isDiscountValid ? (
                <>
                  <span className="text-gray-500 line-through mr-2">${product.price}</span>
                  <span className="text-blue-600 font-bold">${product.final_price}</span>
                </>
              ) : (
                <span className="text-blue-600 font-bold">${product.price}</span>
              )}
            </div>
            
            <div className="flex items-center">
              <span className="text-yellow-500 mr-1">★</span>
              <span>{averageRating.toFixed(1)}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-2 truncate">{product.shopname}</p>
          
          {product.discount > 0 && isDiscountValid && (
            <p className="text-xs text-red-600 mt-1">
              Offer ends in {formatRemainingTime()}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;