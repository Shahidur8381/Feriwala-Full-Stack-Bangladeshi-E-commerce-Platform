import axios from 'axios';

const API_URL = 'http://localhost:5000';

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discount: number;
  discount_validity: string;
  final_price: number;
  category: string;
  brand: string;
  stock: number;
  deliverycharge_inside: number;
  deliverycharge_outside: number;
  sold: number;
  rating: string;
  total_rating: string;
  reviews: string;
  shopname: string;
  shopdetails: string;
  tags: string;
  image: string;
  seller_id: number;
}

export interface Seller {
  id: number;
  name: string;
  email: string;
  shopName: string;
  shopDetails: string;
  // Calculated fields that may be added by the client
  averageRating?: number;
  totalSold?: number;
  totalReviews?: number;
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/products`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const getProductsByTag = async (tag: string): Promise<Product[]> => {
  try {
    const allProducts = await getProducts();
    return allProducts.filter(product => product.tags.includes(tag));
  } catch (error) {
    console.error(`Error fetching products with tag ${tag}:`, error);
    return [];
  }
};

export const getTopRatedProducts = async (limit: number = 5): Promise<Product[]> => {
  try {
    const allProducts = await getProducts();
    return allProducts
      .sort((a, b) => {
        // Handle stored rating - it can be a number string like "5.0" or JSON object like "{}"
        let ratingA = 0;
        let ratingB = 0;
        
        try {
          // Try to parse as JSON first
          const parsedA = JSON.parse(a.rating || '{}');
          if (typeof parsedA === 'object' && Object.keys(parsedA).length > 0) {
            ratingA = Object.values(parsedA).reduce((sum: number, val: any) => sum + Number(val), 0) / 
                     Object.values(parsedA).length;
          } else {
            // If it's not a valid object, try to parse as number
            ratingA = parseFloat(a.rating || '0') || 0;
          }
        } catch {
          // If JSON parsing fails, treat as number string
          ratingA = parseFloat(a.rating || '0') || 0;
        }
        
        try {
          const parsedB = JSON.parse(b.rating || '{}');
          if (typeof parsedB === 'object' && Object.keys(parsedB).length > 0) {
            ratingB = Object.values(parsedB).reduce((sum: number, val: any) => sum + Number(val), 0) / 
                     Object.values(parsedB).length;
          } else {
            ratingB = parseFloat(b.rating || '0') || 0;
          }
        } catch {
          ratingB = parseFloat(b.rating || '0') || 0;
        }
          // Sort by rating descending, then by number of sales as tiebreaker
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        return (parseInt(String(b.sold || '0')) || 0) - (parseInt(String(a.sold || '0')) || 0);
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching top rated products:', error);
    return [];
  }
};

export const getNewestProducts = async (limit: number = 16): Promise<Product[]> => {
  try {
    const allProducts = await getProducts();
    return allProducts
      .sort((a, b) => b.id - a.id) // Assuming newer products have higher IDs
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching newest products:', error);
    return [];
  }
};

export const getSellers = async (): Promise<Seller[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/sellers`);
    console.log('Sellers API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return [];
  }
};

export const getTopRatedSellers = async (limit: number = 5): Promise<Seller[]> => {
  try {
    const [allSellers, allProducts] = await Promise.all([getSellers(), getProducts()]);
    
    // Check if allSellers is an array before processing
    if (!Array.isArray(allSellers)) {
      console.error('Expected sellers to be an array, but got:', typeof allSellers);
      return [];
    }

    // Calculate ratings for each seller based on their products
    const sellersWithRatings = allSellers.map(seller => {
      const sellerProducts = allProducts.filter(product => product.seller_id === seller.id);
      
      let totalRatingSum = 0;
      let totalSold = 0;
      let totalReviews = 0;
      
      sellerProducts.forEach(product => {
        const sold = parseInt(String(product.sold || '0')) || 0;
        totalSold += sold;
        
        // Calculate product rating
        let productRating = 0;
        try {
          const parsedRating = JSON.parse(product.rating || '{}');
          if (typeof parsedRating === 'object' && Object.keys(parsedRating).length > 0) {
            const ratingValues = Object.values(parsedRating) as number[];
            productRating = ratingValues.reduce((sum, val) => sum + Number(val), 0) / ratingValues.length;
            totalReviews += ratingValues.length;
          } else {
            productRating = parseFloat(product.rating || '0') || 0;
            if (productRating > 0) totalReviews += 1; // Assume 1 review if rating exists
          }
        } catch {
          productRating = parseFloat(product.rating || '0') || 0;
          if (productRating > 0) totalReviews += 1;
        }
        
        // Weight the rating by the number of sales for this product
        totalRatingSum += productRating * sold;
      });
      
      // Calculate average rating weighted by sales
      const averageRating = totalSold > 0 ? totalRatingSum / totalSold : 0;
      
      return {
        ...seller,
        averageRating,
        totalSold,
        totalReviews
      };
    });

    // Sort by weighted rating (sum of all ratings / total sold), with sales as tiebreaker
    return sellersWithRatings
      .filter(seller => seller.totalSold > 0 || seller.averageRating > 0) // Only include sellers with sales or ratings
      .sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        
        // Primary sort: by average rating
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        
        // Secondary sort: by total sales
        return (b.totalSold || 0) - (a.totalSold || 0);
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching top rated sellers:', error);
    return [];
  }
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    const allProducts = await getProducts();
    const searchTerm = query.toLowerCase().trim();
    
    return allProducts.filter(product => {
      // Search in multiple fields for better results
      const titleMatch = product.title?.toLowerCase().includes(searchTerm);
      const descriptionMatch = product.description?.toLowerCase().includes(searchTerm);
      const categoryMatch = product.category?.toLowerCase().includes(searchTerm);
      const brandMatch = product.brand?.toLowerCase().includes(searchTerm);
      const shopNameMatch = product.shopname?.toLowerCase().includes(searchTerm);
      const tagsMatch = product.tags?.toLowerCase().includes(searchTerm);
      
      return titleMatch || descriptionMatch || categoryMatch || brandMatch || shopNameMatch || tagsMatch;
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};