import React from 'react';
import Link from 'next/link';
import { Seller } from '../services/api';

interface ShopCardProps {
  seller: Seller;
}

const ShopCard: React.FC<ShopCardProps> = ({ seller }) => {
  return (
    <Link href={`/shop/${seller.id}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-xl font-semibold text-center mb-2">{seller.shopName}</h3>
        <p className="text-gray-600 text-center mb-4 truncate">{seller.shopDetails}</p>
          {/* Rating and sold information - always shown */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-center mb-1">
            <span className="text-yellow-400">★</span>
            <span className="ml-1 text-sm font-medium">
              {seller.averageRating !== undefined && seller.averageRating > 0 
                ? seller.averageRating.toFixed(1) 
                : '0.0'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {seller.totalSold !== undefined ? seller.totalSold : 0} sold
          </span>
        </div>
        
        <div className="text-center">
          <span className="text-sm text-gray-500">Owner: {seller.name}</span>
        </div>
      </div>
    </Link>
  );
};

export default ShopCard;